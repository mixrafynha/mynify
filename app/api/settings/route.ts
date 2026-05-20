import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

type SettingsBody = {
  name?: string;
  username?: string;
  type?: "email" | "password";
  newEmail?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const EMAIL_COOLDOWN_DAYS = 30;

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

const isStrongPassword = (password: string) =>
  password.length >= 12 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

function canChangeEmail(lastDate: string | null) {
  if (!lastDate) return true;

  const last = new Date(lastDate).getTime();
  const cooldown = EMAIL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  return Date.now() - last >= cooldown;
}

async function getAuthUser() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

export async function GET() {
  try {
    const { supabase, user, error: userError } = await getAuthUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, name, username, role, email_change_requested_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      email: user.email ?? "",
      role: profile?.role ?? "user",
      email_change_requested_at: profile?.email_change_requested_at ?? null,
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
      .replace(/[^a-z0-9_.-]/g, "");

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

export async function PATCH(req: Request) {
  try {
    const { supabase, user, error: userError } = await getAuthUser();

    if (userError || !user || !user.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SettingsBody;

    if (body.type === "email") {
      const newEmail = cleanEmail(body.newEmail);

      if (!newEmail || !isEmail(newEmail)) {
        return Response.json({ error: "Invalid email" }, { status: 400 });
      }

      if (newEmail === user.email.toLowerCase()) {
        return Response.json(
          { error: "New email is the same as current email" },
          { status: 400 }
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email_change_requested_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        return Response.json({ error: profileError.message }, { status: 500 });
      }

      if (!canChangeEmail(profile?.email_change_requested_at ?? null)) {
        return Response.json(
          { error: "Só podes pedir alteração de email uma vez por mês." },
          { status: 429 }
        );
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

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email_change_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return Response.json({
        success: true,
        message: "Email de confirmação enviado.",
        data,
      });
    }

    if (body.type === "password") {
      const currentPassword =
        typeof body.currentPassword === "string" ? body.currentPassword : "";
      const newPassword =
        typeof body.newPassword === "string" ? body.newPassword : "";
      const confirmPassword =
        typeof body.confirmPassword === "string" ? body.confirmPassword : "";

      if (!currentPassword || !newPassword || !confirmPassword) {
        return Response.json(
          { error: "Preenche todos os campos." },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return Response.json(
          { error: "As novas passwords não coincidem." },
          { status: 400 }
        );
      }

      if (!isStrongPassword(newPassword)) {
        return Response.json(
          {
            error:
              "A password deve ter 12 caracteres, maiúscula, minúscula, número e símbolo.",
          },
          { status: 400 }
        );
      }

      const verifyClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: verifyError } = await verifyClient.auth.signInWithPassword(
        {
          email: user.email,
          password: currentPassword,
        }
      );

      if (verifyError) {
        return Response.json(
          { error: "Password atual incorreta." },
          { status: 403 }
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
