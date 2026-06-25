type LoginLogLevel = "info" | "warn" | "error";

type LoginLogEvent =
  | "login_form_view"
  | "login_validation_failed"
  | "login_turnstile_token_received"
  | "login_turnstile_token_cleared"
  | "login_turnstile_error"
  | "login_submit_started"
  | "login_user_not_found"
  | "login_invalid_credentials"
  | "login_email_not_confirmed"
  | "login_submit_succeeded"
  | "login_submit_failed"
  | "login_resend_started"
  | "login_resend_succeeded"
  | "login_resend_failed"
  | "login_oauth_started"
  | "login_oauth_failed";

type LoginLogInput = {
  event: LoginLogEvent;
  level?: LoginLogLevel;
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

export async function logLoginEvent(_input: LoginLogInput): Promise<void> {
  // Login must never depend on Firebase or /api/logs.
  // Keep this no-op locally and in auth flow to prevent logging failures from breaking UX.
}
