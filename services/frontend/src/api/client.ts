import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Always use /api - nginx (Docker) or Vite (dev) handles proxying to API Gateway
const API_BASE = '/api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error_message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 - try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          if (data.success && data.data?.access_token) {
            localStorage.setItem('access_token', data.data.access_token)
            if (data.data.refresh_token) {
              localStorage.setItem('refresh_token', data.data.refresh_token)
            }
            
            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`
            }
            return apiClient(originalRequest)
          }
        } catch {
          // Refresh failed, clear tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Type for API responses
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error_message?: string
  errors?: Record<string, string[]>
}

