import { AxiosInstance } from 'axios';
import { createHttpClient, mapUpstreamError, UpstreamResult } from './httpClient';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';
const notificationClient: AxiosInstance = createHttpClient(NOTIFICATION_SERVICE_URL);

export async function getNotifications(
  token: string,
  filter?: 'unread' | 'all',
  correlationId?: string
): Promise<UpstreamResult> {
  try {
    const params = filter ? { filter } : {};
    const response = await notificationClient.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
      params,
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch notifications');
  }
}

export async function getUnreadCount(
  token: string,
  correlationId?: string
): Promise<UpstreamResult> {
  try {
    const response = await notificationClient.get('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch unread count');
  }
}

export async function markNotificationAsRead(
  token: string,
  notificationId: number,
  correlationId?: string
): Promise<UpstreamResult> {
  try {
    const response = await notificationClient.put(`/api/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to mark notification as read');
  }
}

export async function deleteNotification(
  token: string,
  notificationId: number,
  correlationId?: string
): Promise<UpstreamResult> {
  try {
    const response = await notificationClient.delete(`/api/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to delete notification');
  }
}

