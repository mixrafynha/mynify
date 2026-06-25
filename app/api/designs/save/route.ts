import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SaveDesignPayload = {
  schemaVersion?: number;
  productId?: string;
  category?: string;
  variantId?: string | null;
  status?: string;
  color?: string;
  mockupColor?: string;
  sides?: Record<string, unknown>;
  production?: {
    quality?: {
      status?: string;
      printReady?: boolean;
      issueCount?: number;
      issues?: unknown[];
    };
    [key: string]: unknown;
  };
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeDesignPayload(value: unknown): SaveDesignPayload | null {
  if (!isObject(value)) return null;

  const payload = value as SaveDesignPayload;

  if (!payload.productId || typeof payload.productId !== "string") return null;
  if (!payload.category || typeof payload.category !== "string") return null;
  if (!isObject(payload.sides)) return null;
  if (!isObject(payload.sides.front) && !isObject(payload.sides.back)) return null;

  return payload;
}

async function insertWithSupabaseRest(payload: SaveDesignPayload) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (!supabaseUrl || !key) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const quality = payload.production?.quality || {};

  const response = await fetch(`${supabaseUrl}/rest/v1/designs`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      product_id: payload.productId,
      category: payload.category,
      variant_id: payload.variantId || null,
      status: payload.status || "draft",
      color: payload.color || payload.mockupColor || "#ffffff",
      mockup_color: payload.mockupColor || payload.color || "#ffffff",
      schema_version: payload.schemaVersion || 2,
      design_data: payload,
      production_status: typeof quality.status === "string" ? quality.status : "review",
      print_ready: Boolean(quality.printReady),
      production_issue_count: Number(quality.issueCount || 0),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isObject(data) && typeof data.message === "string" ? data.message : "Supabase insert failed";
    throw new Error(message);
  }

  const saved = Array.isArray(data) ? data[0] : data;

  return {
    designId: isObject(saved) && typeof saved.id === "string" ? saved.id : null,
    design: saved,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const payload = normalizeDesignPayload(body);

    if (!payload) {
      return jsonError("Invalid design payload", 422);
    }

    const result = await insertWithSupabaseRest(payload);

    return NextResponse.json({
      ok: true,
      designId: result.designId,
      design: result.design,
      production: payload.production?.quality || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown save error";
    return jsonError(message, 500);
  }
}
