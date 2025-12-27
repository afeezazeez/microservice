import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/auth'
import type { InviteUserPayload, UpdateUserPayload } from '@/types/auth/users'

export const userApi = {
  async list(): Promise<ApiResponse<User[]>> {
    const { data } = await apiClient.get('/users')
    return data
  },

  async get(id: number): Promise<ApiResponse<User>> {
    const { data } = await apiClient.get(`/users/${id}`)
    return data
  },

  async invite(payload: InviteUserPayload): Promise<ApiResponse<User>> {
    const { data } = await apiClient.post('/users', payload)
    return data
  },

  async update(id: number, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    const { data } = await apiClient.put(`/users/${id}`, payload)
    return data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`/users/${id}`)
    return data
  },
}

