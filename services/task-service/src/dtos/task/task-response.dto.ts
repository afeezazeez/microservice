import Task from '../../database/models/Task';
import TaskWatcher from '../../database/models/TaskWatcher';

export interface ITask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  watchers?: ITaskWatcher[];
  created_at: string;
  updated_at: string;
}

export interface ITaskWatcher {
  id: number;
  task_id: number;
  user_id: number;
  created_at: string;
}

export class TaskWatcherDto {
  id: number;
  task_id: number;
  user_id: number;
  created_at: string;

  constructor(watcher: any) {
    this.id = watcher.id;
    this.task_id = watcher.task_id;
    this.user_id = watcher.user_id;
    this.created_at = new Date(watcher.createdAt || watcher.created_at).toISOString();
  }

  static make(watcher: any): ITaskWatcher {
    return new TaskWatcherDto(watcher);
  }

  static collection(watchers: any[]): ITaskWatcher[] {
    if (!watchers || !Array.isArray(watchers)) {
      return [];
    }
    return watchers.map(watcher => TaskWatcherDto.make(watcher));
  }
}

class TaskResponseDto {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  watchers?: ITaskWatcher[];
  created_at: string;
  updated_at: string;

  constructor(task: any) {
    this.id = task.id;
    this.project_id = task.project_id;
    this.title = task.title;
    this.description = task.description || null;
    this.status = task.status;
    this.assigned_to = task.assigned_to || null;
    this.created_by = task.created_by;
    this.due_date = task.due_date ? new Date(task.due_date).toISOString() : null;
    this.created_at = new Date(task.createdAt || task.created_at).toISOString();
    this.updated_at = new Date(task.updatedAt || task.updated_at).toISOString();

    if (task.watchers) {
      this.watchers = TaskWatcherDto.collection(task.watchers);
    }
  }

  static make(task: any): ITask {
    return new TaskResponseDto(task) as ITask;
  }

  static collection(tasks: any[]): ITask[] {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }
    return tasks.map(task => TaskResponseDto.make(task));
  }
}

export default TaskResponseDto;

