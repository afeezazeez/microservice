import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { AxiosProgressEvent } from 'axios'
import type { FileUploadResponse, FileResponse } from '@/types/files'

export const fileApi = {
  async upload(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await apiClient.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      },
    })
    return data
  },

  async getBatch(fileIds: number[]): Promise<ApiResponse<FileResponse[]>> {
    const { data } = await apiClient.post('/files/batch', { file_ids: fileIds })
    return data
  },

  async delete(fileId: number): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete(`/files/${fileId}`)
    return data
  },

  async download(fileId: number): Promise<Blob> {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  getThumbnailUrl(fileId: number): string {
    return `${apiClient.defaults.baseURL}/files/${fileId}/thumbnail`
  },

  getPreviewUrl(fileId: number): string {
    return `${apiClient.defaults.baseURL}/files/${fileId}/preview`
  },
}

