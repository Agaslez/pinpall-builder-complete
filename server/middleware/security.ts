// server/middleware/security.ts
import cors from "cors";
import type { Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const isProd = process.env.NODE_ENV === "production";

/**
 * Globalne middleware bezpieczeństwa:
 * - helmet (nagłówki)
 * - CORS
 * - rate-limit na API
 */
export function applySecurity(app: Express) {
  // Helmet – podstawowe nagłówki ochronne
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? undefined
        : false, // w dev często przeszkadza, w prod możesz doprecyzować
    })
  );

  // CORS – na razie prosty, można później zawęzić origin
  app.use(
    cors({
      origin: isProd ? ["https://pinpall.app", "https://www.pinpall.app"] : true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-project-kind",
        "x-requested-with",
      ],
      credentials: false,
    })
  );

  // Prostego rate-limitera zakładamy TYLKO na /api
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: isProd ? 200 : 1000, // mniej agresywnie w dev
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);
}
