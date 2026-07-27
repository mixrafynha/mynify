"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  user: any;
  expanded: boolean;
};

export default function SidebarFooter({ user, expanded }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const profile = user?.profile ?? {};
  const username =
    profile?.name ||
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    profile?.avatar ||
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    "";

  const email = user?.email ?? "";
  const maskedEmail = email ? `${email.charAt(0)}•••••` : "";
  const initial = username.charAt(0).toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;

    const confirmed = window.confirm("Queres mesmo sair da tua conta?");
    if (!confirmed) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace("/login");
      router.refresh();
    } catch {
      alert("Não foi possível terminar a sessão agora.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="mt-auto space-y-3 px-3 pb-4">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 transition-colors hover:bg-white/[0.07]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-black">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        {expanded && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white/90">
              {username}
            </p>

            {email && (
              <p className="truncate text-[11px] text-white/40">
                {maskedEmail}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Sign out"
        disabled={loggingOut}
        className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut
          size={17}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
        />

        {expanded && <span>{loggingOut ? "Signing out..." : "Sign out"}</span>}
      </button>
    </div>
  );
}
