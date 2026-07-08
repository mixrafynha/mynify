import type { AuthPopupCopy, AuthPopupVariant } from "./auth.types";

export const AUTH_COPY: Record<AuthPopupVariant, AuthPopupCopy> = {
  ai_credits: {
    badge: "AI credits",
    title: "Create your account",
    subtitle: "Receive 3 free AI credits.",
    primaryCta: "Create account",
    loginCta: "Already have an account? Login",
    authSignupTitle: "Create your account",
    authLoginTitle: "Login",
    authSignupDescription: "Receive 3 free AI credits.",
    authLoginDescription: "Login to continue generating print-ready AI designs.",
    formSignupHint: "Receive 3 free AI credits.",
    submitSignup: "Create account",
    submitLogin: "Sign in",
  },
  save_design: {
    badge: "Save design",
    title: "Save your design",
    subtitle: "Create an account to save and access your designs anywhere.",
    primaryCta: "Create account",
    loginCta: "Already have an account? Login",
    authSignupTitle: "Save your design",
    authLoginTitle: "Login to save",
    authSignupDescription: "Create an account to save and access your designs anywhere.",
    authLoginDescription: "Login to save and access your designs anywhere.",
    formSignupHint: "Create an account to save and access your designs anywhere.",
    submitSignup: "Create account",
    submitLogin: "Login and save",
  },
};

export function getAuthCopy(variant: AuthPopupVariant) {
  return AUTH_COPY[variant] || AUTH_COPY.ai_credits;
}
