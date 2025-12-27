import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ResponseStatus } from '../enums/http-status-codes';

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ClientErrorException('User not authenticated', ResponseStatus.UNAUTHORIZED));
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(permission)) {
      return next(
        new ClientErrorException(
          'You do not have permission to perform this action',
          ResponseStatus.FORBIDDEN
        )
      );
    }

    next();
  };
}

