import { AxiosInstance } from 'axios';
import { createHttpClient, mapUpstreamError, UpstreamResult } from './httpClient';

const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || 'http://task-service:3002';
const taskClient: AxiosInstance = createHttpClient(TASK_SERVICE_URL);

export async function listTasks(token: string, correlationId?: string, query?: any): Promise<UpstreamResult> {
  try {
    const response = await taskClient.get('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      params: query,
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch tasks');
  }
}

export async function getTask(token: string, id: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.get(`/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch task');
  }
}

export async function createTask(token: string, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.post('/api/tasks', payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to create task');
  }
}

export async function updateTask(token: string, id: number, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.put(`/api/tasks/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to update task');
  }
}

export async function deleteTask(token: string, id: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.delete(`/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to delete task');
  }
}

export async function startWatching(token: string, taskId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.post(`/api/tasks/${taskId}/watch`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to start watching task');
  }
}

export async function stopWatching(token: string, taskId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.delete(`/api/tasks/${taskId}/watch`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to stop watching task');
  }
}

export async function getWatchers(token: string, taskId: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await taskClient.get(`/api/tasks/${taskId}/watchers`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch watchers');
  }
}

