// server/security.ts
import { URL } from "node:url";

const ALLOWED_HOSTS = [
  "chat.openai.com",
  "claude.ai",
  "console.anthropic.com",
  "github.com",
  "raw.githubusercontent.com",
  "gist.githubusercontent.com",
  "pastebin.com",
  "hastebin.com",
  "127.0.0.1",
  "localhost",
  // Dodaj własne domeny
  process.env.ALLOWED_DOMAIN_1,
  process.env.ALLOWED_DOMAIN_2,
].filter(Boolean);

export function assertSafeUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Only HTTPS URLs are allowed (except localhost)");
  }

  const hostname = url.hostname.toLowerCase();

  // Pozwól na localhost w trybie development
  if (process.env.NODE_ENV === "development" && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return url;
  }

  if (!ALLOWED_HOSTS.includes(hostname)) {
    throw new Error(`Domain not allowed: ${hostname}. Allowed domains: ${ALLOWED_HOSTS.join(", ")}`);
  }

  return url;
}
