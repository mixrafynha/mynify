import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  buildR2DesignKey,
  dataUrlToBuffer,
  isDataImage,
  type DesignSide,
} from "../image-utils";
import { uploadBufferToR2 } from "../r2";
import { getDurableRateLimiter } from "@/lib/server/rate-limit";
import {
  parseBoundedJsonBody,
  readBoundedRequestBody,
  RequestBodyTooLargeError,
} from "@/lib/server/bounded-request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 48 * 1024 * 1024;
const MAX_PRODUCTION_BYTES = 32 * 1024 * 1024;
const MAX_PRODUCTION_DIMENSION = 20_000;
const MAX_PRODUCTION_PIXELS = 150_000_000;
const ALLOWED_PRODUCTION_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const productionUploadRateLimiter = getDurableRateLimiter({
  namespace: "production-file-upload",
  limit: 8,
  window: "1 m",
});

function sideValue(value: unknown): DesignSide {
  return value === "back" ? "back" : "front";
}

function safeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeMimeType(value: string) {
  return value.trim().toLowerCase().replace("image/jpg", "image/jpeg");
}

function estimatedDecodedBytes(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) return Number.POSITIVE_INFINITY;
  const base64Length = dataUrl.length - commaIndex - 1;
  return Math.ceil((base64Length * 3) / 4);
}

async function assertValidProductionImage(parsed: {
  buffer: Buffer;
  mimeType: string;
  byteLength: number;
}) {
  const declaredType = normalizeMimeType(parsed.mimeType);
  if (!ALLOWED_PRODUCTION_TYPES.has(declaredType)) {
    throw new Error("Unsupported production image type");
  }

  if (!parsed.byteLength || parsed.byteLength > MAX_PRODUCTION_BYTES) {
    throw new Error("Production image exceeds the 32 MB limit");
  }

  const metadata = await sharp(parsed.buffer, {
    limitInputPixels: MAX_PRODUCTION_PIXELS,
  }).metadata();

  if (!metadata.format || !metadata.width || !metadata.height) {
    throw new Error("Invalid production image content");
  }

  const actualType = `image/${metadata.format === "jpeg" ? "jpeg" : metadata.format}`;
  if (!ALLOWED_PRODUCTION_TYPES.has(actualType) || actualType !== declaredType) {
    throw new Error("Production image type does not match its content");
  }

  if (
    metadata.width > MAX_PRODUCTION_DIMENSION ||
    metadata.height > MAX_PRODUCTION_DIMENSION ||
    metadata.width * metadata.height > MAX_PRODUCTION_PIXELS
  ) {
    throw new Error("Production image dimensions are too large");
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    try {
      const rateLimit = await productionUploadRateLimiter.limit(user.id);
      if (!rateLimit.success) {
        return NextResponse.json({ error: "Too many production uploads" }, { status: 429 });
      }
    } catch (error) {
      console.error("[production-upload:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: "Production upload service is temporarily unavailable" },
        { status: 503 },
      );
    }

    const rawBody = await readBoundedRequestBody(req, MAX_BODY_BYTES);
    const body = parseBoundedJsonBody<Record<string, any>>(rawBody);
    const dataUrl = body.dataUrl;

    if (!isDataImage(dataUrl)) {
      return NextResponse.json({ error: "Invalid production image" }, { status: 400 });
    }

    if (estimatedDecodedBytes(dataUrl) > MAX_PRODUCTION_BYTES) {
      return NextResponse.json(
        { error: "Production image exceeds the 32 MB limit" },
        { status: 413 },
      );
    }

    const side = sideValue(body.side);
    const designId = safeString(body.designId) || crypto.randomUUID();
    const parsed = dataUrlToBuffer(dataUrl);

    try {
      await assertValidProductionImage(parsed);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid production image" },
        { status: 413 },
      );
    }

    const { buffer, mimeType, extension, byteLength } = parsed;
    const key = buildR2DesignKey({
      userId: user.id,
      designId,
      kind: "print",
      side,
      extension,
    });

    const uploaded = await uploadBufferToR2({
      key,
      buffer,
      contentType: mimeType,
    });

    return NextResponse.json({
      success: true,
      url: uploaded.url,
      fileUrl: uploaded.url,
      publicUrl: uploaded.url,
      key: uploaded.key,
      sizeBytes: byteLength,
    });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    console.error("UPLOAD_PRODUCTION_FILE_ERROR", error);
    return NextResponse.json({ error: "Failed to upload production file" }, { status: 500 });
  }
}
