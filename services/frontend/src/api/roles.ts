import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Role } from '@/types/auth/roles'

export const rolesApi = {
  async list(): Promise<ApiResponse<Role[]>> {
    const { data } = await apiClient.get('/roles')
    return data
  },
}

