"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetcher } from "@/lib/fetcher";

type ProductProps = {
  id: string;
  title: string;
  price: string;
  image: string;
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

export function useDashboard() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const lastActionRef = useRef(0);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* 🔐 GET USER + PROFILE (IMPORTANTE) */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        setLoadingUser(false);
        return;
      }

      if (!mounted) return;

      setUser(auth.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, plan")
        .eq("id", auth.user.id)
        .single();

      if (!mounted) return;

      setProfile(profile ?? null);
      setLoadingUser(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* 🔐 ROLE + PLAN REAL */
  const role = profile?.role ?? "user";
  const plan = profile?.plan ?? "free";

  const isAdmin = role === "admin";
  const canSell = plan !== "free";

  /* 📦 PRODUCTS */
  const { data, isLoading } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const products: ProductProps[] = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((p: any) => {
      const baseImage =
        typeof p.image === "string" ? p.image.split("?")[0] : "";

      return {
        id: String(p.id ?? ""),
        title: String(p.title ?? "Untitled"),
        price: `${p.currency || "$"} ${p.price ?? "0"}`,
        image: `${encodeURI(baseImage)}?v=${p.updated_at || Date.now()}`,
      };
    });
  }, [data]);

  /* 🔔 NOTIFICATIONS */
  const { data: notifData } = useSWR("/api/notifications", fetcher, {
    dedupingInterval: 60000,
  });

  const notifications: Notification[] = useMemo(() => {
    if (!notifData?.data || !Array.isArray(notifData.data)) return [];
    return notifData.data;
  }, [notifData]);

  /* 🛒 CART SAFE ACTIONS */
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
    isAdmin,        // 🔥 ADICIONADO
    role,           // 🔥 ADICIONADO
    plan,           // 🔥 ADICIONADO

    loadingUser,
  };
}