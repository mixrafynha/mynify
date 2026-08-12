export const rates = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.85,
};

export const symbols = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export type Currency = keyof typeof rates;

export const convertPrice = (price: number, currency: Currency) => {
  const basePrice = Number.isFinite(price) ? price : 0;
  const rate = rates[currency] || 1;

  return currency === "EUR"
    ? basePrice.toFixed(2)
    : (basePrice * rate).toFixed(2);
};
