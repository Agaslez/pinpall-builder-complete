// server/config/env.ts
import 'dotenv/config';

type NodeEnv = 'development' | 'production' | 'test';

interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function parseNumber(name: string, value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    console.warn(`[env] ${name} is not a valid number, using fallback=${fallback}`);
    return fallback;
  }
  return parsed;
}

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) {
    // dev default
    return ['http://127.0.0.1:3000', 'http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const nodeEnv = (process.env.NODE_ENV as NodeEnv | undefined) ?? 'development';

export const config: AppConfig = {
  nodeEnv,
  port: parseNumber('PORT', process.env.PORT, 3000),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  rateLimitWindowMs: parseNumber('RATE_LIMIT_WINDOW_MS', process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumber('RATE_LIMIT_MAX', process.env.RATE_LIMIT_MAX, 100),
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) ?? 'info',
};
