import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type User, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { toast } from 'vue-sonner'
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
      // Token invalid, clear it
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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
        const { tokens, user: userData } = response.data
        
        localStorage.setItem('access_token', tokens.access_token)
        localStorage.setItem('refresh_token', tokens.refresh_token)
        user.value = userData
        
        toast.success('Account created!', {
          description: `Welcome to ${response.data.company.name}, ${userData.name}!`,
        })
        
        router.push('/dashboard')
        return { success: true }
      }
      
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || error.response?.data?.message || 'Registration failed'
      toast.error('Registration failed', { description: message })
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
        const { access_token, refresh_token, user: userData } = response.data
        
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        user.value = userData
        
        toast.success('Welcome back!', {
          description: `Logged in as ${userData.email}`,
        })
        
        router.push('/dashboard')
        return { success: true }
      }
      
      return { success: false, message: response.message }
    } catch (error: any) {
      const message = error.response?.data?.error_message || error.response?.data?.message || 'Login failed'
      toast.error('Login failed', { description: message })
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await authApi.logout()
      toast.success('Logged out', { description: 'See you next time!' })
    } catch {
      // Logout failed on server, but we'll clear local state anyway
    } finally {
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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

