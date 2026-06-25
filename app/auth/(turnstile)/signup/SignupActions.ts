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

function normalizeSignupCode(status: number | null, code?: SignupResultCode): SignupResultCode {
  if (code) return code;
  if (status === 409) return "account_exists";
  if (status === 429) return "rate_limited";
  if (status === 503 || status === 500) return "unavailable";
  if (status === 400) return "invalid_request";
  return "failed";
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
    const code = normalizeSignupCode(response.status, data.code);
    const message = data.message ?? "";

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code,
        message: message || "Signup failed.",
      };
    }

    if (code === "account_exists") {
      return {
        ok: false,
        status: response.status,
        code,
        message: message || "This email is already registered. Log in instead.",
      };
    }

    return {
      ok: true,
      status: response.status,
      code: "created",
      message: message || "Account created. Check your email to confirm your account.",
    };
  } catch (error) {
    return { ok: false, status: null, code: "failed", message: "Signup failed.", error };
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
