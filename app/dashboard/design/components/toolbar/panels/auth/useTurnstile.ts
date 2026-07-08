"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileWindow = Window & {
  turnstile?: {
    render?: (el: HTMLElement, options: Record<string, unknown>) => string;
    reset?: (id: string) => void;
    remove?: (id: string) => void;
  };
};

export function useTurnstile() {
  const [token, setToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderingRef = useRef(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const resetCaptcha = useCallback(() => {
    const turnstile = typeof window !== "undefined" ? (window as TurnstileWindow).turnstile : null;

    if (turnstile?.reset && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
    setCaptchaReady(false);
  }, []);

  const renderCaptcha = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!sitekey || !captchaRef.current || widgetIdRef.current || renderingRef.current) return;

    const turnstile = (window as TurnstileWindow).turnstile;
    if (!turnstile?.render) return;

    try {
      renderingRef.current = true;
      setCaptchaError("");

      widgetIdRef.current = turnstile.render(captchaRef.current, {
        sitekey,
        callback: (value: string) => {
          setToken(value);
          setCaptchaReady(true);
          setCaptchaError("");
        },
        "expired-callback": () => {
          setToken("");
          setCaptchaReady(false);
        },
        "error-callback": () => {
          setToken("");
          setCaptchaReady(false);
          setCaptchaError("Captcha error. Try again.");
        },
      });
    } catch {
      setCaptchaError("Captcha unavailable. Refresh and try again.");
    } finally {
      renderingRef.current = false;
    }
  }, [sitekey]);

  useEffect(() => {
    if (!sitekey) {
      setCaptchaError("Missing captcha site key.");
      return;
    }

    renderCaptcha();
    const timer = window.setTimeout(renderCaptcha, 450);
    return () => window.clearTimeout(timer);
  }, [renderCaptcha, sitekey]);

  useEffect(() => {
    return () => {
      const turnstile = typeof window !== "undefined" ? (window as TurnstileWindow).turnstile : null;
      if (turnstile?.remove && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {}
      }
      widgetIdRef.current = null;
    };
  }, []);

  return {
    sitekey,
    token,
    captchaReady,
    captchaError,
    captchaRef,
    renderCaptcha,
    resetCaptcha,
  };
}
