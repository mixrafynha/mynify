import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { task } from "@trigger.dev/sdk/v3";
import * as fontkit from "fontkit";
import WebSocket from "ws";

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
      realtime: { transport: WebSocket as never },
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

async function uploadSvg(
  runtime: Runtime,
  folder: "shapes" | "stickers",
  id: string,
  svg: string,
) {
  const key = `editor-assets/${folder}/${safeKey(id)}.svg`;
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

async function downloadFont(url: string) {
  const response = await fetch(url, {
    headers: { accept: "font/ttf,font/otf,application/octet-stream,*/*;q=0.8" },
  });
  if (!response.ok) {
    throw new Error(`Failed to download shape font: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) throw new Error("Downloaded shape font is invalid or empty.");
  return fontkit.create(buffer) as any;
}

function fontContains(font: any, value: string) {
  return Array.from(value).every(
    (character) => font.glyphForCodePoint(character.codePointAt(0) || 0).id !== 0,
  );
}

function shapePathSvg(font: any, value: string, color: string) {
  const run = font.layout(value);
  let cursorX = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const paths: string[] = [];

  run.glyphs.forEach((glyph: any, index: number) => {
    const position = run.positions[index];
    const x = cursorX + Number(position.xOffset || 0);
    const y = Number(position.yOffset || 0);
    const box = glyph.bbox;
    minX = Math.min(minX, x + box.minX);
    minY = Math.min(minY, y + box.minY);
    maxX = Math.max(maxX, x + box.maxX);
    maxY = Math.max(maxY, y + box.maxY);
    paths.push(`<path d="${glyph.path.toSVG()}" transform="translate(${x} ${y})"/>`);
    cursorX += Number(position.xAdvance || glyph.advanceWidth || 0);
  });

  if (!paths.length || ![minX, minY, maxX, maxY].every(Number.isFinite)) {
    throw new Error(`Unable to generate SVG path for shape value: ${value}`);
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const scale = Math.min(832 / width, 832 / height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g fill="${color}" transform="translate(512 512) scale(${scale} ${-scale}) translate(${-centerX} ${-centerY})">${paths.join("")}</g></svg>`;
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

  const arialBoldRow = fontsById.get("arial-bold");
  const symbolRow = fontsById.get("segoe-ui-symbol");
  if (!arialBoldRow?.font_url || !symbolRow?.font_url) {
    throw new Error(
      "Enabled editor_fonts rows arial-bold and segoe-ui-symbol with font_url are required to generate shape SVG paths.",
    );
  }

  const [arialBold, segoeUiSymbol] = await Promise.all([
    downloadFont(String(arialBoldRow.font_url)),
    downloadFont(String(symbolRow.font_url)),
  ]);

  const missingFamilies = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (let index = 0; index < SHAPES.length; index += 1) {
    const shape = SHAPES[index];
    const family = String(shape.fontFamily || "Arial").trim();
    const font = forcedFont || fontsByFamily.get(normalize(family));
    if (!font) missingFamilies.add(family);

    const pathFont = fontContains(arialBold, shape.value) ? arialBold : segoeUiSymbol;
    if (!fontContains(pathFont, shape.value)) {
      throw new Error(`No configured shape font contains every glyph in ${shape.id}: ${shape.value}`);
    }
    const pathFontRow = pathFont === arialBold ? arialBoldRow : symbolRow;
    const color = shape.color || "#111111";
    const assetUrl = await uploadSvg(
      runtime,
      "shapes",
      shape.id || `shape-${index + 1}`,
      shapePathSvg(pathFont, shape.value, color),
    );

    rows.push({
      id: shape.id || `shape-${index + 1}`,
      label: shape.label,
      category: shape.category,
      source: "r2",
      value: shape.value,
      font_id: pathFontRow.id,
      font_family: pathFontRow.family,
      font_size: Number(shape.fontSize || 64),
      color,
      asset_url: assetUrl,
      preview_webp_url: shape.preview || null,
      enabled: true,
      position: index,
    });
  }

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
        assetUrl = await uploadSvg(runtime, "stickers", sticker.id, svg);
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
