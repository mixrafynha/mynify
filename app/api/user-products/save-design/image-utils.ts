export type DesignSide = "front" | "back";
export type DesignAssetKind = "print" | "editor" | "mockups";

export type ParsedDataUrl = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  byteLength: number;
};

const MIME_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

function safePathPart(value: unknown) {
  return (
    String(value || "")
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .replace(/[^a-zA-Z0-9._=-]+/g, "-")
      .replace(/-+/g, "-") || "unknown"
  );
}

export function isDataImage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.startsWith("data:image/")) return false;

  const commaIndex = value.indexOf(",");
  if (commaIndex <= 0) return false;

  const header = value.slice(0, commaIndex).toLowerCase();
  return header.includes(";base64");
}

export function dataUrlToBuffer(dataUrl: unknown): ParsedDataUrl {
  if (!isDataImage(dataUrl)) {
    throw new Error("Invalid image data URL");
  }

  // Do not use String.match(), regex capture groups, spread, or atob() on the
  // full payload. 300 DPI production PNGs are large and those approaches can
  // trigger RangeError: Maximum call stack size exceeded in Node/Next.
  const commaIndex = dataUrl.indexOf(",");
  const header = dataUrl.slice(5, commaIndex); // image/png;base64
  const base64 = dataUrl.slice(commaIndex + 1);

  if (!base64) {
    throw new Error("Empty image data URL payload");
  }

  const mimeType = header.split(";")[0]?.toLowerCase() || "image/png";
  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unsupported data URL mime type: ${mimeType}`);
  }

  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) {
    throw new Error("Decoded image buffer is empty");
  }

  return {
    buffer,
    mimeType,
    extension: MIME_EXTENSION[mimeType] || "png",
    byteLength: buffer.length,
  };
}

export function buildR2DesignKey(args: {
  userId: string;
  designId: string;
  kind: DesignAssetKind;
  side: DesignSide;
  extension: string;
}) {
  const userId = safePathPart(args.userId);
  const designId = safePathPart(args.designId);
  const kind = safePathPart(args.kind);
  const side = safePathPart(args.side);
  const extension =
    safePathPart(args.extension || "png").replace(/^\.+/, "") || "png";

  return `users/${userId}/${designId}/${kind}/${side}.${extension}`;
}

export function sideValue<T = unknown>(value: unknown, side: DesignSide): T | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return sideValue<T>(JSON.parse(value), side);
    } catch {
      return null;
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const direct = record[side];
  if (direct !== undefined && direct !== null && direct !== "") {
    if (typeof direct === "object" && !Array.isArray(direct)) {
      const directRecord = direct as Record<string, unknown>;
      const nested =
        directRecord.url ??
        directRecord.publicUrl ??
        directRecord.href ??
        directRecord.dataUrl ??
        directRecord.dataURL ??
        directRecord.src;

      if (nested !== undefined && nested !== null && nested !== "") {
        return nested as T;
      }
    }

    return direct as T;
  }

  const upper = side === "front" ? "Front" : "Back";
  const aliases = [
    `${side}Url`,
    `${side}URL`,
    `${side}Image`,
    `${side}File`,
    `${side}DataUrl`,
    `${side}DataURL`,
    `print${upper}`,
    `printFile${upper}`,
    `mockup${upper}`,
    `mockupImage${upper}`,
    `editor${upper}`,
    `editorImage${upper}`,
  ];

  for (const key of aliases) {
    const candidate = record[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      return candidate as T;
    }
  }

  return null;
}

export function cleanDataUrls<T>(value: T): T {
  if (isDataImage(value)) return null as T;

  if (Array.isArray(value)) {
    return value.map((item) => cleanDataUrls(item)) as T;
  }

  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] = cleanDataUrls(child);
  }

  return output as T;
}
