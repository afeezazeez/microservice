import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  metadata?: Record<string, any>
  read_at?: string
  created_at: string
  updated_at: string
}

export interface UnreadCountResponse {
  count: number
}

export const notificationApi = {
  async getAll(filter: 'unread' | 'all' = 'unread'): Promise<ApiResponse<Notification[]>> {
    const { data } = await apiClient.get('/notifications', {
      params: { filter },
    })
    return data
  },

  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const { data } = await apiClient.get('/notifications/unread-count')
    return data
  },

  async markAsRead(notificationId: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
    return data
  },

  async delete(notificationId: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete(`/notifications/${notificationId}`)
    return data
  },
}

