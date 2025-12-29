import { TaskRepository } from '../repositories/task.repository';
import { TaskWatcherRepository } from '../repositories/task-watcher.repository';
import { TaskFileRepository } from '../repositories/task-file.repository';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import { TaskStatus } from '../enums/task-status.enum';
import Task from '../database/models/Task';
import TaskWatcher from '../database/models/TaskWatcher';
import TaskFile from '../database/models/TaskFile';
import { PaginationOptions, PaginationMeta } from '../interfaces/pagination.interface';
import { generatePaginationMeta } from '../utils/helper';
import { WinstonLogger } from '../utils/logger/winston.logger';
import { FindOptions, Op } from 'sequelize';
import { RabbitMQService } from './rabbitmq.service';

export class TaskService {
  private readonly taskRepository: TaskRepository;
  private readonly taskWatcherRepository: TaskWatcherRepository;
  private readonly taskFileRepository: TaskFileRepository;
  private readonly logger: WinstonLogger;
  private readonly rabbitMQService: RabbitMQService;

  constructor(logger?: WinstonLogger) {
    this.taskRepository = new TaskRepository();
    this.taskWatcherRepository = new TaskWatcherRepository();
    this.taskFileRepository = new TaskFileRepository();
    this.logger = logger || new WinstonLogger('TaskService');
    this.rabbitMQService = new RabbitMQService(logger);
  }

  private validateStatusTransition(currentStatus: TaskStatus, newStatus: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.TODO],
      [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS, TaskStatus.TODO],
      [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ClientErrorException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        ResponseStatus.BAD_REQUEST
      );
    }
  }

  async createTask(
    dto: CreateTaskDto,
    userId: number
  ): Promise<Task> {
    const task = await this.taskRepository.create({
      project_id: dto.project_id,
      title: dto.title,
      description: dto.description,
      status: dto.status || TaskStatus.TODO,
      assigned_to: dto.assigned_to,
      created_by: userId,
      due_date: dto.due_date ? new Date(dto.due_date) : undefined,
    });

    await this.taskWatcherRepository.create({
      task_id: task.id,
      user_id: userId,
    });

    if (dto.file_ids && dto.file_ids.length > 0) {
      await this.attachFilesToTask(task.id, dto.file_ids);
    }

    if (task.assigned_to) {
      await this.rabbitMQService.publish('task.events', 'task.created', {
        event: 'task.created',
        data: {
          task_id: task.id,
          task_title: task.title,
          project_id: task.project_id,
          project_name: `Project ${task.project_id}`,
          assigned_to: task.assigned_to,
          created_by: task.created_by,
        },
      });
    }

    return task;
  }

  async fetchTasks(
    projectId: number | undefined,
    findOptions: FindOptions,
    paginationOptions: PaginationOptions
  ): Promise<{ data: Task[]; meta: PaginationMeta }> {
    const { page = 1, limit = 25 } = paginationOptions;

    if (projectId) {
      findOptions.where = {
        ...findOptions.where as object,
        project_id: projectId,
      };
    }

    const { rows, count } = await this.taskRepository.findAll(findOptions, paginationOptions);

    return {
      data: rows,
      meta: generatePaginationMeta(count, page, limit),
    };
  }

  async fetchTask(taskId: number): Promise<Task & { file_ids?: number[] }> {
    const task = await this.taskRepository.findById(taskId, {
      include: [{ model: TaskWatcher, as: 'watchers' }],
    });

    if (!task) {
      throw new ClientErrorException('Task not found', ResponseStatus.NOT_FOUND);
    }

    const taskFiles = await this.taskFileRepository.findAllWithoutPagination({
      where: { task_id: taskId } as any,
    });

    const fileIds = taskFiles.map(tf => tf.file_id);

    return { ...task.toJSON(), file_ids: fileIds } as Task & { file_ids?: number[] };
  }

  async updateTask(
    taskId: number,
    dto: UpdateTaskDto,
    updatedBy?: number
  ): Promise<Task> {
    const task = await this.fetchTask(taskId);

    const previousStatus = task.status;
    const newStatus = dto.status || task.status;
    const statusChanged = dto.status !== undefined && dto.status !== previousStatus;
    
    const previousAssignee = task.assigned_to ?? null;
    const hasAssigneeUpdate = dto.assigned_to !== undefined;
    const newAssignee = hasAssigneeUpdate ? (dto.assigned_to ?? null) : previousAssignee;
    const assigneeChanged = hasAssigneeUpdate && newAssignee !== previousAssignee;

    if (statusChanged) {
      this.validateStatusTransition(previousStatus, newStatus);
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.assigned_to !== undefined) updateData.assigned_to = dto.assigned_to;
    if (dto.due_date !== undefined) updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;

    await this.taskRepository.update(taskId, updateData);

    if (dto.file_ids !== undefined) {
      await this.replaceTaskFiles(taskId, dto.file_ids);
    }

    const updatedTask = await this.fetchTask(taskId);
    const watchers = await this.getWatchers(taskId);
    const watcherIds = watchers.map(w => w.user_id);

    if (assigneeChanged && updatedBy) {
      await this.rabbitMQService.publish('task.events', 'task.assignee.updated', {
        event: 'task.assignee.updated',
        data: {
          task_id: updatedTask.id,
          task_title: updatedTask.title,
          project_id: updatedTask.project_id,
          project_name: `Project ${updatedTask.project_id}`,
          previous_assignee: previousAssignee || undefined,
          new_assignee: newAssignee || undefined,
          updated_by: updatedBy,
          watcher_ids: watcherIds,
        },
      });
    } else if (statusChanged && updatedBy) {
      await this.rabbitMQService.publish('task.events', 'task.status_changed', {
        event: 'task.status_changed',
        data: {
          task_id: updatedTask.id,
          task_title: updatedTask.title,
          project_id: updatedTask.project_id,
          project_name: `Project ${updatedTask.project_id}`,
          old_status: previousStatus,
          new_status: newStatus,
          assigned_to: updatedTask.assigned_to || undefined,
          updated_by: updatedBy,
          watcher_ids: watcherIds,
        },
      });
    } else if (updatedBy) {
      await this.rabbitMQService.publish('task.events', 'task.updated', {
        event: 'task.updated',
        data: {
          task_id: updatedTask.id,
          task_title: updatedTask.title,
          project_id: updatedTask.project_id,
          project_name: `Project ${updatedTask.project_id}`,
          assigned_to: updatedTask.assigned_to || undefined,
          updated_by: updatedBy,
          watcher_ids: watcherIds,
        },
      });
    }

    return updatedTask;
  }

  async deleteTask(taskId: number): Promise<void> {
    const task = await this.fetchTask(taskId);
    
    const taskFiles = await this.taskFileRepository.findAllWithoutPagination({
      where: { task_id: taskId } as any,
    });
    
    const fileIds = taskFiles.map(tf => tf.file_id);
    const watchers = await this.getWatchers(taskId);
    const watcherIds = watchers.map(w => w.user_id);

    const taskInfo = {
      task_id: task.id,
      task_title: task.title,
      project_id: task.project_id,
      project_name: `Project ${task.project_id}`,
      assigned_to: task.assigned_to,
      watcher_ids: watcherIds,
    };
    
    await this.taskFileRepository.destroy({
      where: { task_id: taskId } as any,
    });
    
    await this.taskRepository.hardDelete(taskId);

    if (taskInfo.assigned_to || taskInfo.watcher_ids.length > 0) {
      await this.rabbitMQService.publish('task.events', 'task.deleted', {
        event: 'task.deleted',
        data: {
          task_id: taskInfo.task_id,
          task_title: taskInfo.task_title,
          project_id: taskInfo.project_id,
          project_name: taskInfo.project_name,
          assigned_to: taskInfo.assigned_to || undefined,
          watcher_ids: taskInfo.watcher_ids,
        },
      });
    }

    if (fileIds.length > 0) {
      await this.rabbitMQService.publish('task.events', 'task.deleted', {
        event: 'task.deleted',
        data: {
          file_ids: fileIds,
        },
      });
    }
  }

  async startWatching(taskId: number, userId: number): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new ClientErrorException('Task not found', ResponseStatus.NOT_FOUND);
    }

    const existingWatcher = await this.taskWatcherRepository.findByTaskAndUser(taskId, userId);
    if (existingWatcher) {
      throw new ClientErrorException('You are already watching this task', ResponseStatus.CONFLICT);
    }

    await this.taskWatcherRepository.create({
      task_id: taskId,
      user_id: userId,
    });
  }

  async stopWatching(taskId: number, userId: number): Promise<void> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new ClientErrorException('Task not found', ResponseStatus.NOT_FOUND);
    }

    const watcher = await this.taskWatcherRepository.findByTaskAndUser(taskId, userId);
    if (!watcher) {
      throw new ClientErrorException('You are not watching this task', ResponseStatus.NOT_FOUND);
    }

    await this.taskWatcherRepository.hardDelete(watcher.id);
  }

  async getWatchers(taskId: number): Promise<TaskWatcher[]> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new ClientErrorException('Task not found', ResponseStatus.NOT_FOUND);
    }

    return await this.taskWatcherRepository.findByTaskId(taskId);
  }

  async getFilesForTask(taskId: number): Promise<number[]> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new ClientErrorException('Task not found', ResponseStatus.NOT_FOUND);
    }

    const taskFiles = await this.taskFileRepository.findAllWithoutPagination({
      where: { task_id: taskId } as any,
    });

    return taskFiles.map(tf => tf.file_id);
  }

  private async attachFilesToTask(taskId: number, fileIds: number[]): Promise<void> {
    for (const fileId of fileIds) {
      const existing = await this.taskFileRepository.findOne({
        where: {
          task_id: taskId,
          file_id: fileId,
        } as any,
      });

      if (!existing) {
        await this.taskFileRepository.create({
          task_id: taskId,
          file_id: fileId,
        });
      }
    }
  }

  private async replaceTaskFiles(taskId: number, fileIds: number[]): Promise<void> {
    const existingTaskFiles = await this.taskFileRepository.findAllWithoutPagination({
      where: { task_id: taskId } as any,
    });
    const existingFileIds = new Set(existingTaskFiles.map(tf => tf.file_id));
    const newFileIds = new Set(fileIds);

    for (const taskFile of existingTaskFiles) {
      if (!newFileIds.has(taskFile.file_id)) {
        await this.taskFileRepository.hardDelete(taskFile.id);
      }
    }

    for (const fileId of fileIds) {
      if (!existingFileIds.has(fileId)) {
        await this.taskFileRepository.create({
          task_id: taskId,
          file_id: fileId,
        });
      }
    }
  }
}

