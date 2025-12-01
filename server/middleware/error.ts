// server/middleware/error.ts
import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError ? err.statusCode : 500;
  const code = err.code || (err instanceof HttpError ? err.code : undefined);

  // Minimalny log
  // @ts-ignore
  const requestId = (req as any).requestId;
  console.error(
    `[ERROR] ${requestId ?? 'no-id'} ${req.method} ${req.path} -> ${status} ${err.message}`,
    {
      stack: err.stack,
      code,
    },
  );

  if (status === 500 && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Unexpected error. Please try again later.',
      requestId,
    });
  }

  return res.status(status).json({
    error: code || 'Error',
    message: err.message || 'Unknown error',
    requestId,
  });
}
