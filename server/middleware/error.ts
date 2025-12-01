// server/middleware/error.ts
import type { NextFunction, Request, Response } from "express";

const isProd = process.env.NODE_ENV === "production";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * 404 dla nieznanych endpointów API
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }
  return next();
}

/**
 * Globalny error handler
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[ERROR]", err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (!isProd && err instanceof Error) {
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }

  return res.status(500).json({ error: "Internal server error" });
}
