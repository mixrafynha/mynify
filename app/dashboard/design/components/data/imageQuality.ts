export type ImageQualityResult = {
  ok: boolean;
  width: number;
  height: number;
  megapixels: number;
  estimatedDpiAt12Inch: number;
  estimatedDpiAt4Inch: number;
  label: "ULTRA" | "PRO" | "GOOD" | "LOW";
  message: string;
};

export const PRINT_IMAGE_LIMITS = {
  maxFileSize: 80 * 1024 * 1024,
  minShortSide: 2000,
  recommendedShortSide: 4096,
  ultraShortSide: 8192,
  minMegapixels: 4,
  recommendedMegapixels: 16,
  ultraMegapixels: 48,
  targetPrintDpi: 300,
  metadataDpiTarget: 2000,
  printReferenceInches: 12,
};

export const AI_IMAGE_QUALITY = {
  mode: "ultra-print",
  requestedSize: "8192x8192",
  fallbackSize: "4096x4096",
  minOutputPixels: 4096,
  targetOutputPixels: 8192,
  dpi: 300,
  metadataDpi: 2000,
  transparent: true,
  format: "png",
  compression: "lossless",
};

export function bytesToMb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function estimateDpi(shortSidePx: number, inches: number) {
  return Math.round(shortSidePx / inches);
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };

    img.src = url;
  });
}

export async function validatePrintImage(file: File): Promise<ImageQualityResult> {
  const { width, height } = await readImageDimensions(file);
  const shortSide = Math.min(width, height);
  const megapixels = Math.round(((width * height) / 1_000_000) * 10) / 10;
  const estimatedDpiAt12Inch = estimateDpi(shortSide, PRINT_IMAGE_LIMITS.printReferenceInches);
  const estimatedDpiAt4Inch = estimateDpi(shortSide, 4);

  let label: ImageQualityResult["label"] = "LOW";
  let ok = false;

  if (shortSide >= PRINT_IMAGE_LIMITS.ultraShortSide && megapixels >= PRINT_IMAGE_LIMITS.ultraMegapixels) {
    label = "ULTRA";
    ok = true;
  } else if (shortSide >= PRINT_IMAGE_LIMITS.recommendedShortSide && megapixels >= PRINT_IMAGE_LIMITS.recommendedMegapixels) {
    label = "PRO";
    ok = true;
  } else if (shortSide >= PRINT_IMAGE_LIMITS.minShortSide && megapixels >= PRINT_IMAGE_LIMITS.minMegapixels) {
    label = "GOOD";
    ok = true;
  }

  const message = ok
    ? `${label} • ${width}×${height}px • ${megapixels}MP • ${estimatedDpiAt12Inch} DPI at 12in print`
    : `Imagem fraca para impressão: ${width}×${height}px. Usa mínimo 2000px no lado menor, recomendado 4096px+.`;

  return { ok, width, height, megapixels, estimatedDpiAt12Inch, estimatedDpiAt4Inch, label, message };
}
