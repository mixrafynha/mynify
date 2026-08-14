import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";

const LIMITS = {
  name: 50,
  username: 24,
  bio: 220,
  url: 300,
  location: 60,
};

const MAX_BODY_BYTES = 8 * 1024;
const profileRateLimiter = getDurableRateLimiter({
  namespace: "profiles",
  limit: 10,
  window: "1 m",
});

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  return value.replace(/[<>]/g, "").trim().slice(0, max) || null;
}

function cleanUsername(value: unknown) {
  if (typeof value !== "string") return null;

  const username = value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, LIMITS.username);

  return username || null;
}

function cleanUrl(value: unknown) {
  if (typeof value !== "string") return null;

  const url = value.replace(/[<>"']/g, "").trim().slice(0, LIMITS.url);

  if (!url) return null;
  if (!url.startsWith("https://")) return null;

  return url;
}

function canChange(lastChangedAt: string | null) {
  if (!lastChangedAt) return true;

  const last = new Date(lastChangedAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return Date.now() - last >= sevenDays;
}

export async function GET() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  try {
    const rateLimitResult = await profileRateLimiter.limit(`${user.id}:${getTrustedRequestIp(req)}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Muitos pedidos. Tenta novamente daqui a pouco." },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("[profiles:rate-limit-error]", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  const body = JSON.parse(rawBody || "{}");

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      name,
      username,
      location,
      name_changed_at,
      username_changed_at,
      location_changed_at
    `
    )
    .eq("id", user.id)
    .single();

  if (profileError || !currentProfile) {
    return NextResponse.json(
      { error: "Perfil não encontrado" },
      { status: 404 }
    );
  }

  const nextName = cleanText(body.name, LIMITS.name);
  const nextUsername = cleanUsername(body.username);
  const nextLocation = cleanText(body.location, LIMITS.location);

  const updateData: Record<string, any> = {
    bio: cleanText(body.bio, LIMITS.bio),
    avatar_url: cleanUrl(body.avatar_url),
    cover_url: cleanUrl(body.cover_url),
    website: cleanUrl(body.website),
  };

  const now = new Date().toISOString();

  if (nextName !== currentProfile.name) {
    if (!canChange(currentProfile.name_changed_at)) {
      return NextResponse.json(
        { error: "Só podes alterar o nome uma vez a cada 7 dias." },
        { status: 403 }
      );
    }

    updateData.name = nextName;
    updateData.name_changed_at = now;
  }

  if (nextUsername !== currentProfile.username) {
    if (!canChange(currentProfile.username_changed_at)) {
      return NextResponse.json(
        { error: "Só podes alterar o username uma vez a cada 7 dias." },
        { status: 403 }
      );
    }

    updateData.username = nextUsername;
    updateData.username_changed_at = now;
  }

  if (nextLocation !== currentProfile.location) {
    if (!canChange(currentProfile.location_changed_at)) {
      return NextResponse.json(
        { error: "Só podes alterar a localização uma vez a cada 7 dias." },
        { status: 403 }
      );
    }

    updateData.location = nextLocation;
    updateData.location_changed_at = now;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
