export const rates = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
}

export const symbols = {
  GBP: "£",
  USD: "$",
  EUR: "€",
}

export type Currency = keyof typeof rates