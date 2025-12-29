import { IEventHandler } from '../interfaces/event-handler.interface';
import { NotificationEvent } from '../types/events';
import { UserCreatedHandler } from './user-created.handler';
import { UserUpdatedHandler } from './user-updated.handler';
import { UserDeletedHandler } from './user-deleted.handler';
import { UserInvitedHandler } from './user-invited.handler';
import { ProjectMemberAddedHandler } from './project-member-added.handler';
import { ProjectMemberRemovedHandler } from './project-member-removed.handler';
import { TaskCreatedHandler } from './task-created.handler';
import { TaskUpdatedHandler } from './task-updated.handler';
import { TaskDeletedHandler } from './task-deleted.handler';
import { TaskStatusChangedHandler } from './task-status-changed.handler';
import { TaskAssigneeUpdatedHandler } from './task-assignee-updated.handler';

export class EventHandlerFactory {
  private static handlers = new Map<string, () => IEventHandler>([
    ['user.created', () => new UserCreatedHandler()],
    ['user.updated', () => new UserUpdatedHandler()],
    ['user.deleted', () => new UserDeletedHandler()],
    ['user.invited', () => new UserInvitedHandler()],
    ['project.member.added', () => new ProjectMemberAddedHandler()],
    ['project.member.removed', () => new ProjectMemberRemovedHandler()],
    ['task.created', () => new TaskCreatedHandler()],
    ['task.updated', () => new TaskUpdatedHandler()],
    ['task.deleted', () => new TaskDeletedHandler()],
    ['task.status_changed', () => new TaskStatusChangedHandler()],
    ['task.assignee.updated', () => new TaskAssigneeUpdatedHandler()],
  ]);

  static getHandler(eventType: string): IEventHandler | null {
    const handlerFactory = this.handlers.get(eventType);
    return handlerFactory ? handlerFactory() : null;
  }

  static registerHandler(eventType: string, factory: () => IEventHandler): void {
    this.handlers.set(eventType, factory);
  }
}

