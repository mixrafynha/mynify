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
    setMounted(true);

    const getUserRole = async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      setRole(profile?.role ?? "user");
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

  /* 🔥 FIX REAL: evita render errado antes do role */
  const isReady = mounted && role !== null;

  if (!isReady) {
    return <div className="w-full h-screen bg-white" />;
  }

  return (
    <>
      {/* NAVBAR only for public pages */}
      {!hideGlobalLayout && <Navbar />}

      <div className="w-full min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>

        {!hideGlobalLayout && <Footer />}
      </div>
    </>
  );
}