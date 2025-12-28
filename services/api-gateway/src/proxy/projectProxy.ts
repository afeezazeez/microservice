import { AxiosInstance } from 'axios';
import { createHttpClient, mapUpstreamError, UpstreamResult } from './httpClient';

const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || 'http://project-service:3002';
const projectClient: AxiosInstance = createHttpClient(PROJECT_SERVICE_URL);

export async function listProjects(token: string, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.get('/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch projects');
  }
}

export async function getProject(token: string, id: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.get(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch project');
  }
}

export async function createProject(token: string, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.post('/api/projects', payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to create project');
  }
}

export async function updateProject(token: string, id: number, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.put(`/api/projects/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to update project');
  }
}

export async function deleteProject(token: string, id: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.delete(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to delete project');
  }
}

export async function addMember(token: string, projectId: number, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.post(`/api/projects/${projectId}/members`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to add member');
  }
}

export async function removeMember(token: string, projectId: number, userId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await projectClient.delete(`/api/projects/${projectId}/members/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to remove member');
  }
}
