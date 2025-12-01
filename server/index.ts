// server/index.ts
import dotenv from "dotenv";
import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { applyLogger } from "./middleware/logger";
import { applySecurity } from "./middleware/security";
import { registerRoutes } from "./routes";
import { log, serveStatic } from "./vite";

dotenv.config();

async function main() {
  const app: Express = express();
  const port = Number(process.env.PORT) || 3000;

  // 1) logger
  applyLogger(app);

  // 2) security (helmet, CORS, rate-limit)
  applySecurity(app);

  // 3) API routes
  await registerRoutes(app);

  // 4) statyczny frontend z dist/public
  serveStatic(app);

  // 5) 404 dla /api/*
  app.use(notFoundHandler);

  // 6) global error handler
  app.use(errorHandler);

  app.listen(port, () => {
    log(`✅ Server listening on http://127.0.0.1:${port}`);
  });
}

main().catch((err) => {
  console.error("[FATAL] Failed to start server", err);
  process.exit(1);
});
