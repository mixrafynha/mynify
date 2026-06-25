type SignupLogLevel = "info" | "warn" | "error";

type SignupLogEvent =
  | "signup_form_view"
  | "signup_email_changed"
  | "signup_validation_failed"
  | "signup_turnstile_token_received"
  | "signup_turnstile_token_cleared"
  | "signup_turnstile_error"
  | "signup_submit_started"
  | "signup_submit_succeeded"
  | "signup_existing_account_detected"
  | "signup_submit_failed"
  | "signup_resend_started"
  | "signup_resend_succeeded"
  | "signup_resend_failed"
  | "signup_oauth_started"
  | "signup_oauth_failed";

type SignupLogInput = {
  event: SignupLogEvent;
  level?: SignupLogLevel;
  email?: string;
  reason?: string;
  provider?: "google" | "apple";
  status?: number | null;
  durationMs?: number;
  message?: string;
  errorName?: string;
  turnstileState?: "missing" | "ready" | "expired" | "error";
  metadata?: Record<string, string | number | boolean | null>;
};

type BrowserConnection = {
  effectiveType?: string;
  saveData?: boolean;
};

const SIGNUP_LOG_ENDPOINT = "/api/logs";
const SIGNUP_SESSION_KEY = "ryfio.signup.session";

function safeString(value: unknown, maxLength = 180): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function emailDomain(email?: string): string | undefined {
  const clean = safeString(email?.toLowerCase(), 254);
  if (!clean) return undefined;
  const atIndex = clean.lastIndexOf("@");
  if (atIndex < 1) return undefined;
  return clean.slice(atIndex + 1, 120);
}

async function sha256(value?: string): Promise<string | undefined> {
  const clean = safeString(value?.toLowerCase(), 254);
  if (!clean || typeof window === "undefined" || !window.crypto?.subtle) return undefined;

  const encoded = new TextEncoder().encode(clean);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function signupSessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const stored = window.sessionStorage.getItem(SIGNUP_SESSION_KEY);
    if (stored) return stored;

    const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(SIGNUP_SESSION_KEY, id);
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function connectionInfo(): BrowserConnection {
  if (typeof navigator === "undefined") return {};

  const nav = navigator as Navigator & { connection?: BrowserConnection };
  return {
    effectiveType: nav.connection?.effectiveType,
    saveData: nav.connection?.saveData,
  };
}

function viewportInfo() {
  if (typeof window === "undefined") {
    return { width: null, height: null, devicePixelRatio: null };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

function serializePayload(payload: unknown): string {
  return JSON.stringify(payload, (_key, value) => {
    if (value instanceof Error) return { name: value.name, message: value.message };
    return value;
  });
}

function sendLog(payload: unknown): void {
  if (typeof window === "undefined") return;

  const body = serializePayload(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(SIGNUP_LOG_ENDPOINT, blob);
      if (sent) return;
    }
  } catch {
    // fall back to fetch below
  }

  void fetch(SIGNUP_LOG_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => undefined);
}

export async function logSignupEvent(input: SignupLogInput): Promise<void> {
  try {
    const emailHash = await sha256(input.email);
    const viewport = viewportInfo();
    const connection = connectionInfo();

    sendLog({
      event: input.event,
      type: input.event,
      level: input.level ?? "info",
      source: "web.auth.signup",
      product: "Ryfio",
      timestamp: new Date().toISOString(),
      sessionId: signupSessionId(),
      path: typeof window === "undefined" ? undefined : window.location.pathname,
      referrer: typeof document === "undefined" ? undefined : document.referrer || undefined,
      locale: typeof navigator === "undefined" ? undefined : navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport,
      connection,
      emailHash,
      emailDomain: emailDomain(input.email),
      reason: safeString(input.reason, 120),
      provider: input.provider,
      status: input.status ?? undefined,
      durationMs: input.durationMs,
      message: safeString(input.message, 220),
      errorName: safeString(input.errorName, 80),
      turnstileState: input.turnstileState,
      metadata: input.metadata,
    });
  } catch {
    // Auth logs must never block signup, resend, OAuth or page rendering.
  }
}
