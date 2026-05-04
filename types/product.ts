export type ProductAPI = {
  id: string;
  title: string;
  price?: number | null;
  image?: string | null;
  updated_at?: string | null;
  variants?: {
    price?: number | null;
  }[] | null;
};

export type Product = {
  id: string;
  title: string;
  price: number;
  image?: string | null;
};