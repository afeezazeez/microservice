import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../logger';
import { CORRELATION_HEADER } from './correlationId';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Use snake_case to match IAM's logging format for cross-service querying
  customProps: (req) => ({
    correlation_id: (req as any).correlationId ?? req.headers[CORRELATION_HEADER],
  }),
});

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  requestLogger(req, res);
  next();
}

