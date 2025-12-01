// server/broker/registry.ts
import type {
  ChatInput,
  NormalizedProjectSpec,
  ProjectAdapter,
  ProjectKind,
} from "./types";

// Na razie prosty "passthrough" – niczego nie zapisujemy jako vault.
// Później tu wejdzie logika typu: PINpall = vault UI, PINnode itd.
async function passthroughAdapter(
  kind: ProjectKind,
  input: ChatInput
): Promise<NormalizedProjectSpec> {
  return {
    kind,
    title: input.fileName ?? `Generated for ${kind}`,
    description: `Project spec for ${kind} generated from source: ${input.source}`,
  };
}

const adapters: Record<ProjectKind, ProjectAdapter> = {
  pinpall: {
    id: "pinpall",
    label: "PINpall Core",
    description: "PIN manager / vault projects (bez przechowywania sekretów w Builderze).",
    normalizeChat: (input) => passthroughAdapter("pinpall", input),
  },
  talism: {
    id: "talism",
    label: "TALISM.AI",
    description: "Emotional avatar / talisman projects.",
    normalizeChat: (input) => passthroughAdapter("talism", input),
  },
  deepintel: {
    id: "deepintel",
    label: "DeepIntel",
    description: "Lead-gen & OSINT pipelines.",
    normalizeChat: (input) => passthroughAdapter("deepintel", input),
  },
  generic: {
    id: "generic",
    label: "Generic Builder",
    description: "Generic TypeScript/Node/React project.",
    normalizeChat: (input) => passthroughAdapter("generic", input),
  },
};

export function getAdapter(kind: ProjectKind): ProjectAdapter {
  const adapter = adapters[kind];
  if (!adapter) {
    throw new Error(`Unknown project adapter: ${kind}`);
  }
  return adapter;
}

export function listAdapters() {
  return Object.values(adapters).map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
  }));
}
