"use client";

import { memo, useEffect, useRef } from "react";
import type { TurnstileApi } from "./types";

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileWindow = Window & {
  turnstile?: TurnstileApi;
  __ryfioTurnstileLoading?: Promise<void>;
};

function getTurnstile(): TurnstileApi | null {
  if (typeof window === "undefined") return null;
  return (window as TurnstileWindow).turnstile ?? null;
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const currentWindow = window as TurnstileWindow;

  if (currentWindow.turnstile) return Promise.resolve();
  if (currentWindow.__ryfioTurnstileLoading) return currentWindow.__ryfioTurnstileLoading;

  currentWindow.__ryfioTurnstileLoading = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Turnstile script failed.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed."));
    document.head.appendChild(script);
  }).finally(() => {
    delete currentWindow.__ryfioTurnstileLoading;
  });

  return currentWindow.__ryfioTurnstileLoading;
}

type TurnstileProps = {
  disabled?: boolean;
  resetKey?: number;
  onTokenChange: (token: string) => void;
  onError: (message: string) => void;
  className?: string;
};

function Turnstile({
  disabled = false,
  resetKey = 0,
  onTokenChange,
  onError,
  className = "flex min-h-[65px] justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2",
}: TurnstileProps) {
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onErrorRef.current = onError;
  }, [onError, onTokenChange]);

  useEffect(() => {
    mountedRef.current = true;

    if (disabled) return;

    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!sitekey) {
      onErrorRef.current("Captcha is not configured.");
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !mountedRef.current || !captchaRef.current || widgetIdRef.current) return;

        const turnstile = getTurnstile();
        if (!turnstile) {
          onErrorRef.current("Captcha failed to load. Refresh and try again.");
          return;
        }

        widgetIdRef.current = turnstile.render(captchaRef.current, {
          sitekey,
          callback: (value: string) => {
            onTokenChangeRef.current(value);
          },
          "expired-callback": () => {
            onTokenChangeRef.current("");
          },
          "error-callback": () => {
            onTokenChangeRef.current("");
            onErrorRef.current("Captcha failed. Try again.");
          },
        });
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current("Captcha failed to load. Check your connection.");
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;

      const turnstile = getTurnstile();
      if (turnstile && widgetIdRef.current) {
        if (typeof turnstile.remove === "function") {
          turnstile.remove(widgetIdRef.current);
        } else {
          turnstile.reset(widgetIdRef.current);
        }
      }

      widgetIdRef.current = null;
      onTokenChangeRef.current("");
    };
  }, [disabled]);

  useEffect(() => {
    const turnstile = getTurnstile();
    if (!turnstile || !widgetIdRef.current) return;

    turnstile.reset(widgetIdRef.current);
    onTokenChangeRef.current("");
  }, [resetKey]);

  return (
    <div className={className}>
      <div ref={captchaRef} />
    </div>
  );
}

export default memo(Turnstile);
