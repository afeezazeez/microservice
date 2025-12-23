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

// Response interceptor: handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error_message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
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

