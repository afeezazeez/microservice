import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import { WinstonLogger } from '../utils/logger/winston.logger';

const Logger = new WinstonLogger('PermissionMiddleware');

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ClientErrorException('User not authenticated', ResponseStatus.UNAUTHORIZED));
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(permission)) {
      Logger.warn('Permission denied', {
        user_id: req.user.id,
        required_permission: permission,
        user_permissions: userPermissions,
        path: req.path,
        method: req.method,
      });
      return next(
        new ClientErrorException(
          `You do not have permission to perform this action: ${permission}`,
          ResponseStatus.FORBIDDEN
        )
      );
    }

    next();
  };
}

