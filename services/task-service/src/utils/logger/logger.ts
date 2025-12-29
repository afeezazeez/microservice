import { Request, Response, NextFunction } from 'express';
import Logger from './winston.logger';
import configService from '../config/config.service';

/**
 * HTTP request logging middleware
 * Only logs errors (4xx, 5xx) to reduce noise in Grafana
 * Set LOG_HTTP_REQUESTS=true to enable full request logging
 */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const correlationId = (req as any).correlationId || 'unknown';
  const logHttpRequests = configService.getBoolean('LOG_HTTP_REQUESTS', false);
  const skipPaths = ['/', '/health', '/api/docs', '/api/docs/'];
  const shouldSkip = skipPaths.includes(req.path) || req.path.startsWith('/api/docs');

  if (!shouldSkip && logHttpRequests) {
    Logger.info('Incoming request', {
      correlation_id: correlationId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log errors or if full logging is enabled and not a skipped path
    if ((!shouldSkip && logHttpRequests) || res.statusCode >= 400) {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      Logger[logLevel]('Request completed', {
        correlation_id: correlationId,
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        duration_ms: duration,
      });
    }
  });

  next();
}

export { Logger };


