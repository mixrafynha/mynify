import { createSupabaseServer } from "@/lib/supabase-server";

type SettingsBody = {
  name?: string;
  username?: string;
  type?: "email" | "password";
  newEmail?: string;
  newPassword?: string;
};

const cleanText = (value: unknown, max = 80) =>
  typeof value === "string"
    ? value.replace(/[<>]/g, "").trim().slice(0, max)
    : "";

const cleanEmail = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().slice(0, 160)
    : "";

const isEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function getAuthUser() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

/* ================= GET ================= */
export async function GET() {
  try {
    const { supabase, user, error: userError } = await getAuthUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, name, username, role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      email: user.email ?? profile?.email ?? "",
      role: profile?.role ?? "user",
      profile: {
        name: profile?.name ?? "",
        username: profile?.username ?? "",
        role: profile?.role ?? "user",
      },
    });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err?.message },
      { status: 500 }
    );
  }
}

/* ================= PUT PROFILE ================= */
export async function PUT(req: Request) {
  try {
    const { supabase, user, error: userError } = await getAuthUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SettingsBody;

    const name = cleanText(body.name, 80);
    const username = cleanText(body.username, 40)
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (!name && !username) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name,
          username,
          role: existing?.role ?? "user",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("name, username, role")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      profile: data,
    });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err?.message },
      { status: 500 }
    );
  }
}

/* ================= PATCH EMAIL / PASSWORD ================= */
export async function PATCH(req: Request) {
  try {
    const { supabase, user, error: userError } = await getAuthUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SettingsBody;

    if (body.type === "email") {
      const newEmail = cleanEmail(body.newEmail);

      if (!newEmail || !isEmail(newEmail)) {
        return Response.json({ error: "Invalid email" }, { status: 400 });
      }

      const { data, error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        return Response.json(
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: newEmail,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      return Response.json({
        success: true,
        email: newEmail,
        data,
      });
    }

    if (body.type === "password") {
      const newPassword =
        typeof body.newPassword === "string" ? body.newPassword : "";

      if (newPassword.length < 6) {
        return Response.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return Response.json(
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        data,
      });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    return Response.json(
      { error: "Server crash", details: err?.message },
      { status: 500 }
    );
  }
}
