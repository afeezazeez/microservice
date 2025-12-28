import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { config } from '../config';

export function getClientIp(req: Request): string {
  if (config.trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (req.headers['x-real-ip']) {
      return String(req.headers['x-real-ip']);
    }
  }
  return req.socket.remoteAddress || 'unknown';
}

export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error_message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => {
    return req.path === '/health';
  },
});

export const authRateLimiter = rateLimit({
  windowMs: config.rateLimitAuthWindowMs,
  max: config.rateLimitAuthMax,
  message: {
    success: false,
    error_message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  skipSuccessfulRequests: true,
});

export const speedLimiter = slowDown({
  windowMs: config.rateLimitWindowMs,
  delayAfter: Math.floor(config.rateLimitMax * 0.5),
  delayMs: 500,
  maxDelayMs: 2000,
  skip: (req) => {
    return req.path === '/health';
  },
});

export function requestTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  const timeout = config.requestTimeoutMs;
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error_message: 'Request timeout',
      });
    }
  });
  next();
}

export function requestSizeLimiter(req: Request, res: Response, next: NextFunction) {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const sizeInBytes = parseInt(contentLength, 10);
    const maxSize = parseSize(config.maxRequestSize);
    if (sizeInBytes > maxSize) {
      return res.status(413).json({
        success: false,
        error_message: `Request entity too large. Maximum size is ${config.maxRequestSize}`,
      });
    }
  }
  next();
}

function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  const match = size.toLowerCase().match(/^(\d+)(kb|mb|gb)$/);
  if (!match) {
    return 10 * 1024 * 1024;
  }
  return parseInt(match[1], 10) * units[match[2]];
}

