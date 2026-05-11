"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string | null;
  role: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type ProfileRow = {
  role: string | null;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const loadUser = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (requestId !== requestIdRef.current) return;

      if (authError || !authUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name, username, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle<ProfileRow>();

      if (requestId !== requestIdRef.current) return;

      setUser({
        id: authUser.id,
        email: authUser.email ?? null,
        role: profile?.role ?? "user",
        name: profile?.name ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      });
    } catch {
      if (requestId === requestIdRef.current) {
        setUser(null);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      requestIdRef.current++;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      loadUser();
    });

    return () => {
      requestIdRef.current++;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  return { user, loading };
}
