"use client";

import { useEffect, useState } from "react";
import { formatProduct } from "@/lib/formatProduct";
import type { Product, ProductAPI } from "@/types/product";

type ProductsResponse = {
  data?: ProductAPI[];
  error?: string;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);

        const res = await fetch("/api/products", {
          signal: controller.signal,
          next: {
            revalidate: 300,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const json: ProductsResponse = await res.json();

        const data = Array.isArray(json.data) ? json.data : [];

        const formatted = data.map(formatProduct);

        setProducts(formatted);
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        console.error("USE_PRODUCTS_ERROR:", err);

        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, []);

  return {
    products,
    loading,
  };
}
