"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";

type AdminProduct = {
  id: string;
  title?: string;
  price?: number | string | null;
  discount_price?: number | string | null;
  currency?: string | null;
  image?: string | null;
  images?: unknown[] | null;
  category?: string | null;
  audience?: string | null;
  is_new?: boolean | null;
  is_hot?: boolean | null;
  sales_count?: number | string | null;
  [key: string]: unknown;
};

function extractProducts(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  const source = payload as Record<string, unknown>;

  if (Array.isArray(source.data)) return source.data;
  if (Array.isArray(source.products)) return source.products;

  return [];
}

function normalizeProducts(payload: unknown): AdminProduct[] {
  return extractProducts(payload)
    .filter(
      (product): product is Record<string, unknown> =>
        Boolean(product) && typeof product === "object"
    )
    .map((product) => ({
      ...product,
      id: String(product.id ?? ""),
      title:
        typeof product.title === "string" && product.title.trim()
          ? product.title.trim()
          : "Untitled",
    }))
    .filter((product) => Boolean(product.id));
}

export function useAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const lastActionRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (mounted) setUser(null);
          return;
        }

        const data = await response.json();

        if (!mounted) return;

        setUser(data?.user ?? null);
      } catch (error) {
        console.error("Failed to load admin user:", error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = user?.profile?.role === "admin";
  const shouldFetchProducts = !loadingUser && isAdmin;

  const {
    data: productsResponse,
    isLoading,
    error: productsError,
    mutate,
  } = useSWR(
    shouldFetchProducts ? "/api/admin/products" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const products = useMemo(
    () => normalizeProducts(productsResponse),
    [productsResponse]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const now = Date.now();

      if (now - lastActionRef.current < 500) return;

      lastActionRef.current = now;

      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `Delete failed with status ${response.status}`
          );
        }

        await mutate();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    },
    [mutate]
  );

  const users: any[] = [];
  const revenue = 0;
  const notifications: any[] = [];

  return {
    user,
    isAdmin,
    loadingUser,

    products,
    isLoading,
    productsError,

    deleteProduct,

    users,
    revenue,
    notifications,
  };
}