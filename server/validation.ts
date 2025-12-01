// server/validation.ts
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// 🔹 Schemat dla /api/import-chat
// body: { url?: string; json?: string | object; source?: string }
export const importChatSchema = z
  .object({
    url: z
      .string()
      .url()
      .max(2000)
      .optional()
      .describe("Opcjonalny URL do pobrania czatu"),
    json: z
      .union([z.string(), z.record(z.any())])
      .optional()
      .describe("Opcjonalny JSON z czatem"),
    source: z.string().max(200).optional(),
  })
  .refine(
    (data) => !!data.url || !!data.json,
    {
      message: "Provide url or json",
      path: ["url"],
    }
  );

// 🔹 (na przyszłość) schemat dla parsowania czatu z JSON-a
export const parseChatSchema = z.object({
  projectName: z.string().min(1).max(200),
  chatContent: z.string().min(1).max(2_000_000),
  strictMode: z.boolean().default(true),
});

// 🔹 Schemat dla /api/checkout
// body: { tier: "pro" | "enterprise"; email: string }
export const checkoutSchema = z.object({
  tier: z.enum(["pro", "enterprise"]),
  email: z.string().email().max(320),
});

// 🔹 Helper – middleware do walidacji body za pomocą Zod
export function validateBody(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return res.status(400).json({
        ok: false,
        error: "Invalid request body",
        detail: {
          path: firstError.path,
          message: firstError.message,
        },
      });
    }

    req.body = parseResult.data; // zwalidowane + defaulty
    next();
  };
}
