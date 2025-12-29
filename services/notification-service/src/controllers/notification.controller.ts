import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!;
      const filter = (req.query.filter as 'unread' | 'all') || 'unread';

      const notifications = await this.notificationService.getNotifications(user.id, filter);

      return res.status(200).json({
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!;
      const notificationId = parseInt(req.params.id);

      await this.notificationService.markAsRead(notificationId, user.id);

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!;
      const notificationId = parseInt(req.params.id);

      await this.notificationService.deleteNotification(notificationId, user.id);

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!;

      const count = await this.notificationService.getUnreadCount(user.id);

      return res.status(200).json({
        success: true,
        data: { count },
        message: 'Unread count retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

