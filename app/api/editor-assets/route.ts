import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssetType = "shapes" | "stickers";

function env(name: string, fallback?: string) {
  const value = process.env[name]?.trim() || (fallback ? process.env[fallback]?.trim() : "");
  if (!value) throw new Error(`Missing environment variable: ${name}${fallback ? ` or ${fallback}` : ""}`);
  return value;
}

async function readTable(table: "editor_shapes" | "editor_stickers", select: string) {
  const supabaseUrl = env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  const supabaseKey = env("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const params = new URLSearchParams({
    select,
    enabled: "eq.true",
    order: "position.asc",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${table}: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<Record<string, unknown>[]>;
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as AssetType | null;
  if (type !== "shapes" && type !== "stickers") {
    return NextResponse.json(
      { error: "Query parameter type must be shapes or stickers." },
      { status: 400 },
    );
  }

  try {
    if (type === "shapes") {
      const rows = await readTable(
        "editor_shapes",
        "id,label,category,value,font_family,font_size,color,asset_url,preview_webp_url",
      );
      const shapes = rows.map((row) => ({
        id: String(row.id),
        label: String(row.label),
        category: String(row.category),
        value: String(row.value || ""),
        fontFamily: String(row.font_family || "Arial"),
        fontSize: Number(row.font_size || 64),
        color: String(row.color || "#111111"),
        svg: typeof row.asset_url === "string" ? row.asset_url : undefined,
        preview: typeof row.preview_webp_url === "string" ? row.preview_webp_url : undefined,
      }));

      return NextResponse.json({ shapes }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const rows = await readTable(
      "editor_stickers",
      "id,label,category,value,asset_url,preview_webp_url",
    );
    const stickers = rows.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      category: String(row.category),
      value: String(row.value || ""),
      svg: typeof row.asset_url === "string" ? row.asset_url : undefined,
      preview: typeof row.preview_webp_url === "string" ? row.preview_webp_url : undefined,
    }));

    return NextResponse.json({ stickers }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[editor-assets]", error);
    return NextResponse.json({ error: "Failed to load editor assets." }, { status: 500 });
  }
}
