import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type EditorFontRow = {
  id: string;
  family: string;
  category: string | null;
  source: string | null;
  font_url: string | null;
  preview_webp_url: string | null;
  enabled: boolean | null;
};

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tableName = process.env.FONT_TABLE_NAME ?? "editor_fonts";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { fonts: [], error: "Missing Supabase environment variables." },
      { status: 200 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from(tableName)
    .select("id,family,category,source,font_url,preview_webp_url,enabled")
    .eq("enabled", true)
    .order("family", { ascending: true });

  if (error) {
    return NextResponse.json({ fonts: [], error: error.message }, { status: 200 });
  }

  const fonts = ((data ?? []) as EditorFontRow[]).map((font) => ({
    id: font.id,
    family: font.family,
    category: font.category ?? "sans",
    google: font.family,
    fontUrl: font.font_url,
    previewWebpUrl: font.preview_webp_url,
    preview_webp_url: font.preview_webp_url,
    enabled: font.enabled !== false,
  }));

  return NextResponse.json(
    { fonts },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
