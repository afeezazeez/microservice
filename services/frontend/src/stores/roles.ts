import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rolesApi } from '@/api/roles'
import type { Role } from '@/types/auth/roles'
import { showError } from '@/utils/toast'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const loading = ref(false)

  async function fetchRoles() {
    loading.value = true
    try {
      const response = await rolesApi.list()
      if (response.success && response.data) {
        roles.value = Array.isArray(response.data) ? response.data : []
        return { success: true }
      }
      showError(response.error_message || 'Failed to fetch roles')
      return { success: false, message: response.error_message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || 'Failed to fetch roles'
      showError(message)
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  return {
    roles,
    loading,
    fetchRoles,
  }
})

