export type LoginLoadingState = false | "email" | "google" | "apple" | "resend";

export type LoginFailureCode =
  | "user_not_found"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "captcha"
  | "rate_limited"
  | "unavailable"
  | "failed";

export type LoginResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; code?: LoginFailureCode; error: unknown };
