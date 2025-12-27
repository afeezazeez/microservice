import { apiClient, plainAxios } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  RegisterPayload,
  LoginPayload,
  RegisterResponse,
  LoginResponse,
  MeResponse,
  RefreshTokenResponse,
} from '@/types/auth'

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

  async refresh(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    const { data } = await plainAxios.post('/auth/refresh', { refresh_token: refreshToken })
    return data
  },
}

