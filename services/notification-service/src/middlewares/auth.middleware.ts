import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthenticationException } from '../exceptions/authentication.exception';

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  company_id: number;
  company_name?: string | null;
  roles?: string[];
  permissions?: string[];
  type?: string;
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
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (decoded.type && decoded.type !== 'access') {
      throw new AuthenticationException('Invalid token type');
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      company_id: decoded.company_id,
      company_name: decoded.company_name,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    } as AuthenticatedUser;

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

    logger.error(`Auth middleware error: ${error instanceof Error ? error.message : String(error)}`);
    next(new AuthenticationException('Authentication failed'));
  }
}

