// server/middleware/security.ts
import compression from 'compression';
import cors from 'cors';
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from '../config/env';

export function applySecurity(app: Express) {
  app.set('trust proxy', 1); // żeby X-Forwarded-For działało poprawnie za proxy

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // np. curl, Postman
        if (config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy:
        config.nodeEnv === 'production'
          ? {
              useDefaults: true,
              directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'"],
              },
            }
          : false, // w dev CSP wyłączone (łatwiej debugować)
    }),
  );

  app.use(compression());

  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  // Rate limit tylko na API (nie na assety)
  app.use('/api', limiter);
}
