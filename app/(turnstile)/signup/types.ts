export type SignupLoadingState = false | "email" | "google" | "apple" | "resend";

export type SignupResultCode =
  | "created"
  | "account_exists"
  | "invalid_request"
  | "captcha_failed"
  | "rate_limited"
  | "server_config"
  | "signup_failed"
  | "server_error"
  | "failed";

export type SignupResponse = {
  ok?: boolean;
  code?: SignupResultCode;
  error?: SignupResultCode | string;
  message?: string;
  userId?: string | null;
};
