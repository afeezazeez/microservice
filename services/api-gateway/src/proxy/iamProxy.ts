import { AxiosInstance } from 'axios';
import { config } from '../config.js';
import { createHttpClient, mapUpstreamError, UpstreamResult } from './httpClient.js';

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

