import { Request } from 'express';

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

