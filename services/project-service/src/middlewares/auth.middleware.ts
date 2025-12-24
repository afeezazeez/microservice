import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import configService from '../utils/config/config.service';
import { AuthenticationException } from '../exceptions/authentication.exception';
import { WinstonLogger } from '../utils/logger/winston.logger';

const Logger = new WinstonLogger('AuthMiddleware');

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  company_id: number;
  company_name?: string | null;
  roles?: string[];
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  company_id: number;
  company_name?: string | null;
  roles?: string[];
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

    // Decode and verify JWT token directly
    // Note: API Gateway already validates tokens, so bad tokens shouldn't reach here
    const decoded = jwt.verify(token, configService.jwtSecret) as JwtPayload;

    // Extract user data from JWT payload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      company_id: decoded.company_id,
      company_name: decoded.company_name,
      roles: decoded.roles || [],
    } as AuthenticatedUser;

    req.correlationId = correlationId;

    next();
  } catch (error) {
    if (error instanceof AuthenticationException) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationException('Token expired'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationException('Invalid token'));
      return;
    }

    if (error instanceof jwt.NotBeforeError) {
      next(new AuthenticationException('Token not active'));
      return;
    }

    Logger.error('Authentication error', { error: error instanceof Error ? error.message : 'Unknown error' });
    next(new AuthenticationException('Authentication failed'));
  }
}
