"use client";

import { useEffect, useState } from "react";
import type { AuthFormMode, AuthPopupVariant } from "./auth.types";
import AuthDesktopShell from "./desktop/AuthDesktopShell";
import AuthMobileShell from "./mobile/AuthMobileShell";
import AuthOfferStep from "./AuthOfferStep";
import AuthStep from "./AuthStep";

type Props = {
  open: boolean;
  variant?: AuthPopupVariant;
  defaultMode?: AuthFormMode;
  onClose: () => void;
  onSuccess?: () => void;
};

function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return isDesktop;
}

export default function AuthPopupController({
  open,
  variant = "ai_credits",
  defaultMode = "signup",
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<"offer" | "auth">("offer");
  const [mode, setMode] = useState<AuthFormMode>(defaultMode);
  const isDesktop = useDesktopViewport();

  useEffect(() => {
    if (!open) return;
    setStep("offer");
    setMode(defaultMode);
  }, [defaultMode, open, variant]);

  if (!open) return null;

  function closePopup() {
    setStep("offer");
    setMode(defaultMode);
    onClose();
  }

  function handleSuccess() {
    onSuccess?.();
    closePopup();
  }

  const content =
    step === "offer" ? (
      <AuthOfferStep
        variant={variant}
        onSignup={() => {
          setMode("signup");
          setStep("auth");
        }}
        onLogin={() => {
          setMode("login");
          setStep("auth");
        }}
      />
    ) : (
      <AuthStep mode={mode} variant={variant} onBack={() => setStep("offer")} onSuccess={handleSuccess} />
    );

  if (isDesktop) {
    return <AuthDesktopShell onClose={closePopup}>{content}</AuthDesktopShell>;
  }

  return <AuthMobileShell onClose={closePopup}>{content}</AuthMobileShell>;
}
