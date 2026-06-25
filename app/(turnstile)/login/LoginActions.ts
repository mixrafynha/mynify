import { supabase } from "@/lib/supabase";
import { safeOrigin } from "../shared/AuthValidation";
import type { OAuthProvider } from "../shared/types";
import type { LoginFailureCode, LoginResult } from "./types";

function mapLoginError(error: unknown): LoginFailureCode {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  if (message.includes("not confirmed") || message.includes("email_not_confirmed")) {
    return "email_not_confirmed";
  }

  if (message.includes("captcha") || message.includes("challenge")) {
    return "captcha";
  }

  if (message.includes("rate") || message.includes("too many")) {
    return "rate_limited";
  }

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("invalid email or password") ||
    message.includes("invalid")
  ) {
    return "invalid_credentials";
  }

  return "failed";
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
  token: string;
}): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
      options: {
        captchaToken: input.token,
      },
    });

    if (error) {
      return {
        ok: false,
        code: mapLoginError(error),
        error,
      };
    }

    if (!data.session) {
      return {
        ok: false,
        code: "failed",
        error: new Error("No session created"),
      };
    }

    return {
      ok: true,
      userId: data.session.user.id,
      email: data.session.user.email ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      code: "failed",
      error,
    };
  }
}

export async function startOAuthLogin(
  provider: OAuthProvider
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${safeOrigin()}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function resendVerificationEmail(
  email: string
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${safeOrigin()}/auth/callback`,
      },
    });

    if (error) {
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
