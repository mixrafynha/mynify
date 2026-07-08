export const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function sanitizeEmail(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w@.\-+]/gi, "")
    .trim()
    .slice(0, 254);
}

export function safeOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function safeNextPath() {
  if (typeof window === "undefined") return "/dashboard";

  const path = window.location.pathname + window.location.search;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return "/dashboard";

  return path;
}
