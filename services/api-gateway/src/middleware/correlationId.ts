import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const CORRELATION_HEADER = 'x-correlation-id';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const inboundId = req.header(CORRELATION_HEADER);
  const correlationId = inboundId && inboundId.trim().length > 0 ? inboundId : uuid();

  // make it available on request and outgoing response
  (req as any).correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  next();
}

