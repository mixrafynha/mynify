import { supabase } from "@/lib/supabase";
import { safeOrigin } from "../shared/AuthValidation";
import type { OAuthProvider } from "../shared/types";
import type { LoginFailureCode, LoginResult } from "./types";

type LoginCheckResponse = {
  ok?: boolean;
  code?: LoginFailureCode;
  message?: string;
};

async function checkUserExists(email: string): Promise<{ ok: true } | { ok: false; code: LoginFailureCode; error: Error }> {
  try {
    const response = await fetch("/api/login/check-user", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = (await response.json().catch(() => ({}))) as LoginCheckResponse;

    if (response.ok && data.ok) return { ok: true };

    const code: LoginFailureCode = data.code ?? (response.status === 404 ? "user_not_found" : "failed");
    return {
      ok: false,
      code,
      error: new Error(code),
    };
  } catch {
    return { ok: true };
  }
}

function mapLoginError(error: unknown): LoginFailureCode {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  if (message.includes("not confirmed")) return "email_not_confirmed";
  if (message.includes("captcha") || message.includes("challenge")) return "captcha";
  if (message.includes("rate") || message.includes("too many")) return "rate_limited";
  if (message.includes("invalid login") || message.includes("invalid credentials") || message.includes("invalid")) return "invalid_credentials";
  return "failed";
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
  token: string;
}): Promise<LoginResult> {
  try {
    const check = await checkUserExists(input.email);

    if (!check.ok) {
      return { ok: false, code: check.code, error: check.error };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
      options: { captchaToken: input.token },
    });

    if (error) return { ok: false, code: mapLoginError(error), error };
    if (!data.session) return { ok: false, code: "failed", error: new Error("No session created") };

    return {
      ok: true,
      userId: data.session.user.id,
      email: data.session.user.email ?? null,
    };
  } catch (error) {
    return { ok: false, code: "failed", error };
  }
}

export async function startOAuthLogin(provider: OAuthProvider): Promise<{ ok: true } | { ok: false; error: unknown }> {
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

export async function resendVerificationEmail(email: string): Promise<{ ok: true } | { ok: false; error: unknown }> {
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
