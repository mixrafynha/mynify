"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { fetcher } from "@/lib/fetcher";
import { supabase } from "@/lib/supabase";

type DashboardProduct = {
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

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
};

type Profile = {
  role: string;
  plan: string;
};

function extractProducts(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  const source = payload as Record<string, unknown>;

  if (Array.isArray(source.data)) return source.data;
  if (Array.isArray(source.products)) return source.products;

  return [];
}

function normalizeProducts(payload: unknown): DashboardProduct[] {
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

export function useDashboard() {
  const router = useRouter();

  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const lastActionRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (!authData?.user) {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
          return;
        }

        if (!mounted) return;

        setUser(authData.user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, plan")
          .eq("id", authData.user.id)
          .single();

        if (!mounted) return;

        setProfile(profileData ?? null);
      } catch (error) {
        console.error("Failed to load dashboard user:", error);

        if (mounted) {
          setUser(null);
          setProfile(null);
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

  const role = profile?.role ?? "user";
  const plan = profile?.plan ?? "free";

  const isAdmin = role === "admin";
  const canSell = plan !== "free";

  const {
    data: productsResponse,
    isLoading,
    error: productsError,
  } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const products = useMemo(
    () => normalizeProducts(productsResponse),
    [productsResponse]
  );

  const { data: notificationsResponse } = useSWR(
    "/api/notifications",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const notifications = useMemo<Notification[]>(() => {
    const rawNotifications =
      notificationsResponse &&
      typeof notificationsResponse === "object" &&
      Array.isArray(
        (notificationsResponse as Record<string, unknown>).data
      )
        ? ((notificationsResponse as Record<string, unknown>)
            .data as Notification[])
        : Array.isArray(notificationsResponse)
          ? (notificationsResponse as Notification[])
          : [];

    return rawNotifications;
  }, [notificationsResponse]);

  const openCart = useCallback(() => {
    const now = Date.now();

    if (now - lastActionRef.current < 400) return;

    lastActionRef.current = now;
    setCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    const now = Date.now();

    if (now - lastActionRef.current < 300) return;

    lastActionRef.current = now;
    setCartOpen(false);
  }, []);

  const goAdvertise = useCallback(() => {
    const now = Date.now();

    if (now - lastActionRef.current < 500) return;

    lastActionRef.current = now;
    router.push("/advertise");
  }, [router]);

  return {
    cartOpen,
    setCartOpen,
    openCart,
    closeCart,
    goAdvertise,

    products,
    isLoading,
    productsError,

    notifications,

    canSell,
    isAdmin,
    role,
    plan,

    user,
    loadingUser,
  };
}