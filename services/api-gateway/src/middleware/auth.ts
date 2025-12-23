import { NextFunction, Request, Response } from 'express';
import { getAuthenticatedUser } from '../proxy/iamProxy.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.slice(7).trim();
  try {
    const user = await getAuthenticatedUser(token, (req as any).correlationId);
    (req as any).user = user;
    return next();
  } catch (error) {
    const status = (error as any)?.status ?? 401;
    const data = (error as any)?.data ?? { success: false, error: 'Unauthorized' };
    return res.status(status).json(data);
  }
}

