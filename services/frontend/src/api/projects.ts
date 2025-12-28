import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Project, CreateProjectPayload, UpdateProjectPayload, AddMemberPayload } from '@/types/projects'

export const projectApi = {
  async list(query?: { q?: string; sortDirection?: string; sortBy?: string; page?: number; perPage?: number }): Promise<ApiResponse<{ data: Project[]; meta: any }>> {
    const { data } = await apiClient.get('/projects', { params: query })
    return data
  },

  async get(id: number): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.get(`/projects/${id}`)
    return data
  },

  async create(payload: CreateProjectPayload): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.post('/projects', payload)
    return data
  },

  async update(id: number, payload: UpdateProjectPayload): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.put(`/projects/${id}`, payload)
    return data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`/projects/${id}`)
    return data
  },

  async addMember(projectId: number, payload: AddMemberPayload): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(`/projects/${projectId}/members`, payload)
    return data
  },

  async removeMember(projectId: number, userId: number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`/projects/${projectId}/members/${userId}`)
    return data
  },
}

