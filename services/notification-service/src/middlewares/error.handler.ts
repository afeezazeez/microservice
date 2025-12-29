import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/http/response-handlers';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { AuthenticationException } from '../exceptions/authentication.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ClientErrorException) {
    sendErrorResponse(res, err.message, null, [], [], err.statusCode);
    return;
  }

  if (err instanceof AuthenticationException) {
    sendErrorResponse(res, err.message, null, [], [], err.statusCode);
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  sendErrorResponse(res, 'An error occurred. Please try again later', null, [], [], ResponseStatus.INTERNAL_SERVER);
}

