import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { sendErrorResponse } from '../utils/response';

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  company_id: number;
  company_name: string | null;
  roles: string[];
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  company_id: number;
  company_name: string | null;
  roles: string[];
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return sendErrorResponse(res, 'Missing or invalid authorization header', null, [], [], 401);
  }

  const token = authHeader.slice(7).trim();
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      company_id: decoded.company_id,
      company_name: decoded.company_name,
      roles: decoded.roles || [],
    } as AuthenticatedUser;
    
    (req as any).token = token;
    
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendErrorResponse(res, 'Token expired', null, [], [], 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return sendErrorResponse(res, 'Invalid token', null, [], [], 401);
    }
    return sendErrorResponse(res, 'Unauthorized', null, [], [], 401);
  }
}

