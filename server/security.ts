// server/security.ts
import { URL } from "node:url";

const ALLOWED_HOSTS = [
  "chat.openai.com",
  "claude.ai",
  "console.anthropic.com",
  // dopiszesz swoje, jak będziesz chciał
];

export function assertSafeUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();

  const forbiddenHosts = ["localhost", "127.0.0.1", "::1"];
  if (forbiddenHosts.includes(hostname)) {
    throw new Error("Localhost URLs are not allowed");
  }

  if (!ALLOWED_HOSTS.includes(hostname)) {
    throw new Error("Domain not allowed");
  }

  return url;
}
