import { createHash } from "node:crypto";
import sharp, { type Metadata } from "sharp";

export const MAX_CHECKOUT_THUMBNAIL_BODY_BYTES = 12 * 1024 * 1024;
export const MAX_CHECKOUT_THUMBNAIL_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_CHECKOUT_THUMBNAIL_DIMENSION = 4096;
export const MAX_CHECKOUT_THUMBNAIL_PIXELS = 16_000_000;

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ThumbnailSide = "front" | "back";
export type CheckoutThumbnailBody = { dataUrl: string; userProductId: string; side: ThumbnailSide };
export type ProcessedThumbnail = {
  buffer: Buffer;
  decodedBytes: number;
  declaredMimeType: string;
  format: "png" | "jpeg" | "webp";
  width: number;
  height: number;
};

export class CheckoutThumbnailError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = "CheckoutThumbnailError";
  }
}

function normalizedMimeType(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

function mimeTypeForFormat(format: string) {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

export async function readCheckoutThumbnailBody(req: Request, maxBytes = MAX_CHECKOUT_THUMBNAIL_BODY_BYTES) {
  const contentLength = req.headers.get("content-length");
  const declaredLength = contentLength === null ? null : Number(contentLength);
  if (declaredLength !== null && Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new CheckoutThumbnailError(413, "BODY_TOO_LARGE", "Request body too large");
  }
  if (!req.body) return "";

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new CheckoutThumbnailError(413, "BODY_TOO_LARGE", "Request body too large");
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } finally {
    reader.releaseLock();
  }
  return chunks.join("");
}

export function parseCheckoutThumbnailBody(rawBody: string): CheckoutThumbnailBody {
  let value: unknown;
  try {
    value = JSON.parse(rawBody || "{}");
  } catch {
    throw new CheckoutThumbnailError(400, "INVALID_JSON", "Invalid JSON body");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CheckoutThumbnailError(400, "INVALID_PAYLOAD", "Invalid request body");
  }
  const body = value as Record<string, unknown>;
  const userProductId = typeof body.userProductId === "string" ? body.userProductId.trim() : "";
  if (!UUID_PATTERN.test(userProductId)) {
    throw new CheckoutThumbnailError(400, "INVALID_USER_PRODUCT_ID", "Valid userProductId is required");
  }
  const sideValue = typeof body.side === "string" ? body.side.trim().toLowerCase() : "front";
  if (sideValue !== "front" && sideValue !== "back") {
    throw new CheckoutThumbnailError(400, "INVALID_SIDE", "Thumbnail side must be front or back");
  }
  if (typeof body.dataUrl !== "string" || !body.dataUrl) {
    throw new CheckoutThumbnailError(400, "INVALID_IMAGE_DATA", "Image data is required");
  }
  return { dataUrl: body.dataUrl, userProductId, side: sideValue };
}

export function decodeCheckoutThumbnailDataUrl(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex <= 0) {
    throw new CheckoutThumbnailError(400, "INVALID_IMAGE_DATA", "Invalid image data URL");
  }
  const headerMatch = /^data:(image\/(?:png|jpe?g|webp));base64$/i.exec(dataUrl.slice(0, commaIndex));
  if (!headerMatch) {
    throw new CheckoutThumbnailError(400, "UNSUPPORTED_IMAGE_TYPE", "Unsupported thumbnail image type");
  }
  const declaredMimeType = normalizedMimeType(headerMatch[1]);
  if (!ALLOWED_MIME_TYPES.has(declaredMimeType)) {
    throw new CheckoutThumbnailError(400, "UNSUPPORTED_IMAGE_TYPE", "Unsupported thumbnail image type");
  }
  const base64 = dataUrl.slice(commaIndex + 1);
  if (!base64 || base64.length % 4 !== 0) {
    throw new CheckoutThumbnailError(400, "INVALID_BASE64", "Invalid base64 image data");
  }
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const estimatedBytes = (base64.length / 4) * 3 - padding;
  if (estimatedBytes <= 0 || estimatedBytes > MAX_CHECKOUT_THUMBNAIL_IMAGE_BYTES) {
    throw new CheckoutThumbnailError(413, "IMAGE_TOO_LARGE", "Thumbnail exceeds the 8 MB limit");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new CheckoutThumbnailError(400, "INVALID_BASE64", "Invalid base64 image data");
  }
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length !== estimatedBytes) {
    throw new CheckoutThumbnailError(400, "INVALID_BASE64", "Invalid base64 image data");
  }
  if (buffer.length > MAX_CHECKOUT_THUMBNAIL_IMAGE_BYTES) {
    throw new CheckoutThumbnailError(413, "IMAGE_TOO_LARGE", "Thumbnail exceeds the 8 MB limit");
  }
  return { buffer, declaredMimeType, decodedBytes: buffer.length };
}

export function assertCheckoutThumbnailMetadata(
  metadata: Pick<Metadata, "format" | "width" | "height" | "pages">,
  declaredMimeType: string,
) {
  const { format, width, height, pages } = metadata;
  if (!format || !width || !height) {
    throw new CheckoutThumbnailError(400, "INVALID_IMAGE", "Invalid thumbnail image content");
  }
  const actualMimeType = mimeTypeForFormat(format);
  if (!ALLOWED_MIME_TYPES.has(actualMimeType) || actualMimeType !== declaredMimeType) {
    throw new CheckoutThumbnailError(400, "IMAGE_TYPE_MISMATCH", "Thumbnail type does not match its content");
  }
  if ((pages ?? 1) > 1) {
    throw new CheckoutThumbnailError(400, "ANIMATED_IMAGE_NOT_ALLOWED", "Animated thumbnails are not supported");
  }
  if (
    width > MAX_CHECKOUT_THUMBNAIL_DIMENSION ||
    height > MAX_CHECKOUT_THUMBNAIL_DIMENSION ||
    width * height > MAX_CHECKOUT_THUMBNAIL_PIXELS
  ) {
    throw new CheckoutThumbnailError(413, "IMAGE_DIMENSIONS_TOO_LARGE", "Thumbnail dimensions are too large");
  }
  return { format: format as "png" | "jpeg" | "webp", width, height };
}

export async function processCheckoutThumbnailDataUrl(dataUrl: string): Promise<ProcessedThumbnail> {
  const decoded = decodeCheckoutThumbnailDataUrl(dataUrl);
  try {
    const image = sharp(decoded.buffer, {
      failOn: "error",
      limitInputPixels: MAX_CHECKOUT_THUMBNAIL_PIXELS,
      animated: false,
    });
    const dimensions = assertCheckoutThumbnailMetadata(await image.metadata(), decoded.declaredMimeType);
    const output = await image.webp({ quality: 84, effort: 2 }).toBuffer({ resolveWithObject: true });
    if (output.info.format !== "webp" || !output.data.length) {
      throw new CheckoutThumbnailError(500, "IMAGE_ENCODING_FAILED", "Unable to encode thumbnail");
    }
    return {
      buffer: output.data,
      decodedBytes: decoded.decodedBytes,
      declaredMimeType: decoded.declaredMimeType,
      ...dimensions,
    };
  } catch (error) {
    if (error instanceof CheckoutThumbnailError) throw error;
    throw new CheckoutThumbnailError(400, "INVALID_IMAGE", "Invalid thumbnail image content");
  }
}

function safeKeyPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
}

export function checkoutThumbnailKey(userId: string, userProductId: string, side: ThumbnailSide) {
  const userKey = createHash("sha256").update(userId).digest("hex").slice(0, 24);
  return `users/${userKey}/checkout-thumbnails/${safeKeyPart(userProductId)}-${side}.webp`;
}

export type CheckoutThumbnailPipelineDependencies<AuthContext, OwnedProduct> = {
  authenticate: (req: Request) => Promise<AuthContext | null>;
  authenticatedUserId: (auth: AuthContext) => string;
  rateLimit: (identifier: string) => Promise<{ success: boolean }>;
  requestIp: (req: Request) => string;
  loadOwnedProduct: (auth: AuthContext, userProductId: string) => Promise<OwnedProduct | null>;
  processImage: (dataUrl: string) => Promise<ProcessedThumbnail>;
  upload: (args: { key: string; buffer: Buffer; contentType: "image/webp" }) => Promise<{ url: string | null }>;
  persist: (args: {
    auth: AuthContext;
    ownedProduct: OwnedProduct;
    userProductId: string;
    side: ThumbnailSide;
    url: string;
  }) => Promise<void>;
};

export function createCheckoutThumbnailPipeline<AuthContext, OwnedProduct>(
  dependencies: CheckoutThumbnailPipelineDependencies<AuthContext, OwnedProduct>,
) {
  return async (req: Request) => {
    // Security order: bounded bytes, auth, limiter, schema, ownership,
    // decode/Sharp, R2, then database persistence.
    const rawBody = await readCheckoutThumbnailBody(req);
    const auth = await dependencies.authenticate(req);
    if (!auth) throw new CheckoutThumbnailError(401, "UNAUTHENTICATED", "User not authenticated");

    const userId = dependencies.authenticatedUserId(auth);
    try {
      const rateLimit = await dependencies.rateLimit(`${userId}:${dependencies.requestIp(req)}`);
      if (!rateLimit.success) {
        throw new CheckoutThumbnailError(429, "RATE_LIMITED", "Too many thumbnail uploads");
      }
    } catch (error) {
      if (error instanceof CheckoutThumbnailError) throw error;
      throw new CheckoutThumbnailError(503, "RATE_LIMIT_UNAVAILABLE", "Thumbnail upload service is temporarily unavailable");
    }

    const body = parseCheckoutThumbnailBody(rawBody);
    const ownedProduct = await dependencies.loadOwnedProduct(auth, body.userProductId);
    if (!ownedProduct) {
      throw new CheckoutThumbnailError(404, "USER_PRODUCT_NOT_FOUND", "Saved design not found");
    }

    const processed = await dependencies.processImage(body.dataUrl);
    const key = checkoutThumbnailKey(userId, body.userProductId, body.side);
    const uploaded = await dependencies.upload({ key, buffer: processed.buffer, contentType: "image/webp" });
    if (!uploaded.url) {
      throw new CheckoutThumbnailError(502, "R2_UPLOAD_FAILED", "Thumbnail upload failed");
    }
    await dependencies.persist({ auth, ownedProduct, userProductId: body.userProductId, side: body.side, url: uploaded.url });

    return {
      status: 200,
      body: {
        ok: true,
        side: body.side,
        url: uploaded.url,
        savedPath: body.side === "front" ? "mockups.checkout_thumbnail_url" : "mockups.checkout_thumbnail_back_url",
        urlPresent: true,
      },
      audit: {
        userId,
        userProductId: body.userProductId,
        side: body.side,
        format: processed.format,
        width: processed.width,
        height: processed.height,
        decodedBytes: processed.decodedBytes,
      },
    };
  };
}
