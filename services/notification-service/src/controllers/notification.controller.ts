import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccessResponse } from '../utils/http/response-handlers';
import { ResponseStatus } from '../enums/http-status-codes';

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

      return sendSuccessResponse(res, notifications, 'Notifications retrieved successfully');
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

      return sendSuccessResponse(res, null, 'Notification marked as read');
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

      return sendSuccessResponse(res, null, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!;

      const count = await this.notificationService.getUnreadCount(user.id);

      return sendSuccessResponse(res, { count }, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

