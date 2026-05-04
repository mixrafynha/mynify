"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name, username, avatar_url")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!mounted) return;

      setUser({
        id: authData.user.id,
        email: authData.user.email,

        // 🔥 FLAT STRUCTURE (IMPORTANTE PARA SAAS)
        role: profile?.role ?? "user",
        name: profile?.name ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      });

      setLoading(false);
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setLoading(false);
        } else {
          loadUser();
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}