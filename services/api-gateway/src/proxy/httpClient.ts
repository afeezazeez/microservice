import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config.js';
import { CORRELATION_HEADER } from '../middleware/correlationId.js';

export function createHttpClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: config.requestTimeoutMs,
  });

  client.interceptors.request.use((request) => {
    // If correlationId is on the config, pass it along
    const correlationId = (request as any).correlationId;
    if (correlationId) {
      request.headers = request.headers || {};
      request.headers[CORRELATION_HEADER] = correlationId;
    }
    return request;
  });

  return client;
}

export function mapUpstreamError(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status || 500;
    const data = error.response.data ?? { success: false, error: fallbackMessage };
    return { status, data };
  }
  return { status: 500, data: { success: false, error: fallbackMessage } };
}

export type UpstreamResult<T = any> = AxiosResponse<T>;

