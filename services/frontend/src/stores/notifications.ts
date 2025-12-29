import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi, type Notification } from '@/api/notifications'
import { showError } from '@/utils/toast'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read_at)
  })

  async function fetchNotifications(filter: 'unread' | 'all' = 'unread') {
    try {
      loading.value = true
      const response = await notificationApi.getAll(filter)
      if (response.success) {
        notifications.value = response.data || []
      }
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to fetch notifications')
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await notificationApi.getUnreadCount()
      if (response.success) {
        unreadCount.value = response.data?.count || 0
      }
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  async function markAsRead(notificationId: number) {
    try {
      const response = await notificationApi.markAsRead(notificationId)
      if (response.success) {
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
          notification.read_at = new Date().toISOString()
        }
        if (unreadCount.value > 0) {
          unreadCount.value--
        }
      }
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to mark notification as read')
    }
  }

  async function deleteNotification(notificationId: number) {
    try {
      const response = await notificationApi.delete(notificationId)
      if (response.success) {
        notifications.value = notifications.value.filter(n => n.id !== notificationId)
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification && !notification.read_at) {
          if (unreadCount.value > 0) {
            unreadCount.value--
          }
        }
      }
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to delete notification')
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    unreadNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
  }
})

