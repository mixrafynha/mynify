"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetcher } from "@/lib/fetcher";

type DashboardProduct = {
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

function normalizeProducts(value: unknown): DashboardProduct[] {
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

export function useDashboard() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const lastActionRef = useRef(0);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();

        if (!auth?.user) {
          if (mounted) setLoadingUser(false);
          return;
        }

        if (!mounted) return;
        setUser(auth.user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, plan")
          .eq("id", auth.user.id)
          .single();

        if (!mounted) return;
        setProfile(profileData ?? null);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const role = profile?.role ?? "user";
  const plan = profile?.plan ?? "free";

  const isAdmin = role === "admin";
  const canSell = plan !== "free";

  const { data, isLoading } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const products = useMemo(
    () => normalizeProducts(data?.data),
    [data?.data]
  );

  const { data: notifData } = useSWR("/api/notifications", fetcher, {
    dedupingInterval: 60000,
  });

  const notifications: Notification[] = useMemo(() => {
    if (!Array.isArray(notifData?.data)) return [];
    return notifData.data;
  }, [notifData?.data]);

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
    notifications,
    canSell,
    isAdmin,
    role,
    plan,
    user,
    loadingUser,
  };
}
