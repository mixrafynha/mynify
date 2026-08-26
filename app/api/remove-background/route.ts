import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import { validateSafeRemoteImageUrl } from "@/lib/server/safe-remote-image";
import { createSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 16_000_000;
const REMOVE_BG_TIMEOUT_MS = 30_000;
const SUPPORTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const removeBackgroundRateLimiter = getDurableRateLimiter({
  namespace: "remove-background",
  limit: 5,
  window: "1 m",
});

function safeSecretMatch(expected: string, actual: string) {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function hasValidInternalSecret(req: Request) {
  const expected = process.env.AI_INTERNAL_SECRET;
  const actual = req.headers.get("x-ai-internal-secret") || "";
  if (!expected || !actual) return false;
  return safeSecretMatch(expected, actual);
}

function hasConfiguredInternalSecret() {
  return Boolean(process.env.AI_INTERNAL_SECRET);
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isSupportedImage(buffer: Buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return true;
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

async function assertSafeDimensions(buffer: Buffer) {
  const metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();

  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error("IMAGE_DIMENSIONS_TOO_LARGE");
  }
}

function normalizeBase64(value: string) {
  const dataUrlMatch = value.match(/^data:([^;,]+);base64,(.*)$/i);

  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1].toLowerCase();
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) return null;
    return dataUrlMatch[2];
  }

  return value;
}

function logSafeInput(mode: "user" | "internal", imageUrl: string) {
  try {
    const parsed = new URL(imageUrl);
    const pathnameParts = parsed.pathname.split("/").filter(Boolean);
    const pathname = pathnameParts.length ? `/${pathnameParts.slice(0, 2).join("/")}` : "/";
    console.info("[REMOVE_BG_INPUT]", {
      mode,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname,
    });
  } catch {
    console.info("[REMOVE_BG_INPUT]", {
      mode,
      protocol: "invalid",
      hostname: "invalid",
      pathname: "invalid",
    });
  }
}

export async function POST(req: Request) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isInternalRequest = hasValidInternalSecret(req);
  const isInternalHeaderPresent = Boolean(req.headers.get("x-ai-internal-secret"));

  if (!user && !isInternalRequest) {
    if (isInternalHeaderPresent && !hasConfiguredInternalSecret()) {
      return jsonError("AI_INTERNAL_SECRET obrigatoria", 500);
    }
    return jsonError("Unauthorized", 401);
  }

  console.info("[REMOVE_BG_AUTH]", {
    mode: user ? "user" : "internal",
  });

  try {
    try {
      if (user) {
        const rateLimit = await removeBackgroundRateLimiter.limit(`${user.id}:${getTrustedRequestIp(req)}`);
        if (!rateLimit.success) {
          return jsonError("Too many remove background requests", 429);
        }
      }
    } catch (error) {
      console.error("[remove-background:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
      return jsonError("Remove background service is temporarily unavailable", 503);
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);

    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return jsonError("Payload demasiado grande", 413);
    }

    const rawBody = await req.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return jsonError("Payload demasiado grande", 413);
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonError("JSON invalido", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Payload invalido", 400);
    }

    const record = body as Record<string, unknown>;
    const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";
    const imageBase64 = typeof record.imageBase64 === "string" ? record.imageBase64.trim() : "";
    const requestMode: "user" | "internal" = user ? "user" : "internal";

    if (!imageUrl && !imageBase64) {
      return jsonError("Image URL ou imageBase64 obrigatoria", 400);
    }

    if (imageUrl && imageBase64) {
      return jsonError("Envia apenas imageUrl ou imageBase64", 400);
    }

    if (Object.keys(record).some((key) => key !== "imageUrl" && key !== "imageBase64")) {
      return jsonError("Payload invalido", 400);
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return jsonError("REMOVE_BG_API_KEY obrigatoria", 500);
    }

    const formData = new FormData();

    if (imageBase64) {
      const normalizedBase64 = normalizeBase64(imageBase64);

      if (!normalizedBase64 || !/^[A-Za-z0-9+/=\s]+$/.test(normalizedBase64)) {
        return jsonError("imageBase64 invalida", 400);
      }

      const imageBuffer = Buffer.from(normalizedBase64, "base64");

      if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES || !isSupportedImage(imageBuffer)) {
        return jsonError("imageBase64 invalida", 400);
      }

      await assertSafeDimensions(imageBuffer);

      formData.append(
        "image_file",
        new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }),
        "image.png",
      );
    } else {
      if (imageUrl.length > 2048) {
        return jsonError("imageUrl invalida", 400);
      }

      logSafeInput(requestMode, imageUrl);

      let safeUrl: string;

      try {
        const extraAllowedHosts = requestMode === "internal" ? ["replicate.delivery"] : [];
        safeUrl = await validateSafeRemoteImageUrl(imageUrl, 0, extraAllowedHosts);
      } catch {
        return jsonError("imageUrl invalida", 400);
      }

      formData.append("image_url", safeUrl);
    }

    formData.append("size", "auto");
    formData.append("format", "png");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error("REMOVE_BG_TIMEOUT")), REMOVE_BG_TIMEOUT_MS);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    if (!response.ok) {
      const text = (await response.text()).slice(0, 1000);
      console.error("[AI_REMOVE_BG_FAILED]", {
        status: response.status,
        responseBodySafe: text,
      });
      return NextResponse.json(
        {
          error: "Erro remove.bg",
          details: text,
        },
        { status: response.status },
      );
    }

    const inputBuffer = Buffer.from(await response.arrayBuffer());

    if (!inputBuffer.length || inputBuffer.length > MAX_OUTPUT_BYTES) {
      return jsonError("remove.bg devolveu imagem invalida", 500);
    }

    const trimmedBuffer = await sharp(inputBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
      .trim({
        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0,
        },
        threshold: 5,
      })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(trimmedBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("REMOVE BACKGROUND ERROR:", {
      message: err instanceof Error ? err.message : "Unknown error",
      name: err instanceof Error ? err.name : null,
    });

    return NextResponse.json(
      {
        error: "Erro interno",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
