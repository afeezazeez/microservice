import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/tasks'

export const taskApi = {
  async list(query?: { project_id?: number; q?: string; sortDirection?: string; sortBy?: string; page?: number; perPage?: number }): Promise<ApiResponse<{ data: Task[]; meta: any }>> {
    const { data } = await apiClient.get('/tasks', { params: query })
    return data
  },

  async get(id: number): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.get(`/tasks/${id}`)
    return data
  },

  async create(payload: CreateTaskPayload): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post('/tasks', payload)
    return data
  },

  async update(id: number, payload: UpdateTaskPayload): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.put(`/tasks/${id}`, payload)
    return data
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`/tasks/${id}`)
    return data
  },

  async startWatching(taskId: number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.post(`/tasks/${taskId}/watch`)
    return data
  },

  async stopWatching(taskId: number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete(`/tasks/${taskId}/watch`)
    return data
  },

  async getWatchers(taskId: number): Promise<ApiResponse<any[]>> {
    const { data } = await apiClient.get(`/tasks/${taskId}/watchers`)
    return data
  },
}

