// server/routes.ts
import express, { type Express, type Request } from "express";
import JSZip from "jszip";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import { ChatParser } from "./chatParser";
import { ChatImporter } from "./parsers/ChatImporter";
import { storage } from "./storage";
import { createCheckoutSession } from "./stripe";

import { assertSafeUrl } from "./security";
import {
  checkoutSchema,
  importChatSchema,
  validateBody,
} from "./validation";

import { buildProjectSpec } from "./broker";
import type { ProjectKind } from "./broker/types";
import { HttpError } from "./middleware/error";

// ✅ TURA 1 – normalizacja wejścia czatu
import { normalizeChatInput } from "./pipeline/chatInput";

function resolveProjectKind(req: Request): ProjectKind {
  const fromHeader = req.header("x-project-kind") as ProjectKind | undefined;
  const fromBody =
    (req.body?.projectKind as ProjectKind | undefined) ?? fromHeader;
  return fromBody ?? "generic";
}

export async function registerRoutes(app: Express) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  const chatImporter = new ChatImporter();

  // -----------------------------
  // 🩺 /api/health – prosty healthcheck
  // -----------------------------
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      env: process.env.NODE_ENV || "development",
      time: new Date().toISOString(),
    });
  });

  // -----------------------------
  // 📥 /api/parse-chat – upload pliku z czatem
  // -----------------------------
  app.post(
    "/api/parse-chat",
    upload.single("chatFile"),
    async (req, res, next) => {
      try {
        if (!req.file) {
          throw new HttpError(400, "No file uploaded");
        }

        const projectKind = resolveProjectKind(req);

        // ✅ TURA 1 – normalizacja + limity
        const normalized = normalizeChatInput(
          req.file.buffer.toString("utf-8"),
          "file",
          req.file.originalname
        );

        // ✅ TURA 2 – spec projektu (broker)
        const spec = await buildProjectSpec(projectKind, normalized);

        // ✅ TURA 3 – parser właściwy
        const parser = new ChatParser(normalized.rawText);
        const parsed = parser.parse();

        const projectId = uuidv4();
        const baseName = normalized.fileName.replace(/\.[^.]+$/, "");
        const projectName = `[${spec.kind}] ${baseName}`;

        // FIX: Przekaż projectId i fileSize do createParseProject
        await storage.createParseProject({
          id: projectId, // DODANE
          name: projectName,
          originalFileName: normalized.fileName,
          fileSize: Buffer.byteLength(normalized.rawText, 'utf8'), // DODANE
        });

        for (const file of parsed.files) {
          await storage.createParsedFile({
            projectId,
            filePath: file.path || "untitled",
            content: file.content || "",
            fileType: file.type as "file" | "folder",
            language: file.language,
            lineCount: (file.content || "").split('\n').length, // DODANE
          });
        }

        for (const element of parsed.unrecognizedBlocks) {
          await storage.createUnrecognizedElement({
            projectId,
            content: element.content || "",
            lineNumber: element.lineNumber || 0,
            context: element.context || "",
            suggestedType: element.suggestedType || "unknown",
          });
        }

        res.status(201).json({
          projectId,
          projectKind: spec.kind,
          projectName,
          filesFound: parsed.files.filter((f) => f.type === "file").length,
          unrecognizedCount: parsed.unrecognizedBlocks.length,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // -----------------------------
  // 🌐 /api/import-chat – z URL albo JSON
  // -----------------------------
  app.post(
    "/api/import-chat",
    express.json({ limit: "50mb" }),
    validateBody(importChatSchema),
    async (req, res, next) => {
      try {
        const { url, json, source } = req.body as {
          url?: string;
          json?: string | object;
          source?: string;
          projectKind?: ProjectKind;
        };

        const projectKind = resolveProjectKind(req as Request);

        let content: string;
        let chatSource: "url" | "json";

        if (url) {
          // klasyczny tryb: prawidłowy link w polu URL
          const safeUrl = assertSafeUrl(url);
          const result = await chatImporter.importFromURL(safeUrl.toString());
          content = result.content;
          chatSource = "url";
        } else if (json) {
          // 🔧 FIX: user wkleił LINK do pola "JSON"
          if (typeof json === "string" && json.trim().startsWith("http")) {
            const safeUrl = assertSafeUrl(json.trim());
            const result = await chatImporter.importFromURL(safeUrl.toString());
            content = result.content;
            chatSource = "url";
          } else {
            // normalny JSON (string lub obiekt)
            const result = await chatImporter.importFromJSON(json);
            content = result.content;
            chatSource = "json";
          }
        } else {
          throw new HttpError(400, "Provide url or json");
        }

        // ✅ TURA 1 – normalizacja dla importu
        const normalized = normalizeChatInput(
          content,
          chatSource,
          `${source || "import"}.txt`
        );

        // ✅ TURA 2 – spec projektu
        const spec = await buildProjectSpec(projectKind, normalized);

        // ✅ TURA 3 – parser
        const parser = new ChatParser(normalized.rawText);
        const parsed = parser.parse();

        const projectId = uuidv4();

        const projectName = `[${spec.kind}] ${source || "Chat"}_${new Date()
          .toISOString()
          .slice(0, 10)}`;

        // FIX: Przekaż projectId i fileSize do createParseProject
        await storage.createParseProject({
          id: projectId, // DODANE
          name: projectName,
          originalFileName: normalized.fileName,
          fileSize: Buffer.byteLength(normalized.rawText, 'utf8'), // DODANE
        });

        for (const file of parsed.files) {
          await storage.createParsedFile({
            projectId,
            filePath: file.path || "untitled",
            content: file.content || "",
            fileType: file.type as "file" | "folder",
            language: file.language,
            lineCount: (file.content || "").split('\n').length, // DODANE
          });
        }

        for (const element of parsed.unrecognizedBlocks) {
          await storage.createUnrecognizedElement({
            projectId,
            content: element.content || "",
            lineNumber: element.lineNumber || 0,
            context: element.context || "",
            suggestedType: element.suggestedType || "unknown",
          });
        }

        res.status(201).json({
          projectId,
          projectKind: spec.kind,
          projectName,
          filesFound: parsed.files.filter((f) => f.type === "file").length,
          unrecognizedCount: parsed.unrecognizedBlocks.length,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // -----------------------------
  // 📂 /api/projects – lista projektów
  // -----------------------------
  app.get("/api/projects", async (_req, res, next) => {
    try {
      const projects = await storage.getAllParseProjects();
      res.json(projects);
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------
  // 📁 /api/projects/:id – detale projektu
  // -----------------------------
  app.get("/api/projects/:id", async (req, res, next) => {
    try {
      const project = await storage.getParseProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------
  // 🧩 /api/unrecognized/:id – update elementu
  // -----------------------------
  app.put("/api/unrecognized/:id", express.json(), async (req, res, next) => {
    try {
      const { resolved, suggestedType } = req.body;

      await storage.updateUnrecognizedElement(req.params.id, {
        resolved,
        suggestedType,
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------
  // 📦 /api/projects/:id/download – ZIP z projektem
  // -----------------------------
  app.get("/api/projects/:id/download", async (req, res, next) => {
    try {
      const fullProject = await storage.getFullProject(req.params.id);

      if (!fullProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const zip = new JSZip();
      let totalSize = 0;
      const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB limit

      // Dodaj pliki z limitem rozmiaru
      for (const file of fullProject.files) {
        if (file.fileType === "file" && file.content.trim()) {
          const fileSize = Buffer.byteLength(file.content, 'utf8');
          totalSize += fileSize;
          
          if (totalSize > MAX_ZIP_SIZE) {
            throw new HttpError(413, `ZIP would exceed maximum size of ${MAX_ZIP_SIZE / 1024 / 1024}MB`);
          }
          
          zip.file(file.filePath, file.content);
        }
      }

      // Dodaj foldery
      fullProject.files
        .filter((file) => file.fileType === "folder")
        .forEach((folder) => {
          zip.folder(folder.filePath);
        });

      if (fullProject.unrecognizedElements.length > 0) {
        let readmeContent = `# ${fullProject.project.name}\n\n`;
        readmeContent += `## Unrecognized Elements\n\n`;
        readmeContent += `Found ${fullProject.unrecognizedElements.length} unrecognized elements:\n\n`;

        fullProject.unrecognizedElements.forEach((element, index) => {
          readmeContent += `### Element ${index + 1}\n`;
          readmeContent += `**Line:** ${element.lineNumber}\n`;
          readmeContent += `**Context:** ${element.context}\n`;
          readmeContent += `**Suggested Type:** ${
            element.suggestedType || "Unknown"
          }\n`;
          readmeContent += `**Content:**\n\`\`\`\n${
            element.content
          }\n\`\`\`\n\n`;
        });

        const readmeSize = Buffer.byteLength(readmeContent, 'utf8');
        totalSize += readmeSize;
        
        if (totalSize > MAX_ZIP_SIZE) {
          throw new HttpError(413, `ZIP would exceed maximum size of ${MAX_ZIP_SIZE / 1024 / 1024}MB`);
        }
        
        zip.file("UNRECOGNIZED_ELEMENTS.md", readmeContent);
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fullProject.project.name}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      });

      res.send(zipBuffer);
    } catch (err) {
      next(err);
    }
  });

  // -----------------------------
  // 💳 /api/checkout – tworzenie sesji Stripe
  // -----------------------------
  app.post(
    "/api/checkout",
    express.json(),
    validateBody(checkoutSchema),
    async (req, res, next) => {
      try {
        const { tier, email } = req.body as {
          tier: "pro" | "enterprise";
          email: string;
        };

        if (!process.env.STRIPE_SECRET_KEY) {
          return res
            .status(501)
            .json({ error: "Stripe not configured on server" });
        }

        const session = await createCheckoutSession(tier, email);
        res.json({ url: session.url });
      } catch (err) {
        next(err);
      }
    }
  );

  return app;
}
