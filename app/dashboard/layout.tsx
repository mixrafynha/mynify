import type { ReactNode } from "react";

import Sidebar from "@/app/components/Sidebar";

/* BUTTONS */
import NotificationBell from "@/app/components/NotificationBell";
import CreateButton from "@/app/components/CreateButton";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <Sidebar />

      <main
        className="
          relative z-10 min-h-screen
          transition-all duration-300
          md:ml-[var(--user-sidebar-width,270px)]
        "
      >
        {/* TOP ACTIONS */}
        <div className="sticky top-0 z-30 flex justify-end gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <NotificationBell />
          <CreateButton />
        </div>

        {/* PAGE */}
        <div className="px-4 pb-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
