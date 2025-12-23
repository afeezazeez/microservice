import { apiClient, type ApiResponse } from './client'

export interface User {
  id: number
  email: string
  name: string
  company_id: number
  company?: {
    id: number
    name: string
    slug: string
  }
  roles?: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
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
  async register(payload: RegisterPayload): Promise<ApiResponse<{ company: { id: number; name: string }; user: User; tokens: AuthTokens }>> {
    const { data } = await apiClient.post('/auth/register', payload)
    return data
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthTokens & { user: User }>> {
    const { data } = await apiClient.post('/auth/login', payload)
    return data
  },

  async logout(): Promise<ApiResponse> {
    const { data } = await apiClient.post('/auth/logout')
    return data
  },

  async me(): Promise<ApiResponse<User>> {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  async refresh(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const { data } = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return data
  },
}

