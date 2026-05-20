import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

const LIMITS = {
  name: 50,
  username: 24,
  bio: 220,
  url: 300,
  location: 60,
};

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

const requests = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const current = requests.get(key);

  if (!current || current.resetAt < now) {
    requests.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });

    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;

  current.count++;
  return true;
}

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

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rateKey = `${user.id}:${ip}`;

  if (!rateLimit(rateKey)) {
    return NextResponse.json(
      { error: "Muitos pedidos. Tenta novamente daqui a pouco." },
      { status: 429 }
    );
  }

  const body = await req.json();

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