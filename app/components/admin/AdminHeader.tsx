"use client";

import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

type AdminHeaderProps = {
  notifications?: any[];
  title?: string;
};

export default function AdminHeader({
  notifications = [],
  title = "Admin Dashboard",
}: AdminHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center justify-between
      px-4 sm:px-6
      bg-[#0b0f17]/70 backdrop-blur-xl
      border-b border-white/10"
    >
      <div className="flex flex-col leading-tight">
        <h1 className="text-sm font-semibold text-white/90">{title} </h1>

        <p className="text-[11px] text-white/40 hidden sm:block">
          Manage your products, users and analytics
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <span className="hidden sm:block">Notifications</span>

          <div className="bg-white/10 px-2 py-1 rounded-full text-xs">
            {notifications.length}
          </div>
        </div>

        <div className="hover:scale-105 transition">
          <NotificationBell notifications={notifications} />
        </div>

        <div className="hover:scale-105 transition">
          <SmartCreateButton />
        </div>
      </div>
    </header>
  );
}
