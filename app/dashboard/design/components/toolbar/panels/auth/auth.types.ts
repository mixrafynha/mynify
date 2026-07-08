export type AuthFormMode = "login" | "signup";
export type AuthPopupVariant = "ai_credits" | "save_design";

export type AuthLoadingState = false | "password" | "google" | "apple";

export type AuthPopupCopy = {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  loginCta: string;
  authSignupTitle: string;
  authLoginTitle: string;
  authSignupDescription: string;
  authLoginDescription: string;
  formSignupHint: string;
  submitSignup: string;
  submitLogin: string;
};
