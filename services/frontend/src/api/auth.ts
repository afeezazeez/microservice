import { apiClient, type ApiResponse } from './client'

export interface User {
  id: number
  email: string
  name: string
  company_id: number
  company_name: string | null
  roles: string[]
}

export interface MeResponse {
  user: User
}

export interface RegisterResponse {
  user: User
  company: { id: number; name: string; identifier: string; email: string }
  token: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface RegisterPayload {
  company: {
    name: string
    email: string
  }
  user: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<ApiResponse<RegisterResponse>> {
    const { data } = await apiClient.post('/auth/register', payload)
    return data
  },

  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    const { data } = await apiClient.post('/auth/login', payload)
    return data
  },

  async me(): Promise<ApiResponse<MeResponse>> {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  async refresh(token: string): Promise<ApiResponse<{ token: string }>> {
    const { data } = await apiClient.post('/auth/refresh', { token })
    return data
  },
}

