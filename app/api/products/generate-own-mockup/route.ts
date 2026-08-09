import sharp from "sharp";
import { FALLBACK_PRINT_BOX } from "./config";
import { findMockupFile } from "./assets";
import { json, normalizeBox, normalizeCategory, normalizeSide } from "./utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
const MAX_DESIGN_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 4096;
const MAX_IMAGE_PIXELS = 16_000_000;
const MAX_ELEMENTS = 100;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type RequestBody = Record<string, any>;

class MockupRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function readLimitedJson(req: Request): Promise<RequestBody> {
  const contentLength = req.headers.get("content-length");
  const declaredLength = contentLength ? Number(contentLength) : null;

  if (
    declaredLength !== null &&
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_REQUEST_BYTES
  ) {
    throw new MockupRequestError("Request body too large.", 413);
  }

  if (!req.body) {
    return {};
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    if (!value) continue;

    received += value.byteLength;

    if (received > MAX_REQUEST_BYTES) {
      throw new MockupRequestError("Request body too large.", 413);
    }

    chunks.push(value);
  }

  const text = new TextDecoder().decode(Buffer.concat(chunks));

  try {
    const parsed = JSON.parse(text || "{}");

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new MockupRequestError("Invalid JSON body.", 400);
    }

    return parsed as RequestBody;
  } catch (error) {
    if (error instanceof MockupRequestError) throw error;
    throw new MockupRequestError("Invalid JSON body.", 400);
  }
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(1, Math.round(parsed));
}

function validateOutputArea(outputArea: { width: number; height: number }) {
  if (
    outputArea.width > MAX_IMAGE_DIMENSION ||
    outputArea.height > MAX_IMAGE_DIMENSION ||
    outputArea.width * outputArea.height > MAX_IMAGE_PIXELS
  ) {
    throw new MockupRequestError("Mockup output dimensions are too large.", 413);
  }
}

function hasValidMagicBytes(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/png") {
    return (
      buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length > 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

async function parseDesignImage(designImage: unknown) {
  if (typeof designImage !== "string") {
    throw new MockupRequestError("Missing designImage data URL.", 400);
  }

  const match = designImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/);

  if (!match) {
    throw new MockupRequestError("Missing designImage data URL.", 400);
  }

  const mimeType = match[1].toLowerCase();

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new MockupRequestError("Unsupported designImage format.", 415);
  }

  const base64 = match[2].replace(/\s/g, "");
  const estimatedBytes = Math.floor((base64.length * 3) / 4);

  if (estimatedBytes > MAX_DESIGN_IMAGE_BYTES) {
    throw new MockupRequestError("Design image is too large.", 413);
  }

  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length || buffer.length > MAX_DESIGN_IMAGE_BYTES) {
    throw new MockupRequestError("Design image is too large.", 413);
  }

  if (!hasValidMagicBytes(buffer, mimeType)) {
    throw new MockupRequestError("Invalid designImage content.", 415);
  }

  const metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (
    !width ||
    !height ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new MockupRequestError("Design image dimensions are too large.", 413);
  }

  return { buffer, mimeType, width, height };
}

export async function POST(req: Request) {
  try {
    const body = await readLimitedJson(req);

    const category = normalizeCategory(body.category || body.productType || "tshirt");
    const side = normalizeSide(body.side || "front");

    const designImage = body.designImage || body.garmentImage || body.image || null;
    const parsedDesignImage = await parseDesignImage(designImage);

    const outputArea = {
      width: parsePositiveInteger(
        body.mockupArea?.width || body.exportArea?.width || body.editorArea?.width,
        1024
      ),
      height: parsePositiveInteger(
        body.mockupArea?.height || body.exportArea?.height || body.editorArea?.height,
        1024
      ),
    };

    validateOutputArea(outputArea);

    const fallbackPrintBox = FALLBACK_PRINT_BOX[category]?.[side] || FALLBACK_PRINT_BOX.tshirt.front;
    const printBox = normalizeBox(body.printBox, fallbackPrintBox);
    const safeArea = normalizeBox(body.safeArea, printBox);
    const elementCount = Array.isArray(body.elements) ? body.elements.length : 0;

    if (elementCount > MAX_ELEMENTS) {
      throw new MockupRequestError("Too many elements in mockup request.", 413);
    }

    console.log("MOCKUP API RECEIVED", {
      productId: body.productId,
      category,
      side,
      hasDesignImage: true,
      designImageBytes: parsedDesignImage.buffer.length,
      designImageMimeType: parsedDesignImage.mimeType,
      designImageSize: {
        width: parsedDesignImage.width,
        height: parsedDesignImage.height,
      },
      elements: elementCount,
      renderMode: "designImage-only",
      printBox,
      safeArea,
      outputArea,
    });

    const mockupFile = await findMockupFile(category, side);

    const base = await sharp(mockupFile, { limitInputPixels: MAX_IMAGE_PIXELS })
      .resize({
        width: outputArea.width,
        height: outputArea.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const designLayer = await sharp(parsedDesignImage.buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
      .resize({
        width: outputArea.width,
        height: outputArea.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const elementLayer = null;

    if (elementCount) {
      console.log("ELEMENTS IGNORED BECAUSE DESIGN_IMAGE_IS_SOURCE_OF_TRUTH", {
        elements: elementCount,
      });
    }

    const compositeInputs: sharp.OverlayOptions[] = [
      { input: designLayer, left: 0, top: 0, blend: "over" },
    ];

    if (elementLayer) {
      compositeInputs.push({
        input: elementLayer,
        left: 0,
        top: 0,
        blend: "over",
      });
    }

    const finalBuffer = await sharp(base)
      .composite(compositeInputs)
      .png()
      .toBuffer();

    const localImage = `data:image/png;base64,${finalBuffer.toString("base64")}`;

    return json({
      success: true,
      provider: "server-png-composite-design-image-only",
      mockupImages: [localImage],
      imageUrls: [localImage],
      images: [localImage],
      imageUrl: localImage,
      mockupUrl: localImage,
      localGarmentImage: localImage,
      localMockupImages: [localImage],
      count: 1,
      isAi: false,
      debug: {
        category,
        side,
        mockupFile,
        printBox,
        safeArea,
        outputArea,
        hasElementLayer: Boolean(elementLayer),
        renderMode: "designImage-only",
        ignoredElements: elementCount,
        debugFiles: [],
      },
    });
  } catch (error: any) {
    if (error instanceof MockupRequestError) {
      return json({ success: false, error: error.message }, error.status);
    }

    console.error("OWN MOCKUP ERROR:", {
      message: error?.message,
    });

    return json(
      {
        success: false,
        error: error?.message || "Failed to generate mockup",
      },
      500
    );
  }
}
