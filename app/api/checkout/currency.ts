const SUPPORTED_CURRENCIES = new Set(["EUR", "USD", "GBP", "CAD"]);

type Rates = Record<string, number>;

export function normalizeCheckoutCurrency(value: unknown): string {
  const currency = typeof value === "string" ? value.trim().toUpperCase() : "EUR";
  return SUPPORTED_CURRENCIES.has(currency) ? currency : "EUR";
}

function getServerRates(): Rates {
  const raw = process.env.FX_RATES_JSON;

  if (!raw) {
    return { EUR: 1 };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rates: Rates = { EUR: 1 };

    for (const [currency, value] of Object.entries(parsed)) {
      const normalized = currency.toUpperCase();
      const rate = Number(value);

      if (SUPPORTED_CURRENCIES.has(normalized) && Number.isFinite(rate) && rate > 0) {
        rates[normalized] = rate;
      }
    }

    return rates;
  } catch {
    throw new Error("FX_RATES_JSON is invalid JSON");
  }
}

/**
 * FX_RATES_JSON stores the value of one EUR in each currency.
 * Example: {"EUR":1,"USD":1.16,"GBP":0.87,"CAD":1.59}
 */
export function convertMoneyToCents(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount for currency conversion");
  }

  const from = normalizeCheckoutCurrency(fromCurrency);
  const to = normalizeCheckoutCurrency(toCurrency);

  if (from === to) {
    return Math.round((amount + Number.EPSILON) * 100);
  }

  const rates = getServerRates();
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    throw new Error(`Missing trusted FX rate for ${from} -> ${to}`);
  }

  const amountInEur = amount / fromRate;
  const converted = amountInEur * toRate;
  const cents = Math.round((converted + Number.EPSILON) * 100);

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error("Converted amount is invalid");
  }

  return cents;
}
