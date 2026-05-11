"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  user: {
    email?: string | null;
    profile?: {
      username?: string | null;
      avatar_url?: string | null;
    } | null;
  } | null;
  expanded: boolean;
};

export default function SidebarFooter({ user, expanded }: Props) {
  const router = useRouter();

  const username =
    user?.profile?.username?.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const email = user?.email || "";
  const avatarUrl = user?.profile?.avatar_url || "";
  const initial = username.charAt(0).toUpperCase();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="mt-auto space-y-3 px-3 pb-4">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 transition-colors hover:bg-white/[0.07]">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-black">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              fill
              sizes="36px"
              className="object-cover"
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
                {email}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Sign out"
        className="
          group flex w-full items-center gap-3 rounded-2xl
          px-3.5 py-2.5 text-sm font-semibold text-red-300
          transition-colors hover:bg-red-500/10 hover:text-red-200
          active:scale-[0.98]
        "
      >
        <LogOut
          size={17}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
        />

        {expanded && <span>Sign out</span>}
      </button>
    </div>
  );
}
