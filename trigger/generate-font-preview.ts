import { task } from "@trigger.dev/sdk/v3";
import { createHash, createHmac } from "node:crypto";

const FONT_TABLE = process.env.FONT_TABLE_NAME ?? "editor_fonts";
const R2_FONT_FILE_PREFIX = process.env.R2_FONT_FILE_PREFIX ?? "font-files";
const R2_FONT_PREVIEW_PREFIX = process.env.R2_FONT_PREVIEW_PREFIX ?? "font-previews";

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
  provider: "r2";
};

export const generateFontPreview = task({
  id: "generate-font-preview",
  run: async (payload: FontPreviewPayload) => {
    if (!payload.fontId) {
      throw new Error("generate-font-preview requires payload.fontId");
    }

    assertR2Config();

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
    const fontUpload = await uploadToR2({
      key: fontKey,
      body: fontBuffer,
      contentType: "font/woff2",
    });

    const webpBuffer = await renderFontPreviewWebp({
      family,
      previewText,
      fontBuffer,
    });

    const previewKey = `${R2_FONT_PREVIEW_PREFIX}/${slugify(payload.fontId)}.webp`;
    const previewUpload = await uploadToR2({
      key: previewKey,
      body: webpBuffer,
      contentType: "image/webp",
    });

    await updateFontUrls(supabase, payload.fontId, {
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
      provider: "r2",
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

  if (error) return null;
  return data ?? null;
}

async function markFontPreviewStatus(
  supabase: any,
  fontId: string,
  status: "processing" | "ready" | "failed",
  errorMessage: string | null,
) {
  await supabase
    .from(FONT_TABLE)
    .update({
      preview_status: status,
      preview_error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fontId);
}

async function updateFontUrls(
  supabase: any,
  fontId: string,
  urls: { fontUrl: string; previewUrl: string },
) {
  const { error } = await supabase
    .from(FONT_TABLE)
    .update({
      font_url: urls.fontUrl,
      preview_webp_url: urls.previewUrl,
      preview_status: "ready",
      preview_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fontId);

  if (!error) return;

  // If optional status columns do not exist, retry only the required columns from your schema.
  const retry = await supabase
    .from(FONT_TABLE)
    .update({
      font_url: urls.fontUrl,
      preview_webp_url: urls.previewUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fontId);

  if (retry.error) {
    throw new Error(`Unable to update ${FONT_TABLE}: ${retry.error.message ?? String(retry.error)}`);
  }
}

async function resolveFontFileUrl(_row: FontRow | null, family: string, previewText: string): Promise<string> {
  const encodedFamily = encodeGoogleFontsFamily(family);
  const encodedText = encodeURIComponent(previewText || "RYFIO");

  const cssCandidates = [
    `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400&text=${encodedText}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${encodedFamily}&text=${encodedText}&display=swap`,
    `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400&display=swap`,
    `https://fonts.googleapis.com/css2?family=${encodedFamily}&display=swap`,
  ];

  let lastError: unknown = null;

  for (const cssUrl of cssCandidates) {
    try {
      return await resolveFontUrlFromGoogleCss(cssUrl, family);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to resolve Google Fonts WOFF2 for "${family}": ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

async function resolveFontUrlFromGoogleCss(cssUrl: string, family: string): Promise<string> {
  const res = await fetch(cssUrl, {
    headers: {
      // Google Fonts serves modern WOFF2 only when the request looks like a modern browser.
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      accept: "text/css,*/*;q=0.1",
    },
  });

  if (!res.ok) {
    throw new Error(`Unable to fetch Google Fonts CSS: ${res.status} ${res.statusText} | URL: ${cssUrl}`);
  }

  const css = await res.text();
  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+?\.woff2)\)/g)].map(
    (match) => match[1],
  );

  if (!urls.length) {
    throw new Error(
      `No Google Fonts WOFF2 URL found for "${family}" inside CSS: ${css.slice(0, 300)}`,
    );
  }

  // Google Fonts emits the most specific/latest usable WOFF2 for the request in the last matching block.
  // With normal Google CSS ordering, this is the latin subset when unicode ranges are split.
  return urls[urls.length - 1];
}

async function fetchBinary(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Unable to fetch binary file: ${res.status} ${res.statusText} | URL: ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function renderFontPreviewWebp({
  family,
  previewText,
}: {
  family: string;
  previewText: string;
  fontBuffer: Buffer;
}): Promise<Buffer> {
  const sharp = await loadSharp();
  const { chromium } = await loadPlaywright();

  const cleanPreviewText = previewText || "RYFIO";
  const encodedFamily = encodeGoogleFontsFamily(family);
  const encodedText = encodeURIComponent(cleanPreviewText);
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}&text=${encodedText}&display=swap`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 900,
        height: 220,
      },
      deviceScaleFactor: 2,
    });

    const safeFamily = escapeHtml(cleanFamily(family));
    const safeText = escapeHtml(cleanPreviewText);

    await page.setContent(
      `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="${cssUrl}" rel="stylesheet">
          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 900px;
              height: 220px;
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: transparent;
            }

            #preview {
              width: 900px;
              height: 220px;
              border-radius: 34px;
              background: #11111f;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }

            #label {
              max-width: 820px;
              color: #f8fafc;
              font-family: "${safeFamily}", sans-serif;
              font-size: 96px;
              font-weight: 400;
              line-height: 1;
              letter-spacing: -2px;
              white-space: nowrap;
              text-rendering: geometricPrecision;
              -webkit-font-smoothing: antialiased;
            }
          </style>
        </head>
        <body>
          <div id="preview">
            <div id="label">${safeText}</div>
          </div>
        </body>
      </html>`,
      { waitUntil: "networkidle" },
    );

   await page.evaluate(async (fontFamily: string) => {
  await document.fonts.load(`400 96px "${fontFamily}"`);
  await document.fonts.ready;
}, cleanFamily(family));

    const element = await page.$("#preview");
    if (!element) {
      throw new Error("Unable to find font preview element");
    }

    const pngBuffer = await element.screenshot({
      type: "png",
      omitBackground: true,
    });

    return sharp(pngBuffer)
      .resize(900, 220, { fit: "fill" })
      .webp({ quality: 95, effort: 6 })
      .toBuffer();
  } finally {
    await browser.close();
  }
}


function assertR2Config() {
  const bucket = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_PUBLIC_URL;

  const missing = [
    !process.env.R2_ACCOUNT_ID && "R2_ACCOUNT_ID",
    !process.env.R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
    !process.env.R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET or R2_BUCKET_NAME",
    !publicUrl && "R2_PUBLIC_URL",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Missing R2 environment variables: ${missing.join(", ")}`);
  }
}

async function uploadToR2({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<UploadResult> {
  assertR2Config();

  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucket = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Missing environment variable: R2_BUCKET or R2_BUCKET_NAME");
  }
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

async function loadSharp(): Promise<any> {
  try {
    const mod = await dynamicImport("sharp");
    return mod.default ?? mod;
  } catch {
    throw new Error("Missing dependency: install sharp to generate WebP font previews");
  }
}

async function loadPlaywright(): Promise<any> {
  try {
    return await dynamicImport("playwright");
  } catch {
    throw new Error("Missing dependency: install playwright and run: npx playwright install chromium");
  }
}


function dynamicImport(moduleName: string): Promise<any> {
  return new Function("moduleName", "return import(moduleName)")(moduleName);
}

function cleanFamily(value: string) {
  return String(value).trim().replace(/['"]/g, "");
}

function encodeGoogleFontsFamily(value: string) {
  return encodeURIComponent(cleanFamily(value)).replace(/%20/g, "+");
}

function slugify(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "font";
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
