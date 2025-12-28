import Task from '../database/models/Task';
import { BaseRepository } from './base.repository';

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super(Task);
  }
}

