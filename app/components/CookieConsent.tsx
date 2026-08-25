"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "ryfio-cookie-consent-v1";
export const COOKIE_SETTINGS_EVENT = "ryfio:open-cookie-settings";

type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 1;
};

function saveConsent(analytics: boolean, marketing: boolean) {
  const choice: ConsentChoice = {
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  window.dispatchEvent(
    new CustomEvent("ryfio:cookie-consent-changed", { detail: choice }),
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const openSettings = () => {
      setShowSettings(true);
      setVisible(true);
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      } else {
        const choice = JSON.parse(stored) as Partial<ConsentChoice>;
        if (choice.version !== 1) {
          setVisible(true);
        } else {
          setAnalytics(choice.analytics === true);
          setMarketing(choice.marketing === true);
        }
      }
    } catch {
      setVisible(true);
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const choose = useCallback((allowAnalytics: boolean, allowMarketing: boolean) => {
    saveConsent(allowAnalytics, allowMarketing);
    setVisible(false);
    setShowSettings(false);
  }, []);

  if (!visible) return null;

  return (
    <section
      aria-label="Cookie preferences"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-[470px] rounded-xl border border-white/10 bg-[#090914]/95 p-3 text-white shadow-[0_16px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-4"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
          <Cookie size={15} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-extrabold">Your privacy, your choice</h2>
              <p className="mt-0.5 text-[11px] leading-4 text-white/60">
                We use essential cookies to run Ryfio. With your permission, we
                may also use analytics and marketing cookies.{" "}
                <Link href="/cookies" className="font-semibold text-purple-300 hover:text-purple-200">
                  Cookie Policy
                </Link>
              </p>
            </div>

            {showSettings && (
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-1 text-white/45 transition hover:bg-white/5 hover:text-white"
                aria-label="Close cookie settings"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {showSettings && (
            <div className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5">
              <PreferenceRow label="Essential" description="Login, security and checkout" checked disabled />
              <PreferenceRow
                label="Analytics"
                description="Helps us improve Ryfio"
                checked={analytics}
                onChange={setAnalytics}
              />
              <PreferenceRow
                label="Marketing"
                description="Campaign measurement and relevant ads"
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {showSettings ? (
              <button
                type="button"
                onClick={() => choose(analytics, marketing)}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1.5 text-[11px] font-bold transition hover:brightness-110"
              >
                Save choices
              </button>
            ) : (
              <button
                type="button"
                onClick={() => choose(true, true)}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1.5 text-[11px] font-bold transition hover:brightness-110"
              >
                Accept all
              </button>
            )}

            <button
              type="button"
              onClick={() => choose(false, false)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white/85 transition hover:border-white/30 hover:bg-white/5"
            >
              Reject optional
            </button>

            {!showSettings && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-2 py-1.5 text-[11px] font-semibold text-white/55 transition hover:text-white"
              >
                Manage
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.035] px-2.5 py-1.5">
      <span>
        <span className="block text-[11px] font-bold text-white/90">{label}</span>
        <span className="block text-[10px] text-white/45">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-purple-500"
      />
    </label>
  );
}
