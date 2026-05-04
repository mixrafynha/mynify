import { createSupabaseServer } from "@/lib/supabase-server";

/* ================= GET ================= */
export async function GET() {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 profile com role (IMPORTANTE PARA ADMIN UI)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, username, role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("GET PROFILE ERROR:", error);

      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      email: user.email ?? "",
      role: profile?.role ?? "user", // 🔥 CRÍTICO PARA SIDEBAR ADMIN
      profile: profile ?? {
        name: "",
        username: "",
        role: "user",
      },
    });
  } catch (err: any) {
    console.error("GET CRASH:", err);

    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

/* ================= PUT ================= */
export async function PUT(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name && !body.username) {
      return Response.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    // 🔐 update seguro (self-only)
    const { error } = await supabase
      .from("profiles")
      .update({
        name: body.name ?? "",
        username: body.username ?? "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("PUT PROFILE ERROR:", error);

      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("PUT CRASH:", err);

    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

/* ================= PATCH ================= */
export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    /* ================= EMAIL ================= */
    if (body.type === "email") {
      if (!body.newEmail) {
        return Response.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.updateUser({
        email: body.newEmail,
      });

      if (error) {
        console.error("EMAIL ERROR:", error);

        return Response.json(
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      return Response.json({ success: true, data });
    }

    /* ================= PASSWORD ================= */
    if (body.type === "password") {
      if (!body.newPassword || body.newPassword.length < 6) {
        return Response.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.auth.updateUser({
        password: body.newPassword,
      });

      if (error) {
        console.error("PASSWORD ERROR:", error);

        return Response.json(
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      return Response.json({ success: true, data });
    }

    return Response.json(
      { error: "Invalid type" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("PATCH CRASH:", err);

    return Response.json(
      { error: "Server crash", details: err.message },
      { status: 500 }
    );
  }
}