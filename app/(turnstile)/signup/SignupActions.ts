import { supabase } from "@/lib/supabase";
import { safeOrigin } from "./SignupValidation";
import type { OAuthProvider } from "../shared/types";
import type { SignupResponse, SignupResultCode } from "./types";

type SignupActionSuccess = {
  ok: true;
  status: number;
  code: SignupResultCode;
  message: string;
};

type SignupActionFailure = {
  ok: false;
  status: number | null;
  code: SignupResultCode;
  message: string;
  error?: unknown;
};

export type SignupActionResult = SignupActionSuccess | SignupActionFailure;

function normalizeSignupCode(status: number | null, code?: SignupResultCode | string): SignupResultCode {
  if (code === "created") return "created";
  if (code === "account_exists" || code === "email_exists") return "account_exists";
  if (code === "captcha_failed") return "captcha_failed";
  if (code === "invalid_request") return "invalid_request";
  if (code === "rate_limited") return "rate_limited";
  if (code === "server_config" || code === "server_error" || code === "signup_failed") return code;
  if (status === 409) return "account_exists";
  if (status === 429) return "rate_limited";
  if (status === 503 || status === 500) return "server_error";
  if (status === 400) return "invalid_request";
  return "failed";
}

function fallbackMessage(code: SignupResultCode) {
  if (code === "created") return "Account created. We sent you a verification email.";
  if (code === "account_exists") return "This email is already registered. Try logging in.";
  if (code === "captcha_failed") return "Captcha failed. Please verify again.";
  if (code === "invalid_request") return "Password must have 10+ characters, uppercase, lowercase, number and symbol.";
  if (code === "rate_limited") return "Too many signup attempts. Try again later.";
  if (code === "server_config") return "Signup is not configured correctly.";
  return "Signup failed. Try again.";
}

export async function createAccount(input: {
  email: string;
  password: string;
  token: string;
}): Promise<SignupActionResult> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    const response = await fetch("/api/signup", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    window.clearTimeout(timeout);

    const data = (await response.json().catch(() => ({}))) as SignupResponse;
    const code = normalizeSignupCode(response.status, data.code ?? data.error);
    const message = data.message || fallbackMessage(code);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code,
        message,
      };
    }

    return {
      ok: true,
      status: response.status,
      code: "created",
      message,
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";

    return {
      ok: false,
      status: null,
      code: "failed",
      message: isAbort ? "Request timed out. Try again." : "Signup failed. Try again.",
      error,
    };
  }
}

export async function startOAuthSignup(provider: OAuthProvider): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${safeOrigin()}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) return { ok: false, error };
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function resendSignupVerification(email: string): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${safeOrigin()}/auth/callback` },
    });

    if (error) return { ok: false, error };

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
