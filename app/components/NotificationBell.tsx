"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  message: string;
  read?: boolean;
  created_at?: string;
};

type NotificationBellProps = {
  notifications?: Notification[];
};

export default function NotificationBell({
  notifications = [],
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>(notifications);
  const [userId, setUserId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("notifications")
      .select("id,message,read,created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    setItems(data || notifications || []);
  }, [userId, notifications]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  const unread = useMemo(
    () => items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    [items]
  );

  async function markAsRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function clearAll() {
    if (clearing) return;

    setClearing(true);
    setItems([]);

    try {
      await fetch("/api/notifications/clear", {
        method: "POST",
      });
    } catch {
      load();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          relative
          w-9 h-9 md:w-11 md:h-11
          rounded-full
          bg-white
          shadow-sm
          flex items-center justify-center
          hover:scale-105 transition
        "
      >
        🔔

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 rounded-full animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40"
        />
      )}

      {open && (
        <div
          className="
            fixed sm:absolute
            right-2 sm:right-0
            top-14 sm:mt-2
            w-[92vw] max-w-[320px] sm:w-80
            bg-white
            border border-gray-100
            shadow-xl
            rounded-xl
            overflow-hidden
            z-50
          "
        >
          <div className="px-3 py-2 flex items-center justify-between border-b bg-gray-50">
            <p className="text-xs font-semibold text-gray-800">
              Notifications
            </p>

            <button
              onClick={clearAll}
              disabled={clearing || items.length === 0}
              className="text-[10px] text-red-500 disabled:opacity-40"
            >
              {clearing ? "..." : "clear"}
            </button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-2xl mb-1">🔕</div>
                <p className="text-xs text-gray-500">No notifications</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="
                    flex gap-2 px-3 py-2
                    border-b last:border-none
                    hover:bg-gray-50
                    transition
                  "
                >
                  <div className="mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        n.read ? "bg-gray-300" : "bg-blue-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-gray-800 leading-snug">
                      {n.message}
                    </p>

                    <p className="text-[9px] text-gray-400">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleTimeString()
                        : ""}
                    </p>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-[10px] text-blue-500"
                    >
                      ok
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-1 border-t bg-gray-50 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] text-gray-500"
              >
                close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}