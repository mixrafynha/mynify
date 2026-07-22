import "dotenv/config";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const r2AccountId = required("R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID");
const r2AccessKeyId = required("R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID");
const r2SecretAccessKey = required("R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_ACCESS_KEY");
const r2Bucket = required(
  "R2_BUCKET",
  "R2_BUCKET_NAME",
  "CLOUDFLARE_R2_BUCKET_NAME",
);
const r2PublicUrl = required(
  "R2_PUBLIC_URL",
  "CLOUDFLARE_R2_PUBLIC_URL",
  "CLOUDFLARE_R2_PUBLIC_BASE_URL",
).replace(/\/+$/, "");
const forcedShapeFontId = optional("EDITOR_SHAPES_FONT_ID");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

async function uploadSvg(id: string, svg: string) {
  const key = `editor-assets/stickers/${safeKey(id)}.svg`;
  await r2.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: Buffer.from(svg, "utf8"),
      ContentType: "image/svg+xml; charset=utf-8",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${r2PublicUrl}/${key}`;
}

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  for (const batch of chunks(rows)) {
    const { error } = await supabase.from(table).upsert(batch, {
      onConflict: "id",
    });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function syncShapes() {
  const { data: fonts, error } = await supabase
    .from("editor_fonts")
    .select("id,family,font_url,enabled")
    .eq("enabled", true);
  if (error) throw new Error(`editor_fonts: ${error.message}`);

  const fontsById = new Map((fonts || []).map((font) => [font.id, font]));
  const fontsByFamily = new Map(
    (fonts || []).map((font) => [normalize(font.family), font]),
  );
  const forcedFont = forcedShapeFontId
    ? fontsById.get(forcedShapeFontId)
    : null;

  if (forcedShapeFontId && !forcedFont) {
    throw new Error(
      `EDITOR_SHAPES_FONT_ID=${forcedShapeFontId} was not found as an enabled editor_fonts row.`,
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

  await upsertRows("editor_shapes", rows);
  return rows.length;
}

async function syncStickers() {
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
        assetUrl = await uploadSvg(sticker.id, svg);
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

  await upsertRows("editor_stickers", rows);
  return rows.length;
}

async function main() {
  const shapeCount = await syncShapes();
  const stickerCount = await syncStickers();
  console.info(`Synced ${shapeCount} shapes and ${stickerCount} stickers.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
