import type {
  CheckoutSource,
  CreditPack,
  CreditsBalance,
  EmbeddedCheckoutResult,
} from "./credits.types";

type ApiObject = Record<string, unknown>;
let creditsRequest: Promise<CreditsBalance | null> | null = null;
let creditPacksRequest: Promise<CreditPack[]> | null = null;

async function readJson(response: Response): Promise<ApiObject> {
  const data: unknown = await response.json().catch(() => ({}));
  return data && typeof data === "object" ? (data as ApiObject) : {};
}

export async function fetchCreditPacks(): Promise<CreditPack[]> {
  if (creditPacksRequest) return creditPacksRequest;

  creditPacksRequest = (async () => {
    const response = await fetch("/api/credit-packs", { cache: "no-store" });
    if (!response.ok) return [];

    const data = await readJson(response);
    return Array.isArray(data.packs) ? (data.packs as CreditPack[]) : [];
  })();

  try {
    return await creditPacksRequest;
  } finally {
    creditPacksRequest = null;
  }
}

export async function fetchAiCredits(): Promise<CreditsBalance | null> {
  if (creditsRequest) return creditsRequest;

  creditsRequest = (async () => {
    const response = await fetch("/api/ai-credits", { cache: "no-store" });
    if (response.status === 401 || !response.ok) return null;

    const data = await readJson(response);

    return {
      credits: Number(data.credits ?? 0),
      savedCount: Number(data.savedCount ?? 0),
      savedLimit: Number(data.savedLimit ?? 5),
    };
  })();

  try {
    return await creditsRequest;
  } finally {
    creditsRequest = null;
  }
}

export async function createAiCreditsEmbeddedCheckout(
  packId: string,
  source: CheckoutSource,
): Promise<{ response: Response; data: EmbeddedCheckoutResult }> {
  const response = await fetch("/api/stripe/create-ai-credits-embedded-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packId, source }),
  });

  return {
    response,
    data: (await readJson(response)) as EmbeddedCheckoutResult,
  };
}
