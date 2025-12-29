export interface FileUploadResponse {
  id: number
}

export interface FileResponse {
  id: number
  filename: string
  original_name: string
  mime_type: string
  size: number
  uploaded_by: number
  thumbnail_path?: string
  supports_preview: boolean
  created_at: string
  updated_at: string
}

