export type SignupLoadingState = false | "email" | "google" | "apple" | "resend";

export type SignupResultCode =
  | "created"
  | "account_exists"
  | "invalid_request"
  | "rate_limited"
  | "unavailable"
  | "failed";

export type SignupResponse = {
  message?: string;
  code?: SignupResultCode;
};
