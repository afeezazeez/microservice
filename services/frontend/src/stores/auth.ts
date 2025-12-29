import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginPayload, RegisterPayload } from '@/types/auth'
import { showSuccess, showError } from '@/utils/toast'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const fullName = computed(() => user.value?.name ?? '')

  async function initialize() {
    const token = localStorage.getItem('access_token')
    if (!token) {
      initialized.value = true
      return
    }

    try {
      loading.value = true
      const response = await authApi.me()
      if (response.success && response.data?.user) {
        user.value = response.data.user
      }
    } catch {
      localStorage.removeItem('access_token')
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      const response = await authApi.register(payload)
      
      if (response.success && response.data) {
        const { access_token, refresh_token, company } = response.data
        
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        
        try {
          const meResponse = await authApi.me()
          if (meResponse.success && meResponse.data?.user) {
            user.value = meResponse.data.user
          } else {
            user.value = response.data.user
          }
        } catch {
          user.value = response.data.user
        }
        
        showSuccess(`Account created! Welcome to ${company.name}, ${user.value?.name}!`)
        
        await nextTick()
        router.push('/dashboard')
        return { success: true }
      }
      
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || error.response?.data?.message || 'Registration failed'
      showError(`Registration failed: ${message}`)
      return { success: false, message, errors: error.response?.data?.errors }
    } finally {
      loading.value = false
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const response = await authApi.login(payload)
      
      if (response.success && response.data) {
        const { access_token, refresh_token } = response.data
        
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        
        try {
          const meResponse = await authApi.me()
          if (meResponse.success && meResponse.data?.user) {
            user.value = meResponse.data.user
          } else {
            user.value = response.data.user
          }
        } catch {
          user.value = response.data.user
        }
        
        showSuccess(`Welcome back! Logged in as ${user.value?.email}`)
        
        await nextTick()
        router.push('/dashboard')
        return { success: true }
      }
      
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || error.response?.data?.message || 'Login failed'
      showError(`Login failed: ${message}`)
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    showSuccess('Logged out. See you next time!')
    router.push('/login')
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    fullName,
    initialize,
    register,
    login,
    logout,
  }
})

