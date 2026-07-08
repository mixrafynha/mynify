export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceCents: number;
  currency: string;
  note: string;
  highlight: boolean;
  sortOrder?: number;
};

export type CheckoutSource = "editor" | "credits_page";

export type EmbeddedCheckoutResult = {
  clientSecret?: string;
  sessionId?: string;
  error?: string;
};

export type CreditsBalance = {
  credits: number;
  savedCount: number;
  savedLimit: number;
};
