"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  user_id: string;
};

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔐 LOAD
  const load = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setNotifications(data || []);

    setLoading(false);
  }, [userId]);

  // 🔥 REALTIME (seguro + filtrado por user)
  useEffect(() => {
    if (!userId) return;

    load();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  // ✅ mark as read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);
  };

  // 🧹 clear all (soft delete seguro)
  const clearAll = async () => {
    setNotifications([]);

    await supabase
      .from("notifications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    clearAll,
    refresh: load,
  };
}