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

export async function logSignupEvent(_input: SignupLogInput): Promise<void> {
  // Signup must not write directly to Firebase or /api/logs.
  // The signup source of truth is the /api/signup response code:
  // created, account_exists, invalid_request, rate_limited, unavailable or failed.
}
