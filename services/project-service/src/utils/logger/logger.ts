import { Request, Response, NextFunction } from 'express';
import Logger from './winston.logger';

/**
 * HTTP request logging middleware
 * Logs incoming requests and their responses for observability
 */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const correlationId = (req as any).correlationId || 'unknown';

    // Log request
    Logger.info('Incoming request', {
        correlation_id: correlationId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
    });

    // Capture response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        Logger.info('Request completed', {
            correlation_id: correlationId,
            method: req.method,
            path: req.path,
            status_code: res.statusCode,
            duration_ms: duration,
        });
    });

    next();
}

export { Logger };

