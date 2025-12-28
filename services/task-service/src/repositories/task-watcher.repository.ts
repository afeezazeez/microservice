import TaskWatcher from '../database/models/TaskWatcher';
import { BaseRepository } from './base.repository';

export class TaskWatcherRepository extends BaseRepository<TaskWatcher> {
  constructor() {
    super(TaskWatcher);
  }

  async findByTaskAndUser(taskId: number, userId: number): Promise<TaskWatcher | null> {
    return await this.findOne({
      where: { task_id: taskId, user_id: userId }
    });
  }

  async findByTaskId(taskId: number): Promise<TaskWatcher[]> {
    return await this.findAllWithoutPagination({
      where: { task_id: taskId }
    });
  }
}

