import { NotificationEvent } from '../types/events';

export interface IEventHandler {
  handle(event: NotificationEvent): Promise<void>;
}

