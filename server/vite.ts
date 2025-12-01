import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createLogger, createServer as createViteServer } from "vite";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // POPRAWIONA ŚCIEŻKA: zamiast "public" -> "../dist/public"
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  
  console.log(`📁 Looking for static files in: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Build directory not found: ${distPath}`);
    console.log('⚠️  Please run: npm run build');
    
    // Sprawdź co jest w dist
    const parentDist = path.resolve(import.meta.dirname, "..", "dist");
    if (fs.existsSync(parentDist)) {
      console.log('📁 Contents of dist directory:');
      const items = fs.readdirSync(parentDist);
      items.forEach(item => {
        const itemPath = path.join(parentDist, item);
        const stats = fs.statSync(itemPath);
        console.log(`  ${item} ${stats.isDirectory() ? '(dir)' : '(file)'}`);
      });
    }
    
    // Utwórz tymczasowy index.html
    const tempHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>PINpall - Build Required</title></head>
        <body>
          <h1>Build Required</h1>
          <p>Please run: <code>npm run build</code></p>
          <p>Then refresh this page.</p>
        </body>
      </html>
    `;
    
    app.use("*", (req: any, res: any) => {
      if (req.path === "/api/health") {
        res.json({ status: "build-required", message: "Please run npm run build" });
      } else {
        res.send(tempHtml);
      }
    });
    
    return;
  }

  console.log(`✅ Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback routing - POPRAWIONE
  app.use("*", (req: any, res: any) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.resolve(distPath, "index.html"));
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
}