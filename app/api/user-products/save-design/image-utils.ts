export type DesignSide = "front" | "back";
export type DesignAssetKind = "print" | "mockups" | "editor";

export type DataImage = {
  buffer: Buffer;
  mimeType: string;
  extension: "png" | "webp" | "jpg";
};

export function isDataImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(png|webp|jpeg|jpg);base64,/i.test(value)
  );
}

export function dataUrlToBuffer(dataUrl: string): DataImage {
  const match = dataUrl.match(
    /^data:(image\/(?:png|webp|jpeg|jpg));base64,(.+)$/i,
  );

  if (!match) {
    throw new Error("Invalid image data URL");
  }

  const mimeType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");

  return { buffer, mimeType, extension };
}

export function cleanDataUrls(value: unknown): unknown {
  if (typeof value === "string") {
    return isDataImage(value) ? null : value;
  }

  if (Array.isArray(value)) {
    return value.map(cleanDataUrls);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    output[key] = cleanDataUrls(item);
  });

  return output;
}

export function sideValue(value: unknown, side: DesignSide): unknown {
  if (!value) return null;
  if (typeof value === "string") return side === "front" ? value : null;
  if (typeof value === "object") {
    return (value as Record<string, unknown>)[side] ?? null;
  }

  return null;
}

export function buildR2DesignKey(args: {
  userId: string;
  designId: string;
  kind: DesignAssetKind;
  side: DesignSide;
  extension: string;
}) {
  return [
    "users",
    args.userId,
    args.designId,
    args.kind,
    `${args.side}.${args.extension}`,
  ].join("/");
}
