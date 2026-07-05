import { task } from "@trigger.dev/sdk/v3";
import { createHash, createHmac } from "node:crypto";

const FONT_TABLE = process.env.FONT_TABLE_NAME ?? "editor_fonts";
const SUPABASE_FONT_PREVIEW_BUCKET = process.env.SUPABASE_FONT_PREVIEW_BUCKET ?? "font-previews";
const R2_FONT_PREVIEW_PREFIX = process.env.R2_FONT_PREVIEW_PREFIX ?? "font-previews";
const R2_FONT_FILE_PREFIX = process.env.R2_FONT_FILE_PREFIX ?? "font-files";

type FontPreviewPayload = {
  fontId: string;
  family?: string | null;
  category?: string | null;
  previewText?: string | null;
};

type FontRow = Record<string, any>;

type UploadResult = {
  url: string;
  key: string;
  provider: "r2" | "supabase";
};

export const generateFontPreview = task({
  id: "generate-font-preview",
  run: async (payload: FontPreviewPayload) => {
    if (!payload.fontId) {
      throw new Error("generate-font-preview requires payload.fontId");
    }

    const supabase = await createSupabaseAdmin();
    const fontRow = await readFontRow(supabase, payload.fontId);

    const family = cleanFamily(
      payload.family ??
        fontRow?.google ??
        fontRow?.google_family ??
        fontRow?.googleFamily ??
        fontRow?.family ??
        fontRow?.name ??
        fontRow?.font_family ??
        fontRow?.fontFamily ??
        payload.fontId,
    );

    const previewText =
      payload.previewText ??
      fontRow?.preview_text ??
      fontRow?.previewText ??
      "RYFIO";

    await markFontPreviewStatus(supabase, payload.fontId, "processing", null);

    const sourceFontFileUrl = await resolveFontFileUrl(fontRow, family, previewText);
    const fontBuffer = await fetchBinary(sourceFontFileUrl);

    const fontKey = `${R2_FONT_FILE_PREFIX}/${slugify(payload.fontId)}.woff2`;
    const fontUpload = await uploadBinary({
      key: fontKey,
      body: fontBuffer,
      contentType: "font/woff2",
      supabaseBucket: process.env.SUPABASE_FONT_FILE_BUCKET ?? "font-files",
    });

    const webpBuffer = await renderFontPreviewWebp({
      family,
      previewText,
      fontBuffer,
    });

    const previewKey = `${R2_FONT_PREVIEW_PREFIX}/${slugify(payload.fontId)}.webp`;
    const previewUpload = await uploadBinary({
      key: previewKey,
      body: webpBuffer,
      contentType: "image/webp",
      supabaseBucket: SUPABASE_FONT_PREVIEW_BUCKET,
    });

    await updateFontAssets(supabase, payload.fontId, {
      fontUrl: fontUpload.url,
      previewUrl: previewUpload.url,
    });

    return {
      ok: true,
      fontId: payload.fontId,
      family,
      fontUrl: fontUpload.url,
      previewUrl: previewUpload.url,
      fontStorageKey: fontUpload.key,
      previewStorageKey: previewUpload.key,
      provider: previewUpload.provider,
      sourceFontFileUrl,
    };
  },
});

async function createSupabaseAdmin(): Promise<any> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const mod = await dynamicImport("@supabase/supabase-js");
  return mod.createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function readFontRow(supabase: any, fontId: string): Promise<FontRow | null> {
  const { data, error } = await supabase
    .from(FONT_TABLE)
    .select("*")
    .eq("id", fontId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data ?? null;
}

async function markFontPreviewStatus(
  supabase: any,
  fontId: string,
  status: "processing" | "ready" | "failed",
  errorMessage: string | null,
) {
  // Optional columns. If they do not exist, this safely does nothing.
  await supabase
    .from(FONT_TABLE)
    .update({
      preview_status: status,
      preview_error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fontId);
}

async function updateFontAssets(
  supabase: any,
  fontId: string,
  {
    fontUrl,
    previewUrl,
  }: {
    fontUrl: string;
    previewUrl: string;
  },
) {
  // Your current table already has font_url and preview_webp_url.
  // Keep the candidate fallbacks so older schemas still work.
  const previewColumns = ["preview_webp_url", "preview_url", "previewUrl", "font_preview_url"];
  const fontColumns = ["font_url", "font_file_url", "fontUrl", "file_url", "woff2_url"];

  let lastError: any = null;

  for (const previewColumn of previewColumns) {
    for (const fontColumn of fontColumns) {
      const { error } = await supabase
        .from(FONT_TABLE)
        .update({
          [previewColumn]: previewUrl,
          [fontColumn]: fontUrl,
          preview_status: "ready",
          preview_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", fontId);

      if (!error) return;
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(`Unable to update font assets in ${FONT_TABLE}: ${lastError.message ?? String(lastError)}`);
  }
}

async function resolveFontFileUrl(row: FontRow | null, family: string, previewText: string): Promise<string> {
  const directUrl =
    row?.font_file_url ??
    row?.font_url ??
    row?.fontUrl ??
    row?.file_url ??
    row?.fileUrl ??
    row?.woff2_url ??
    row?.woff2Url ??
    row?.ttf_url ??
    row?.ttfUrl;

  if (typeof directUrl === "string" && directUrl.startsWith("http")) {
    return directUrl;
  }

  const directCssUrl =
    row?.css_url ??
    row?.cssUrl ??
    row?.google_fonts_css_url ??
    row?.googleFontsCssUrl;

  if (typeof directCssUrl === "string" && directCssUrl.startsWith("http")) {
    return resolveFontUrlFromCss(directCssUrl);
  }

  const encodedFamily = encodeURIComponent(family).replace(/%20/g, "+");
  const encodedText = encodeURIComponent(previewText || "RYFIO");

  // Some Google fonts are single-weight only. A weighted CSS request can fail for those,
  // so try a small ordered list and stop at the first CSS response with a font URL.
  const cssCandidates = [
    `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400;500;600;700;800;900&text=${encodedText}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400;700&text=${encodedText}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${encodedFamily}&text=${encodedText}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${encodedFamily}&display=swap`,
  ];

  let lastError: unknown = null;

  for (const cssUrl of cssCandidates) {
    try {
      return await resolveFontUrlFromCss(cssUrl);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to resolve Google Font file for "${family}": ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function resolveFontUrlFromCss(cssUrl: string): Promise<string> {
  const res = await fetch(cssUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to fetch font CSS: ${res.status} ${res.statusText}`);
  }

  const css = await res.text();
  const urls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((match) => match[1]);

  if (!urls.length) {
    throw new Error(`No font file URL found inside Google Fonts CSS: ${css.slice(0, 220)}`);
  }

  const latinBlock = css.match(/\/\*\s*latin\s*\*\/[\s\S]*?src:\s*url\((https:\/\/[^)]+)\)/i);
  const latinExtBlock = css.match(/\/\*\s*latin-ext\s*\*\/[\s\S]*?src:\s*url\((https:\/\/[^)]+)\)/i);

  return latinBlock?.[1] ?? latinExtBlock?.[1] ?? urls[urls.length - 1];
}

async function fetchBinary(url: string): Promise<Buffer> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Unable to fetch font file: ${res.status} ${res.statusText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function renderFontPreviewWebp({
  family,
  previewText,
  fontBuffer,
}: {
  family: string;
  previewText: string;
  fontBuffer: Buffer;
}): Promise<Buffer> {
  const sharp = await loadSharp();
  const { Resvg } = await loadResvg();

  const safeFamily = escapeCssString(family);
  const safeText = escapeXml(previewText || "RYFIO");

  const svg = `
    <svg width="900" height="220" viewBox="0 0 900 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="900" height="220" rx="34" fill="#11111f"/>
      <text
        x="450"
        y="123"
        fill="#f8fafc"
        font-family="${safeFamily}"
        font-size="96"
        font-weight="700"
        text-anchor="middle"
        dominant-baseline="middle"
        letter-spacing="-2"
      >${safeText}</text>
    </svg>`;

  // Sharp/librsvg often ignores @font-face data URLs inside SVG. Resvg supports explicit
  // font buffers, so the preview is rendered with the real downloaded Google Font.
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 900,
    },
    font: {
      loadSystemFonts: false,
      fontBuffers: [fontBuffer],
      defaultFontFamily: family,
    },
  });

  const pngBuffer = resvg.render().asPng();

  return sharp(pngBuffer)
    .webp({ quality: 95, effort: 6 })
    .toBuffer();
}

async function uploadBinary({
  key,
  body,
  contentType,
  supabaseBucket,
}: {
  key: string;
  body: Buffer;
  contentType: string;
  supabaseBucket: string;
}): Promise<UploadResult> {
  if (hasR2Config()) {
    return uploadToR2({ key, body, contentType });
  }

  return uploadToSupabaseStorage({ key, body, contentType, bucket: supabaseBucket });
}

function hasR2Config() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      (process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL),
  );
}

async function uploadToR2({ key, body, contentType }: { key: string; body: Buffer; contentType: string }): Promise<UploadResult> {
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucket = requiredEnv("R2_BUCKET");
  const publicBaseUrl = stripTrailingSlash(
    process.env.R2_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "",
  );

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${bucket}/${key}`;

  await signedR2Put({
    url,
    accessKeyId,
    secretAccessKey,
    body,
    contentType,
  });

  return {
    url: `${publicBaseUrl}/${key}`,
    key,
    provider: "r2",
  };
}

async function signedR2Put({
  url,
  accessKeyId,
  secretAccessKey,
  body,
  contentType,
}: {
  url: string;
  accessKeyId: string;
  secretAccessKey: string;
  body: Buffer;
  contentType: string;
}) {
  const parsedUrl = new URL(url);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const payloadHash = sha256Hex(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${parsedUrl.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    parsedUrl.pathname,
    parsedUrl.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = hmacHex(signingKey, stringToSign);
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    body,
    headers: {
      authorization,
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  });

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
  }
}

async function uploadToSupabaseStorage({
  key,
  body,
  contentType,
  bucket,
}: {
  key: string;
  body: Buffer;
  contentType: string;
  bucket: string;
}): Promise<UploadResult> {
  const supabase = await createSupabaseAdmin();
  const path = key.replace(/^font-previews\//, "").replace(/^font-files\//, "");

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    url: data.publicUrl,
    key: path,
    provider: "supabase",
  };
}

async function loadSharp(): Promise<any> {
  try {
    const mod = await dynamicImport("sharp");
    return mod.default ?? mod;
  } catch {
    throw new Error("Missing dependency: install sharp to generate WebP font previews");
  }
}

async function loadResvg(): Promise<any> {
  try {
    return await dynamicImport("@resvg/resvg-js");
  } catch {
    throw new Error("Missing dependency: install @resvg/resvg-js to render real font previews");
  }
}

function dynamicImport(moduleName: string): Promise<any> {
  return new Function("moduleName", "return import(moduleName)")(moduleName);
}

function cleanFamily(value: string) {
  return String(value).trim().replace(/['"]/g, "");
}

function slugify(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "font";
}

function escapeXml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCssString(value: string) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, regionName: string, serviceName: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}
