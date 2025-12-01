// server/middleware/logger.ts
import type { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

const skipHealthcheck = (req: Request) => req.path === '/api/health';

export const httpLogger = morgan('combined', {
  skip: skipHealthcheck,
});

export function requestId(req: Request, res: Response, next: NextFunction) {
  const existing = req.headers['x-request-id'];
  const id = (Array.isArray(existing) ? existing[0] : existing) || crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
