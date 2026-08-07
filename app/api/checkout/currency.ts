export function normalizeCheckoutCurrency(_value: unknown): "EUR" {
  return "EUR";
}

/**
 * Converts a EUR major-unit amount to euro cents.
 * The currency arguments are kept only for backwards-compatible call sites.
 * No FX or currency conversion is performed anywhere in checkout.
 */
export function convertMoneyToCents(
  amount: number,
  _fromCurrency?: string,
  _toCurrency?: string,
): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid EUR amount");
  }

  const cents = Math.round((amount + Number.EPSILON) * 100);

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error("Invalid EUR amount in cents");
  }

  return cents;
}
