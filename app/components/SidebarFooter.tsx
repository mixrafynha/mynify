"use client";

import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  user: any;
  expanded: boolean;
};

export default function SidebarFooter({ user, expanded }: Props) {
  const router = useRouter();

  const username =
    user?.profile?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = username?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh(); // 🔥 evita cache de sessão
  };

  return (
    <div className="mt-auto px-3 pb-5 space-y-4">
      
      {/* separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* user card */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200">

        {/* avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-white to-gray-200 flex items-center justify-center text-black text-sm font-semibold shadow-sm">

          {user?.profile?.avatar_url ? (
            <img
              src={user.profile.avatar_url}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          ) : (
            <span>{initial}</span>
          )}

        </div>

        {/* info */}
        {expanded && (
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-medium text-white/90 truncate">
              {username}
            </p>
            <p className="text-xs text-white/40 truncate">
              {user?.email}
            </p>
          </div>
        )}
      </div>

      {/* logout */}
      <button
        onClick={handleLogout}
        className="
          w-full flex items-center gap-3 px-4 py-3 
          rounded-2xl 
          text-red-300 
          bg-red-500/0 
          hover:bg-red-500/10 
          hover:text-red-200
          transition-all duration-200
          group
        "
      >
        <LogOut
          size={18}
          className="group-hover:translate-x-0.5 transition-transform"
        />

        {expanded && (
          <span className="text-sm font-medium">
            Sign out
          </span>
        )}
      </button>
    </div>
  );
}