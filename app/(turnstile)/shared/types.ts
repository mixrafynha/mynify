export type OAuthProvider = "google" | "apple";

export type AuthLoadingState = false | "email" | "google" | "apple" | "resend";

export type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (value: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove?: (widgetId: string) => void;
};

