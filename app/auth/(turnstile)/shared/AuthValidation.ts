export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const SIGNUP_PASSWORD_MIN_LENGTH = 10;

export function sanitizeEmail(value: string): string {
  return value
    .replace(/[^\w@.!\#$%&'*+/=?^`{|}~\-]/gi, "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length < 254;
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;
}

export function isStrongPassword(value: string): boolean {
  return (
    value.length >= SIGNUP_PASSWORD_MIN_LENGTH &&
    value.length <= PASSWORD_MAX_LENGTH &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function safeRoute(path: string): string {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
}

export function safeOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
