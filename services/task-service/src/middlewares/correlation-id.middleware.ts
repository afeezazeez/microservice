import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const CORRELATION_HEADER = 'x-correlation-id';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function correlationIdMiddleware(
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
): void {
  const correlationId = (req.headers[CORRELATION_HEADER] as string) || uuidv4();

  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  next();
}

