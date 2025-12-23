import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type User, type LoginPayload, type RegisterPayload } from '@/api/auth'
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
      if (response.success && response.data) {
        user.value = response.data
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
        const { token, user: userData, company } = response.data
        
        localStorage.setItem('access_token', token)
        user.value = userData
        
        showSuccess(`Account created! Welcome to ${company.name}, ${userData.name}!`)
        
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
        const { token, user: userData } = response.data
        
        localStorage.setItem('access_token', token)
        user.value = userData
        
        showSuccess(`Welcome back! Logged in as ${userData.email}`)
        
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

  async function logout() {
    loading.value = true
    try {
      await authApi.logout()
      showSuccess('Logged out. See you next time!')
    } catch {
      // Logout failed on server, but we'll clear local state anyway
    } finally {
      user.value = null
      localStorage.removeItem('access_token')
      loading.value = false
      router.push('/login')
    }
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

