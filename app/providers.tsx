"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppWrapper>{children}</AppWrapper>;
}

function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: auth, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
          setRole("guest"); // ✅ evita travar
          return;
        }

        if (!auth?.user) {
          setRole("guest"); // ✅ 🔥 FIX PRINCIPAL (anonimo)
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", auth.user.id)
          .maybeSingle(); // ✅ evita crash

        if (profileError) {
          console.error("Profile error:", profileError);
          setRole("user"); // fallback seguro
          return;
        }

        setRole(profile?.role ?? "user");
      } catch (err) {
        console.error("Unexpected error:", err);
        setRole("guest"); // fallback total
      } finally {
        setMounted(true); // ✅ sempre libera render
      }
    };

    getUserRole();
  }, []);

  /* ================= ROUTES ================= */
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup");

  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboard = pathname?.startsWith("/dashboard");

  /* ================= LAYOUT RULES ================= */
  const hideGlobalLayout =
    isAuthPage || isAdminPage || isDashboard;

  /* 🔥 mantém tua lógica intacta */
  const isReady = mounted && role !== null;

  if (!isReady) {
    return <div className="w-full h-screen bg-white" />;
  }

  return (
    <>
      {!hideGlobalLayout && <Navbar />}

      <div className="w-full min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        {!hideGlobalLayout && <Footer />}
      </div>
    </>
  );
}