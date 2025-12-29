import Notification from '../database/models/Notification';
import { BaseRepository } from './base.repository';
import { FindOptions, Op } from 'sequelize';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super(Notification);
  }

  async findUnreadByUserId(userId: number): Promise<Notification[]> {
    return await this.findAllWithoutPagination({
      where: {
        user_id: userId,
        read_at: null,
      } as any,
      order: [['created_at', 'DESC']],
    });
  }

  async findAllByUserId(userId: number, filter: 'unread' | 'all' = 'unread'): Promise<Notification[]> {
    const where: any = {
      user_id: userId,
    };

    if (filter === 'unread') {
      where.read_at = null;
    }

    return await this.findAllWithoutPagination({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<number> {
    return await this.update(notificationId, {
      read_at: new Date(),
    } as any, {
      where: {
        id: notificationId,
        user_id: userId,
      } as any,
    });
  }

  async countUnreadByUserId(userId: number): Promise<number> {
    return await this.count({
      user_id: userId,
      read_at: null,
    } as any);
  }
}

