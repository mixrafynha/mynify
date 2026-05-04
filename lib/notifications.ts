import { supabaseAdmin } from "./supabase-admin";

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationInput) {
  try {
    if (!userId || !type || !title || !message) {
      throw new Error("Missing required fields");
    }

    const { data: notification, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data ?? null,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CREATE_NOTIFICATION_ERROR]", error);
      return null;
    }

    return notification;
  } catch (err) {
    console.error("[CREATE_NOTIFICATION_EXCEPTION]", err);
    return null;
  }
}