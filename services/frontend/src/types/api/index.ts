export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error_message?: string
  errors?: Record<string, string[]>
}

export * from './client'

