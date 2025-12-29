import { FileServiceEvent } from '../types/events';
import { handleTaskDeleted } from './task-deleted.handler';

export class EventHandlerFactory {
  private static handlers = new Map<string, (event: FileServiceEvent) => Promise<void>>([
    ['task.deleted', handleTaskDeleted],
  ]);

  static getHandler(eventType: string): ((event: FileServiceEvent) => Promise<void>) | null {
    return this.handlers.get(eventType) || null;
  }

  static registerHandler(eventType: string, handler: (event: FileServiceEvent) => Promise<void>): void {
    this.handlers.set(eventType, handler);
  }
}

