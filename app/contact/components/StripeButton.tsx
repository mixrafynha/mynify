"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock } from "lucide-react";

export default function StripeButton({ product }: any) {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleCheckout = async () => {
    if (loading) return;

    if (!product?.id) {
      alert("Produto inválido");
      return;
    }

    setLoading(true);

    try {
      // ✅ Supabase session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        alert("Erro de autenticação");
        return;
      }

      const session = data.session;
      const user = session?.user;
      const token = session?.access_token;

      if (!user || !token) {
        alert("Precisas de login para continuar");
        return;
      }

      // 🧠 cancel previous request
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      // 🚀 checkout API
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id }),
        signal: controller.signal,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Checkout error:", json);
        alert(json?.error || "Erro no checkout");
        return;
      }

      // 💳 redirect Stripe
      if (json?.url) {
        window.location.href = json.url;
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error(err);
        alert("Erro de rede");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mt-5">

      {/* MAIN BUTTON */}
     <button
  onClick={handleCheckout}
  disabled={loading}
  className="
    w-full
    bg-gradient-to-r from-black via-gray-900 to-black
    text-white
    py-4
    rounded-2xl
    font-semibold
    text-base
    flex items-center justify-center gap-2
    shadow-lg
    hover:shadow-2xl
    hover:scale-[1.02]
    active:scale-[0.98]
    transition-all
    disabled:opacity-40
    disabled:cursor-not-allowed
  "
>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      💳 Pay Now Securely
    </>
  )}
</button>

      {/* TRUST MICRO TEXT */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5" />
        Secure checkout powered by Stripe
      </div>

    </div>
  );
}