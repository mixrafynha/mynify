"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthFormMode, AuthLoadingState } from "./auth.types";
import { safeNextPath, safeOrigin, sanitizeEmail } from "./auth.utils";
import { useTurnstile } from "./useTurnstile";

type Args = {
  mode: AuthFormMode;
  popup: boolean;
  onSuccess?: () => void;
};

export function useAuthForm({ mode, popup, onSuccess }: Args) {
  const [authMode, setAuthMode] = useState<AuthFormMode>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<AuthLoadingState>(false);
  const [error, setError] = useState("");

  const turnstile = useTurnstile();

  useEffect(() => {
    setAuthMode(mode);
    setError("");
    turnstile.resetCaptcha();
  }, [mode, turnstile.resetCaptcha]);

  useEffect(() => {
    if (turnstile.captchaError) setError(turnstile.captchaError);
  }, [turnstile.captchaError]);

  const finishPasswordLogin = useCallback(() => {
    if (popup) {
      onSuccess?.();
      return;
    }

    window.location.href = "/dashboard";
  }, [popup, onSuccess]);

  const handlePasswordAuth = useCallback(async () => {
    if (loading) return;

    const safeEmail = sanitizeEmail(email);

    if (!safeEmail || safeEmail.length < 5 || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (!turnstile.token) {
      setError("Verify captcha first.");
      return;
    }

    setLoading("password");
    setError("");

    try {
      if (authMode === "login") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password,
          options: { captchaToken: turnstile.token },
        });

        if (authError || !data.session) throw authError || new Error("No session");
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: safeEmail,
          password,
          options: { captchaToken: turnstile.token },
        });

        if (authError || !data.user) throw authError || new Error("Unable to create account");
      }

      finishPasswordLogin();
    } catch {
      setError(authMode === "login" ? "Invalid email or password." : "Unable to create account.");
      turnstile.resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [authMode, email, finishPasswordLogin, loading, password, turnstile]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loading) return;

      setLoading(provider);
      setError("");

      try {
        const next = popup ? safeNextPath() : "/dashboard";
        const redirectTo = `${safeOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

        const { error: authError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: { prompt: "select_account" },
          },
        });

        if (authError) throw authError;
      } catch {
        setError("Unable to continue with provider.");
        setLoading(false);
      }
    },
    [loading, popup],
  );

  const toggleMode = useCallback(() => {
    setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
    setError("");
    turnstile.resetCaptcha();
  }, [turnstile]);

  return {
    authMode,
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    setError,
    handlePasswordAuth,
    handleOAuth,
    toggleMode,
    turnstile,
  };
}
