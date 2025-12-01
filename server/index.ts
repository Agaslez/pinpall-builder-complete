// server/index.ts
import dotenv from "dotenv";
import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import { log, serveStatic } from "./vite";

dotenv.config();

async function main() {
  const app: Express = express();

  const port = Number(process.env.PORT) || 3000;

  // API (parse-chat, import-chat itd.)
  await registerRoutes(app);

  // Serwowanie zbudowanego frontu z dist/public
  serveStatic(app);

  app.listen(port, () => {
    log(`✅ Server listening on http://127.0.0.1:${port}`);
  });
}

main().catch((err) => {
  console.error("[FATAL] Failed to start server", err);
  process.exit(1);
});
