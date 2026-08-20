import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import sharp from "sharp";
import { dataUrlToBuffer } from "../save-design/image-utils";
import { uploadBufferToR2 } from "../save-design/r2";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import {
  parseBoundedJsonBody,
  readBoundedRequestBody,
  RequestBodyTooLargeError,
} from "@/lib/server/bounded-request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_BODY_BYTES = 35 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 12_000;
const MAX_IMAGE_PIXELS = 100_000_000;
const uploadRateLimiter = getDurableRateLimiter({
  namespace: "design-element-image",
  limit: 20,
  window: "1 m",
});

function safePart(value: unknown) {
  return String(value || "image")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100) || "image";
}

function normalizeMimeType(value: string) {
  return value.toLowerCase().replace("image/jpg", "image/jpeg");
}

function formatToMimeType(format: string) {
  return `image/${format === "jpeg" ? "jpeg" : format}`;
}

async function normalizeUploadBuffer(parsed: { buffer: Buffer; mimeType: string; byteLength: number }) {
  const declaredMimeType = normalizeMimeType(parsed.mimeType);
  if (!ALLOWED_IMAGE_TYPES.has(declaredMimeType)) {
    throw new Error(`Unsupported image type: ${parsed.mimeType}`);
  }

  if (parsed.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds the 25 MB upload limit");
  }

  const image = sharp(parsed.buffer, { limitInputPixels: MAX_IMAGE_PIXELS });
  const metadata = await image.metadata();

  if (!metadata.format || !metadata.width || !metadata.height) {
    throw new Error("Invalid image content");
  }

  if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
    throw new Error(`Image dimensions exceed ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION}px`);
  }

  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error("Image pixel count exceeds the allowed limit");
  }

  const detectedMimeType = formatToMimeType(metadata.format);
  if (!ALLOWED_IMAGE_TYPES.has(detectedMimeType)) {
    throw new Error(`Unsupported image format: ${metadata.format}`);
  }

  if (detectedMimeType !== declaredMimeType) {
    throw new Error(`Declared mime type does not match image content (${declaredMimeType} vs ${detectedMimeType})`);
  }

  let normalized = image;
  if (metadata.format === "png") {
    normalized = normalized.png({ compressionLevel: 9, adaptiveFiltering: true, palette: false });
  } else if (metadata.format === "webp") {
    normalized = normalized.webp({ quality: 92, effort: 4 });
  } else if (metadata.format === "jpeg") {
    normalized = normalized.jpeg({ quality: 92, mozjpeg: true });
  }

  const buffer = await normalized.toBuffer();

  return {
    buffer,
    mimeType: detectedMimeType,
    extension: metadata.format === "jpeg" ? "jpg" : metadata.format,
  };
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase environment variables");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: "", ...options, maxAge: 0 }); } catch {}
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    try {
      const rateLimit = await uploadRateLimiter.limit(`${user.id}:${getTrustedRequestIp(req)}`);
      if (!rateLimit.success) {
        return NextResponse.json({ error: "Too many upload requests" }, { status: 429 });
      }
    } catch (error) {
      console.error("[design-element-image:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: "Upload service is temporarily unavailable" }, { status: 503 });
    }

    const rawBody = await readBoundedRequestBody(req, MAX_BODY_BYTES);
    const body = parseBoundedJsonBody<Record<string, any>>(rawBody);
    const parsed = dataUrlToBuffer(body?.dataUrl);
    const normalized = await normalizeUploadBuffer(parsed);

    const elementId = safePart(body?.elementId);
    const key = `users/${safePart(user.id)}/editor-elements/${elementId}-${crypto.randomUUID()}.${normalized.extension}`;
    const uploaded = await uploadBufferToR2({
      key,
      buffer: normalized.buffer,
      contentType: normalized.mimeType,
    });

    return NextResponse.json({ url: uploaded.url, key: uploaded.key });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    console.error("DESIGN_ELEMENT_IMAGE_UPLOAD_ERROR", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload design image" },
      { status: 500 },
    );
  }
}
