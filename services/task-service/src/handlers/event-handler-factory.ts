import { TaskServiceEvent } from '../types/events';
import { handleFileDeleted } from './file-deleted.handler';

export class EventHandlerFactory {
  private static handlers = new Map<string, (event: TaskServiceEvent) => Promise<void>>([
    ['file.deleted', handleFileDeleted],
  ]);

  static getHandler(eventType: string): ((event: TaskServiceEvent) => Promise<void>) | null {
    return this.handlers.get(eventType) || null;
  }

  static registerHandler(eventType: string, handler: (event: TaskServiceEvent) => Promise<void>): void {
    this.handlers.set(eventType, handler);
  }
}

