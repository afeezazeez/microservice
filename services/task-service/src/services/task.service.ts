import { TaskRepository } from '../repositories/task.repository';
import { TaskWatcherRepository } from '../repositories/task-watcher.repository';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import { TaskStatus } from '../enums/task-status.enum';
import Task from '../database/models/Task';
import TaskWatcher from '../database/models/TaskWatcher';
import { PaginationOptions, PaginationMeta } from '../interfaces/pagination.interface';
import { generatePaginationMeta } from '../utils/helper';
import { WinstonLogger } from '../utils/logger/winston.logger';
import { FindOptions, Op } from 'sequelize';
import { RabbitMQService } from './rabbitmq.service';

export class TaskService {
  private readonly taskRepository: TaskRepository;
  private readonly taskWatcherRepository: TaskWatcherRepository;
  private readonly logger: WinstonLogger;
  private readonly rabbitMQService: RabbitMQService;

  constructor(logger?: WinstonLogger) {
    this.taskRepository = new TaskRepository();
    this.taskWatcherRepository = new TaskWatcherRepository();
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

  async fetchTask(taskId: number): Promise<Task> {
    const task = await this.taskRepository.findById(taskId, {
      include: [{ model: TaskWatcher, as: 'watchers' }],
    });

    if (!task) {
      throw new ClientErrorException('Task not found', ResponseStatus.NOT_FOUND);
    }

    return task;
  }

  async updateTask(
    taskId: number,
    dto: UpdateTaskDto
  ): Promise<Task> {
    const task = await this.fetchTask(taskId);

    const previousStatus = task.status;
    const newStatus = dto.status || task.status;

    if (dto.status && dto.status !== previousStatus) {
      this.validateStatusTransition(previousStatus, newStatus);
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.assigned_to !== undefined) updateData.assigned_to = dto.assigned_to;
    if (dto.due_date !== undefined) updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;

    await this.taskRepository.update(taskId, updateData);

    return await this.fetchTask(taskId);
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.fetchTask(taskId);
    await this.taskRepository.hardDelete(taskId);
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
}

