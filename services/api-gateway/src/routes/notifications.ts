import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getNotifications, getUnreadCount, markNotificationAsRead, deleteNotification } from '../proxy/notificationProxy';
import { sendErrorResponse } from '../utils/response';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const filter = req.query.filter as 'unread' | 'all' | undefined;
    const notificationResponse = await getNotifications(token, filter, (req as any).correlationId);
    res.status(notificationResponse.status).json(notificationResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;

    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }

    sendErrorResponse(res, 'Failed to fetch notifications', null, [], [], status);
  }
});

router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const notificationResponse = await getUnreadCount(token, (req as any).correlationId);
    res.status(notificationResponse.status).json(notificationResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;

    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }

    sendErrorResponse(res, 'Failed to fetch unread count', null, [], [], status);
  }
});

router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const notificationId = parseInt(req.params.id);
    const notificationResponse = await markNotificationAsRead(token, notificationId, (req as any).correlationId);
    res.status(notificationResponse.status).json(notificationResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;

    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }

    sendErrorResponse(res, 'Failed to mark notification as read', null, [], [], status);
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const notificationId = parseInt(req.params.id);
    const notificationResponse = await deleteNotification(token, notificationId, (req as any).correlationId);
    res.status(notificationResponse.status).json(notificationResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;

    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }

    sendErrorResponse(res, 'Failed to delete notification', null, [], [], status);
  }
});

export { router as notificationsRouter };

