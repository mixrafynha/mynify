export type AuthErrorKind =
  | "email_not_confirmed"
  | "user_not_found"
  | "invalid_credentials"
  | "rate_limit"
  | "captcha"
  | "timeout"
  | "network"
  | "weak_password"
  | "temporary_email"
  | "email_exists"
  | "unconfirmed_existing_email"
  | "internal";

export type NormalizedAuthError = {
  kind: AuthErrorKind;
  message: string;
  canResendVerification?: boolean;
};

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

export function normalizeLoginError(error: unknown): NormalizedAuthError {
  const message = messageFromUnknown(error);

  if (message.includes("email_not_confirmed") || message.includes("email not confirmed") || message.includes("not confirmed")) {
    return {
      kind: "email_not_confirmed",
      message: "Email not confirmed. Check your inbox or resend the verification email.",
      canResendVerification: true,
    };
  }

  if (message.includes("captcha") || message.includes("challenge")) {
    return { kind: "captcha", message: "Captcha failed. Please verify again." };
  }

  if (message.includes("rate_limited") || message.includes("rate") || message.includes("too many")) {
    return { kind: "rate_limit", message: "Too many attempts. Try again later." };
  }

  if (message.includes("abort") || message.includes("timeout") || message.includes("timed out")) {
    return { kind: "timeout", message: "Request timed out. Try again." };
  }

  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return { kind: "network", message: "Network error. Check your connection and try again." };
  }

  if (message.includes("user_not_found") || message.includes("account_not_found") || message.includes("no_account")) {
    return {
      kind: "user_not_found",
      message: "No account exists with this email. Create an account first.",
    };
  }

  if (message.includes("invalid login") || message.includes("invalid credentials") || message.includes("invalid")) {
    return { kind: "invalid_credentials", message: "Email or password is incorrect." };
  }

  return { kind: "internal", message: "Login failed. Try again." };
}

export function normalizeSignupError(status: number | null, message: string, error?: unknown): NormalizedAuthError {
  const raw = `${message} ${messageFromUnknown(error)}`.toLowerCase();

  if (status === 429 || raw.includes("too many") || raw.includes("rate")) {
    return { kind: "rate_limit", message: raw.includes("tomorrow") ? "Too many accounts today. Try again tomorrow." : "Too many requests. Try again later." };
  }

  if (raw.includes("captcha") || raw.includes("challenge")) {
    return { kind: "captcha", message: "Captcha failed. Please verify again." };
  }

  if (raw.includes("weak") || raw.includes("password")) {
    return { kind: "weak_password", message: "Password must have 10+ characters, uppercase, lowercase, number and symbol." };
  }

  if (raw.includes("temporary") || raw.includes("disposable")) {
    return { kind: "temporary_email", message: "Temporary emails are not allowed." };
  }

  if (raw.includes("already") || raw.includes("registered") || raw.includes("exists")) {
    return {
      kind: "email_exists",
      message: "This email is already registered. Try logging in or resend the verification email.",
      canResendVerification: true,
    };
  }

  if (raw.includes("not confirmed") || raw.includes("unconfirmed")) {
    return {
      kind: "unconfirmed_existing_email",
      message: "This email exists but is not confirmed. Resend the verification email.",
      canResendVerification: true,
    };
  }

  if (raw.includes("abort") || raw.includes("timeout") || raw.includes("timed out")) {
    return { kind: "timeout", message: "Request timed out. Try again." };
  }

  if (raw.includes("fetch") || raw.includes("network") || raw.includes("failed to fetch")) {
    return { kind: "network", message: "Network error. Check your connection and try again." };
  }

  if (status === 503 || status === 500) {
    return { kind: "internal", message: "Signup is temporarily unavailable. Try again later." };
  }

  return { kind: "internal", message: message || "Signup failed. Try again." };
}
