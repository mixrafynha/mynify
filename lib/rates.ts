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
