import { IEventHandler } from '../interfaces/event-handler.interface';
import { NotificationEvent } from '../types/events';
import { UserInvitedHandler } from './user-invited.handler';

export class EventHandlerFactory {
  private static handlers: Map<string, () => IEventHandler> = new Map([
    ['user.invited', () => new UserInvitedHandler()],
  ]);

  static getHandler(eventType: string): IEventHandler | null {
    const handlerFactory = this.handlers.get(eventType);
    return handlerFactory ? handlerFactory() : null;
  }

  static registerHandler(eventType: string, factory: () => IEventHandler): void {
    this.handlers.set(eventType, factory);
  }
}

