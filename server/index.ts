// server/index.ts

import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerRoutes } from "./routes";

dotenv.config();

// ESM odpowiednik __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development", stripeApiKey: process.env.STRIPE_API_KEY });
});

registerRoutes(app);

// katalog z buildem frontendu (Vite wrzuca tu pliki)
const publicDir = path.resolve(__dirname, "public");
console.log("Static public dir:", publicDir);

app.use(express.static(publicDir));

app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server listening on http://${HOST}:${PORT}`);
});

server.on("error", (err: any) => {
  console.error("❌ Server listen error:", err);
  process.exit(1);
});
