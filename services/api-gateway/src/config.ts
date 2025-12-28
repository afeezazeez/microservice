import dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.testing' : '.env' });

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  port: Number(process.env.PORT || 3000),
  iamBaseUrl: process.env.IAM_BASE_URL || 'http://iam-service:8000',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  logLevel: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 8000),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 5),
  rateLimitAuthWindowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 900000),
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://app.afeez-dev.local', 'https://app.afeez-dev.local'],
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  trustProxy: process.env.TRUST_PROXY === 'true',
};

