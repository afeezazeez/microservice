import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api/users'
import type { User } from '@/types/auth'
import type { InviteUserPayload, UpdateUserPayload } from '@/types/auth/users'
import { showSuccess, showError } from '@/utils/toast'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)

  async function fetchUsers() {
    loading.value = true
    try {
      const response = await userApi.list()
      if (response.success && response.data) {
        users.value = Array.isArray(response.data) ? response.data : []
      }
    } catch (error: any) {
      showError(error.response?.data?.error_message || 'Failed to fetch users')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function inviteUser(payload: InviteUserPayload) {
    try {
      const response = await userApi.invite(payload)
      if (response.success) {
        showSuccess('User invited successfully')
        await fetchUsers()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to invite user'
      showError(message)
      return { success: false, message }
    }
  }

  async function updateUser(id: number, payload: UpdateUserPayload) {
    try {
      const response = await userApi.update(id, payload)
      if (response.success) {
        showSuccess('User updated successfully')
        await fetchUsers()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to update user'
      showError(message)
      return { success: false, message }
    }
  }

  async function deleteUser(id: number) {
    try {
      const response = await userApi.delete(id)
      if (response.success) {
        showSuccess('User deleted successfully')
        await fetchUsers()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to delete user'
      showError(message)
      return { success: false, message }
    }
  }

  return {
    users,
    loading,
    fetchUsers,
    inviteUser,
    updateUser,
    deleteUser,
  }
})

