export type Product = {
  id: string;
  title?: string;
  image?: string;
  images?: string[];
  price?: number | string;
  discount_price?: number | string | null;
  category?: string;
  color?: string;
  size?: string;
  sku?: string;
  is_new?: boolean;
  is_hot?: boolean;
  is_featured?: boolean;
  sales_count?: number | string;
  audience?: "woman" | "man" | "unisex";
};

export type Currency = "USD" | "EUR" | "GBP";
