import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

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
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.slice(7).trim();
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    // Attach user payload to request
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      company_id: decoded.company_id,
      company_name: decoded.company_name,
      roles: decoded.roles || [],
    } as AuthenticatedUser;
    
    // Also attach the token for downstream services that may need it
    (req as any).token = token;
    
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

