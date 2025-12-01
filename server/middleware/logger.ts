// server/middleware/logger.ts
import type { Express, NextFunction, Request, Response } from "express";
import morgan from "morgan";

const isProd = process.env.NODE_ENV === "production";

/**
 * Podpina HTTP logger (morgan).
 * - w dev: bardziej szczegółowy
 * - w prod: uproszczony log + X-Request-Id
 */
export function applyLogger(app: Express) {
  // prosty request-id (na prod możesz to zastąpić np. uuid)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    // @ts-expect-error – dodajemy pole dynamicznie
    req.id = `${Date.now().toString(36)}-${Math.random()
      .toString(16)
      .slice(2, 8)}`;
    next();
  });

  const format = isProd
    ? ':method :url :status :res[content-length] - :response-time ms'
    : 'DEV :method :url :status :res[content-length] - :response-time ms';

  app.use(morgan(format));
}
