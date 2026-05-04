"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const lastActionRef = useRef(0);

  /* =========================
     LOAD USER
  ========================= */
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        const data = await res.json();

        if (!mounted) return;

        setUser(data?.user ?? null);
      } catch (err) {
        console.error("Failed to load user:", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     ADMIN CHECK
  ========================= */
  const isAdmin = user?.profile?.role === "admin";

  /* =========================
     PRODUCTS
  ========================= */
  const shouldFetchProducts = !loadingUser && isAdmin;

  const { data, isLoading } = useSWR(
    shouldFetchProducts ? "/api/admin/products" : null,
    fetcher
  );

  const products = Array.isArray(data?.data) ? data.data : [];

  /* =========================
     DELETE PRODUCT
  ========================= */
  const deleteProduct = useCallback(async (id: string) => {
    const now = Date.now();
    if (now - lastActionRef.current < 500) return;
    lastActionRef.current = now;

    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  /* =========================
     MOCK DATA (TEMP)
  ========================= */
  const users: any[] = [];
  const revenue: number = 0;
  const notifications: any[] = [];

  /* =========================
     RETURN
  ========================= */
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