// server/broker/types.ts

// Jaki typ projektu obsługujemy.
// UWAGA: tu NIE trzymamy prawdziwych PIN-ów, haseł itd.
// Builder ma pracować na zanonimizowanych / "fake" danych.
export type ProjectKind = "pinpall" | "talism" | "deepintel" | "generic";

export interface ChatInput {
  // Surowy tekst czatu / importu – w RAM, nie robimy z tego "vaulta" haseł.
  rawText: string;
  source: "file" | "url" | "json";
  fileName?: string;
}

// Normalizowany opis projektu dla adaptera/brokera.
// Na tym etapie jest lekki: typ projektu + opis.
export interface NormalizedProjectSpec {
  kind: ProjectKind;
  title: string;
  description: string;
}

// Adapter dla konkretnego typu projektu (PINpall, Talism, DeepIntel...).
// Na późniejszym etapie tutaj dokładamy logikę rozbijania na pliki, moduły itd.
export interface ProjectAdapter {
  id: ProjectKind;
  label: string;
  description: string;
  normalizeChat(input: ChatInput): Promise<NormalizedProjectSpec>;
}
