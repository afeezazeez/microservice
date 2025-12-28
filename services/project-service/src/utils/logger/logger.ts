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
    const logAllRequests = configService.getBoolean('LOG_HTTP_REQUESTS', false);

    // Only log incoming requests if explicitly enabled
    if (logAllRequests) {
        Logger.info('Incoming request', {
            correlation_id: correlationId,
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip,
        });
    }

    // Capture response - only log errors by default
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Always log errors, optionally log all requests if enabled
        if (res.statusCode >= 400 || logAllRequests) {
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

