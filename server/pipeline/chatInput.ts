// server/pipeline/chatInput.ts
import { Buffer } from "node:buffer";
import type { ChatInput } from "../broker/types";
import { HttpError } from "../middleware/error";

export interface NormalizedChatInput extends ChatInput {
  sizeKb: number;
  lineCount: number;
}

/**
 * Domyślny maksymalny rozmiar czatu w KB (5 MB).
 * Możesz nadpisać przez PINPALL_MAX_CHAT_KB w .env
 */
const DEFAULT_MAX_KB = 5 * 1024;

export const MAX_CHAT_SIZE_KB = Number(
  process.env.PINPALL_MAX_CHAT_KB || DEFAULT_MAX_KB
);

export function normalizeChatInput(
  rawText: string,
  source: ChatInput["source"],
  fileName: string
): NormalizedChatInput {
  const text = (rawText || "").toString();

  // 1) Normalizacja końcówek linii + trim
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    throw new HttpError(400, "Chat content is empty");
  }

  // 2) Rozmiar i liczba linii
  const sizeKb = Buffer.byteLength(normalized, "utf-8") / 1024;
  const lineCount = normalized.split("\n").length;

  if (sizeKb > MAX_CHAT_SIZE_KB) {
    throw new HttpError(
      413,
      `Chat too large: ${sizeKb.toFixed(
        0
      )} KB (limit ${MAX_CHAT_SIZE_KB} KB). Try to split it into smaller parts.`
    );
  }

  // 3) Bezpieczna nazwa pliku (żeby nie było ../ itd.)
  const safeFileName = fileName.replace(/[\r\n]/g, "").trim() || "chat.txt";

  return {
    rawText: normalized,
    source,
    fileName: safeFileName,
    sizeKb,
    lineCount,
  };
}
