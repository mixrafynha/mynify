import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { task } from "@trigger.dev/sdk/v3";

import { SHAPES } from "../app/dashboard/design/components/data/shapes";
import { STICKER_ITEMS } from "../app/dashboard/design/components/data/stickers";
import { EXTRA_STICKER_ITEMS } from "../app/dashboard/design/components/data/stickersExtra";

function required(name: string, ...fallbacks: string[]) {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${[name, ...fallbacks].join(" or ")}`);
}

function optional(name: string, ...fallbacks: string[]) {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function safeKey(value: unknown) {
  return String(value || "asset")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "asset";
}

function chunks<T>(items: T[], size = 250) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function decodeSvg(value: string) {
  const source = value.trim();
  if (source.startsWith("<svg")) return source;
  if (!/^data:image\/svg\+xml/i.test(source)) return "";

  const comma = source.indexOf(",");
  if (comma < 0) return "";
  const header = source.slice(0, comma);
  const content = source.slice(comma + 1);
  return /;base64/i.test(header)
    ? Buffer.from(content, "base64").toString("utf8")
    : decodeURIComponent(content);
}

function createRuntime() {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const r2AccountId = required(
    "R2_ACCOUNT_ID",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCOUNT_ID",
  );
  const r2AccessKeyId = required(
    "R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
  );
  const r2SecretAccessKey = required(
    "R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  );
  const r2Bucket = required(
    "R2_BUCKET",
    "R2_BUCKET_NAME",
    "CLOUDFLARE_R2_BUCKET_NAME",
    "CLOUDFLARE_R2_BUCKET",
  );
  const r2PublicUrl = required(
    "R2_PUBLIC_URL",
    "CLOUDFLARE_R2_PUBLIC_URL",
    "CLOUDFLARE_R2_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_R2_PUBLIC_URL",
  ).replace(/\/+$/, "");

  return {
    supabase: createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    r2: new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    }),
    r2Bucket,
    r2PublicUrl,
    forcedShapeFontId: optional("EDITOR_SHAPES_FONT_ID"),
  };
}

type Runtime = ReturnType<typeof createRuntime>;

async function uploadSvg(runtime: Runtime, id: string, svg: string) {
  const key = `editor-assets/stickers/${safeKey(id)}.svg`;
  await runtime.r2.send(
    new PutObjectCommand({
      Bucket: runtime.r2Bucket,
      Key: key,
      Body: Buffer.from(svg, "utf8"),
      ContentType: "image/svg+xml; charset=utf-8",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${runtime.r2PublicUrl}/${key}`;
}

async function upsertRows(
  runtime: Runtime,
  table: string,
  rows: Record<string, unknown>[],
) {
  for (const batch of chunks(rows)) {
    const { error } = await runtime.supabase.from(table).upsert(batch, {
      onConflict: "id",
    });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function syncShapes(runtime: Runtime) {
  const { data: fonts, error } = await runtime.supabase
    .from("editor_fonts")
    .select("id,family,font_url,enabled")
    .eq("enabled", true);
  if (error) throw new Error(`editor_fonts: ${error.message}`);

  const fontsById = new Map((fonts || []).map((font) => [font.id, font]));
  const fontsByFamily = new Map(
    (fonts || []).map((font) => [normalize(font.family), font]),
  );
  const forcedFont = runtime.forcedShapeFontId
    ? fontsById.get(runtime.forcedShapeFontId)
    : null;

  if (runtime.forcedShapeFontId && !forcedFont) {
    throw new Error(
      `EDITOR_SHAPES_FONT_ID=${runtime.forcedShapeFontId} was not found as an enabled editor_fonts row.`,
    );
  }

  const missingFamilies = new Set<string>();
  const rows = SHAPES.map((shape, index) => {
    const family = String(shape.fontFamily || "Arial").trim();
    const font = forcedFont || fontsByFamily.get(normalize(family));
    if (!font) missingFamilies.add(family);

    return {
      id: shape.id || `shape-${index + 1}`,
      label: shape.label,
      category: shape.category,
      source: "font",
      value: shape.value,
      font_id: font?.id || null,
      font_family: font?.family || family,
      font_size: Number(shape.fontSize || 64),
      color: shape.color || "#111111",
      asset_url: null,
      preview_webp_url: shape.preview || null,
      enabled: true,
      position: index,
    };
  });

  if (missingFamilies.size) {
    throw new Error(
      `Missing enabled editor_fonts rows for: ${Array.from(missingFamilies).join(", ")}. ` +
      "Create those rows or set EDITOR_SHAPES_FONT_ID in .env.",
    );
  }

  await upsertRows(runtime, "editor_shapes", rows);
  return rows.length;
}

async function syncStickers(runtime: Runtime) {
  const stickers = [...STICKER_ITEMS, ...EXTRA_STICKER_ITEMS];
  const rows: Record<string, unknown>[] = [];

  for (let index = 0; index < stickers.length; index += 1) {
    const sticker = stickers[index];
    const rawSvg = typeof sticker.svg === "string" ? sticker.svg.trim() : "";
    let source = "emoji";
    let assetUrl: string | null = null;

    if (/^https?:\/\//i.test(rawSvg)) {
      source = "r2";
      assetUrl = rawSvg;
    } else {
      const svg = rawSvg ? decodeSvg(rawSvg) : "";
      if (svg) {
        source = "r2";
        assetUrl = await uploadSvg(runtime, sticker.id, svg);
      }
    }

    rows.push({
      id: sticker.id,
      label: sticker.label,
      category: sticker.category,
      source,
      value: sticker.value || null,
      asset_url: assetUrl,
      preview_webp_url:
        typeof sticker.preview === "string" && /^https?:\/\//i.test(sticker.preview)
          ? sticker.preview
          : null,
      enabled: true,
      position: index,
    });
  }

  await upsertRows(runtime, "editor_stickers", rows);
  return rows.length;
}

export const syncEditorAssets = task({
  id: "sync-editor-assets",
  maxDuration: 300,
  run: async () => {
    const runtime = createRuntime();
    const shapeCount = await syncShapes(runtime);
    const stickerCount = await syncStickers(runtime);

    return {
      ok: true,
      shapeCount,
      stickerCount,
    };
  },
});
