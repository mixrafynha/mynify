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
  images?: string[] | null;
  category?: string | null;
  [key: string]: unknown;
};

function normalizeProducts(value: unknown): AdminProduct[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (product): product is Record<string, unknown> =>
        Boolean(product) && typeof product === "object"
    )
    .map((product) => ({
      ...product,
      id: String(product.id ?? ""),
      title:
        typeof product.title === "string" && product.title.trim()
          ? product.title
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
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          if (mounted) setUser(null);
          return;
        }

        const data = await res.json();

        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (err) {
        console.error("Failed to load user:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = user?.profile?.role === "admin";
  const shouldFetchProducts = !loadingUser && isAdmin;

  const { data, isLoading, mutate } = useSWR(
    shouldFetchProducts ? "/api/admin/products" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const products = useMemo(
    () => normalizeProducts(data?.data),
    [data?.data]
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
          throw new Error(`Delete failed with status ${response.status}`);
        }

        await mutate();
      } catch (err) {
        console.error("Delete failed:", err);
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
    deleteProduct,
    users,
    revenue,
    notifications,
  };
}
