import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { sendSuccessResponse } from '../utils/http/response-handlers';
import { ResponseStatus } from '../enums/http-status-codes';
import { AuthenticatedRequest } from '../types/auth';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import TaskResponseDto, { TaskWatcherDto } from '../dtos/task/task-response.dto';
import { extractPaginationAndSorting } from '../utils/helper';
import { FindOptions, Op } from 'sequelize';
import TaskWatcher from '../database/models/TaskWatcher';

export class TaskController {
  private readonly taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const dto: CreateTaskDto = req.body;
      const user = req.user!;

      const task = await this.taskService.createTask(dto, user.id);

      return sendSuccessResponse(res, TaskResponseDto.make(task), 'Task created successfully', ResponseStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const projectId = req.query.project_id ? parseInt(req.query.project_id as string) : undefined;
      const search = req.query.q as string;
      const sortDirection = req.query.sortDirection || 'desc';
      const sortBy = req.query.sortBy || 'created_at';

      const findOptions: FindOptions = {
        where: {},
        include: [{ model: TaskWatcher, as: 'watchers' }],
      };

      if (search) {
        findOptions.where = {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
          ]
        };
      }

      if (sortBy && sortDirection) {
        findOptions.order = [[sortBy as string, (sortDirection as string).toUpperCase()]];
      }

      const paginationOptions = extractPaginationAndSorting(req);
      const result = await this.taskService.fetchTasks(projectId, findOptions, paginationOptions);

      return sendSuccessResponse(res, {
        data: TaskResponseDto.collection(result.data),
        meta: result.meta
      }, 'Tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await this.taskService.fetchTask(taskId);

      return sendSuccessResponse(res, TaskResponseDto.make(task), 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const dto: UpdateTaskDto = req.body;
      const user = req.user!;

      const task = await this.taskService.updateTask(taskId, dto, user.id);

      return sendSuccessResponse(res, TaskResponseDto.make(task), 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user!;

      await this.taskService.deleteTask(taskId);

      return sendSuccessResponse(res, [], 'Task deleted successfully', ResponseStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  startWatching = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user!;

      await this.taskService.startWatching(taskId, user.id);

      return sendSuccessResponse(res, [], 'Started watching task', ResponseStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  stopWatching = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user!;

      await this.taskService.stopWatching(taskId, user.id);

      return sendSuccessResponse(res, [], 'Stopped watching task', ResponseStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  getWatchers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const watchers = await this.taskService.getWatchers(taskId);

      return sendSuccessResponse(res, TaskWatcherDto.collection(watchers), 'Watchers retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const taskId = parseInt(req.params.id);
      const files = await this.taskService.getFilesForTask(taskId);

      return sendSuccessResponse(res, files, 'Files retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

