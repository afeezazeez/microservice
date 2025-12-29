import { AxiosInstance } from 'axios';
import { createHttpClient, mapUpstreamError, UpstreamResult } from './httpClient';
import FormData from 'form-data';

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://file-service:3004';
const fileClient: AxiosInstance = createHttpClient(FILE_SERVICE_URL);

export async function uploadFile(
  token: string,
  file: Express.Multer.File,
  correlationId?: string
): Promise<UpstreamResult> {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await fileClient.post('/api/files', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to upload file');
  }
}

export async function downloadFile(token: string, fileId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await fileClient.get(`/api/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to download file');
  }
}

export async function deleteFile(token: string, fileId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await fileClient.delete(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to delete file');
  }
}

export async function getFilesByIds(token: string, fileIds: number[], correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await fileClient.post('/api/files/batch', { file_ids: fileIds }, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch files by IDs');
  }
}

export async function getThumbnail(token: string, fileId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await fileClient.get(`/api/files/${fileId}/thumbnail`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch thumbnail');
  }
}

export async function getPreview(token: string, fileId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await fileClient.get(`/api/files/${fileId}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch preview');
  }
}

