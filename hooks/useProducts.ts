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
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const json: ProductsResponse = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];

        const formatted: Product[] = data.map((item) => {
          const raw = item as any;
          const base = formatProduct(item);

          return {
            ...base,
            is_new: Boolean(raw.is_new),
            is_hot: Boolean(raw.is_hot),
            is_featured: Boolean(raw.is_featured),
            sales_count: Number(raw.sales_count ?? 0),
            audience:
              raw.audience === "woman" ||
              raw.audience === "man" ||
              raw.audience === "unisex"
                ? raw.audience
                : "unisex",
            category: String(raw.category ?? ""),
          };
        });

        setProducts(formatted);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;

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
