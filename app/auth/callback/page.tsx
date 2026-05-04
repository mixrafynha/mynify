"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        /* =========================
           1. WAIT FOR SESSION (CRITICAL)
        ========================= */
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        const user = session?.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        /* =========================
           2. PROFILE SAFE FETCH
        ========================= */
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role ?? "user";

        /* =========================
           3. REDIRECT (SAAS SAFE)
        ========================= */
        if (role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }

      } catch (err) {
        console.error("Callback error:", err);
        router.replace("/login");
      }
    };

    run();
  }, [router]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}