import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/http/response-handlers';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ValidationException } from '../exceptions/validation.exception';
import { AuthenticationException } from '../exceptions/authentication.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import { WinstonLogger } from '../utils/logger/winston.logger';

const Logger = new WinstonLogger('ErrorHandler');

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ClientErrorException) {
    sendErrorResponse(res, err.message, null, [], [], err.statusCode);
    return;
  }

  if (err instanceof ValidationException) {
    sendErrorResponse(res, err.message || 'Failed validation', err.errors, [], [], err.statusCode);
    return;
  }

  if (err instanceof AuthenticationException) {
    sendErrorResponse(res, err.message, null, [], [], err.statusCode);
    return;
  }

  Logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  sendErrorResponse(res, 'An error occurred. Please try again later', null, [], [], ResponseStatus.INTERNAL_SERVER);
}
