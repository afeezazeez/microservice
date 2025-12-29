import { NotificationRepository } from '../repositories/notification.repository';
import Notification from '../database/models/Notification';
import { logger } from '../utils/logger';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createNotification(data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    return await this.notificationRepository.create({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
    });
  }

  async getNotifications(userId: number, filter: 'unread' | 'all' = 'unread'): Promise<Notification[]> {
    return await this.notificationRepository.findAllByUserId(userId, filter);
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const affected = await this.notificationRepository.markAsRead(notificationId, userId);
    if (affected === 0) {
      throw new Error('Notification not found or already read');
    }
  }

  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.user_id !== userId) {
      throw new Error('Notification not found');
    }
    await this.notificationRepository.hardDelete(notificationId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.countUnreadByUserId(userId);
  }
}

