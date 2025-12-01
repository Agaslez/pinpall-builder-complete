// server/broker/index.ts
import type {
  ChatInput,
  ProjectKind,
  NormalizedProjectSpec,
} from "./types";
import { getAdapter } from "./registry";

/**
 * Główna funkcja brokera:
 * - przyjmuje typ projektu (pinpall / talism / deepintel / generic)
 * - oraz ChatInput (tekst czatu + źródło)
 * - zwraca ujednolicony opis projektu (NormalizedProjectSpec)
 *
 * UWAGA: tutaj NIE przechowujemy żadnych sekretów (PIN-y, hasła, klucze).
 * To tylko meta–opis projektu.
 */
export async function buildProjectSpec(
  kind: ProjectKind,
  input: ChatInput
): Promise<NormalizedProjectSpec> {
  const adapter = getAdapter(kind);
  return adapter.normalizeChat(input);
}

// (opcjonalnie) re-eksport listy adapterów, jeśli kiedyś będziemy robić endpoint typu /api/adapters
export { getAdapter } from "./registry";
export type { ChatInput, ProjectKind, NormalizedProjectSpec } from "./types";
