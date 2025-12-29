import TaskFile from '../database/models/TaskFile';
import { BaseRepository } from './base.repository';

export class TaskFileRepository extends BaseRepository<TaskFile> {
  constructor() {
    super(TaskFile);
  }
}

