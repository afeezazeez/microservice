import { AxiosInstance } from 'axios';
import { config } from '../config';
import { createHttpClient, mapUpstreamError, UpstreamResult } from './httpClient';

const iamClient: AxiosInstance = createHttpClient(config.iamBaseUrl);

export async function login(payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.post('/api/auth/login', payload, {
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Login failed');
  }
}

export async function refresh(payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.post('/api/auth/refresh', payload, {
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Token refresh failed');
  }
}

export async function register(payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.post('/api/auth/register', payload, {
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Registration failed');
  }
}

export async function getAuthenticatedUser(token: string, correlationId?: string): Promise<any> {
  try {
    const response = await iamClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response.data?.data ?? null;
  } catch (error) {
    throw mapUpstreamError(error, 'Unauthorized');
  }
}

export async function listUsers(token: string, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch users');
  }
}

export async function getUser(token: string, id: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.get(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch user');
  }
}

export async function createUser(token: string, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.post('/api/users', payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to create user');
  }
}

export async function updateUser(token: string, id: number, payload: any, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.put(`/api/users/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to update user');
  }
}

export async function deleteUser(token: string, id: number, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.delete(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to delete user');
  }
}

export async function listRoles(token: string, correlationId?: string): Promise<UpstreamResult> {
  try {
    const response = await iamClient.get('/api/roles', {
      headers: { Authorization: `Bearer ${token}` },
      correlationId,
    } as any);
    return response;
  } catch (error) {
    throw mapUpstreamError(error, 'Failed to fetch roles');
  }
}
