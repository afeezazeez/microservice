import Notification from '../../database/models/Notification';
import { INotification } from './notification.interface';

export class NotificationResponseDto {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read_at?: string | null;
  created_at: string;
  updated_at: string;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.user_id = notification.user_id;
    this.type = notification.type;
    this.title = notification.title;
    this.message = notification.message;
    this.metadata = notification.metadata || undefined;
    this.read_at = notification.read_at ? new Date(notification.read_at).toISOString() : null;
    this.created_at = new Date((notification as any).createdAt || (notification as any).created_at).toISOString();
    this.updated_at = new Date((notification as any).updatedAt || (notification as any).updated_at).toISOString();
  }

  static make(notification: Notification): INotification {
    return new NotificationResponseDto(notification) as INotification;
  }

  static collection(notifications: Notification[]): INotification[] {
    if (!notifications || !Array.isArray(notifications)) {
      return [];
    }
    return notifications.map(notification => NotificationResponseDto.make(notification));
  }
}

export default NotificationResponseDto;

