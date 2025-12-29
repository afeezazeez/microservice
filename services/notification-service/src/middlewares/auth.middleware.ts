import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error_message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (decoded.type && decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error_message: 'Invalid token type',
      });
      return;
    }

    (req as AuthenticatedRequest).user = {
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
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error_message: 'Token expired',
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error_message: 'Invalid token',
      });
      return;
    }
    logger.error(`Auth middleware error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(401).json({
      success: false,
      error_message: 'Unauthorized',
    });
  }
}

