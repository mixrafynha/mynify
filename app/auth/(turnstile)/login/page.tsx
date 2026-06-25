"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;
    let redirected = false;

    const safeRedirect = () => {
      if (redirected) return;
      redirected = true;
      router.replace("/dashboard");
    };

    supabase.auth.getSession().then(({ data }) => {
      if (ignore) return;
      if (data?.session?.user) {
        safeRedirect();
      } else {
        setChecking(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;
      if (session?.user) safeRedirect();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) return null;

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#03030a] text-white">
      <div className="grid min-h-[100dvh] md:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#03030a] text-white md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

          <Image
            src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=72"
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 0vw"
            className="object-cover opacity-35"
            aria-hidden="true"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.85)_45%,rgba(3,3,10,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_45%)]" />

          <div className="relative z-10 flex w-full flex-col justify-center p-12">
            <div className="max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <Image
                  src="/favicon.ico"
                  alt="Ryfio"
                  width={49}
                  height={49}
                  priority
                  className="h-[49px] w-[49px] shrink-0 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.45)] ring-1 ring-white/10"
                />
                <span className="text-xl font-black tracking-tight">RYFIO</span>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
                <PackageCheck size={15} className="text-purple-400" />
                Welcome back creator
              </div>

              <h1 className="mb-5 text-5xl font-black uppercase leading-[0.9] tracking-tight lg:text-7xl">
                Welcome{" "}
                <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  back.
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-white/65">
                Log in to manage your store, orders, and grow your brand
                worldwide.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-[#03030a] px-4 py-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.16),transparent_28%)]" />
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
