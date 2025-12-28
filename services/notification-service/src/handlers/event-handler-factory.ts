import { IEventHandler } from '../interfaces/event-handler.interface';
import { NotificationEvent } from '../types/events';
import { UserInvitedHandler } from './user-invited.handler';
import { ProjectMemberAddedHandler } from './project-member-added.handler';
import { ProjectMemberRemovedHandler } from './project-member-removed.handler';

export class EventHandlerFactory {
  private static handlers = new Map<string, () => IEventHandler>([
    ['user.invited', () => new UserInvitedHandler()],
    ['project.member.added', () => new ProjectMemberAddedHandler()],
    ['project.member.removed', () => new ProjectMemberRemovedHandler()],
  ]);

  static getHandler(eventType: string): IEventHandler | null {
    const handlerFactory = this.handlers.get(eventType);
    return handlerFactory ? handlerFactory() : null;
  }

  static registerHandler(eventType: string, factory: () => IEventHandler): void {
    this.handlers.set(eventType, factory);
  }
}

