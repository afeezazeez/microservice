import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import configService from '../utils/config/config.service';
import { AuthenticationException } from '../exceptions/authentication.exception';
import logger from '../utils/logger/logger';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  company_id: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
}

const CORRELATION_HEADER = 'x-correlation-id';

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const correlationId = req.headers[CORRELATION_HEADER] as string;

    const response = await axios.get(`${configService.iamServiceUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        [CORRELATION_HEADER]: correlationId,
      },
      timeout: 5000,
    });

    if (!response.data?.success || !response.data?.data) {
      throw new AuthenticationException('Invalid token');
    }

    req.user = response.data.data as AuthenticatedUser;
    req.correlationId = correlationId;

    next();
  } catch (error) {
    if (error instanceof AuthenticationException) {
      next(error);
      return;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        next(new AuthenticationException('Invalid or expired token'));
        return;
      }
      logger.error({ error: error.message }, 'IAM service error');
    }

    next(new AuthenticationException('Authentication failed'));
  }
}


