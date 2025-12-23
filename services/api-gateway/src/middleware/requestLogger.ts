import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../logger.js';
import { CORRELATION_HEADER } from './correlationId.js';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customProps: (req) => ({
    correlationId: (req as any).correlationId ?? req.headers[CORRELATION_HEADER],
  }),
});

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  requestLogger(req, res);
  next();
}

