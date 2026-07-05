import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FontPreviewPayload = {
  fontId?: string;
  family?: string;
  category?: string;
};

export async function GET(request: Request) {
  return handleTrigger(request);
}

export async function POST(request: Request) {
  return handleTrigger(request);
}

async function handleTrigger(request: Request) {
  try {
    const body = request.method === "GET" ? null : await readJson<FontPreviewPayload>(request);
    const url = new URL(request.url);

    const fontId = String(body?.fontId || url.searchParams.get("fontId") || "").trim();

    if (fontId) {
      await tasks.trigger("generate-font-preview", {
        fontId,
        family: body?.family ?? url.searchParams.get("family") ?? null,
        category: body?.category ?? url.searchParams.get("category") ?? null,
      });

      return NextResponse.json({ ok: true, triggered: 1 });
    }

    const fonts = await readEnabledFonts();

    for (const font of fonts) {
      await tasks.trigger("generate-font-preview", {
        fontId: font.id,
        family: font.family,
        category: font.category ?? null,
      });
    }

    return NextResponse.json({ ok: true, triggered: fonts.length });
  } catch (error) {
    console.error("font preview trigger failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to trigger font preview",
      },
      { status: 500 },
    );
  }
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readEnabledFonts(): Promise<Array<{ id: string; family: string; category: string | null }>> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const tableName = process.env.FONT_TABLE_NAME ?? "editor_fonts";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from(tableName)
    .select("id,family,category,enabled")
    .eq("enabled", true)
    .order("family", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((font: any) => ({
    id: font.id,
    family: font.family,
    category: font.category ?? null,
  }));
}