export const PRINT_DPI = 400;
export const LOW_DPI_LIMIT = 300;

export type DpiMeta = {
  dpi: number;
  effectiveDpi?: number;
  minDpi?: number;
  targetDpi?: number;
  dpiStatus?: "excellent" | "good" | "low";
  dpiSource?: "vector" | "image" | "ai" | "upload" | "template" | "sticker" | "shape" | "unknown";
  vector?: boolean;
  transparent?: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  printWidthPx?: number;
  printHeightPx?: number;
  qualityMode?: string;
};

export function getDpiStatus(dpi: number) {
  if (dpi >= PRINT_DPI) return "excellent" as const;
  if (dpi >= LOW_DPI_LIMIT) return "good" as const;
  return "low" as const;
}

export function getDpiLabel(dpi?: number) {
  if (!dpi || !Number.isFinite(dpi)) return "DPI —";
  return `${Math.round(dpi)} DPI`;
}

export function vectorDpiMeta(source: DpiMeta["dpiSource"] = "vector", extra: Partial<DpiMeta> = {}): DpiMeta {
  return {
    dpi: PRINT_DPI,
    effectiveDpi: PRINT_DPI,
    minDpi: LOW_DPI_LIMIT,
    targetDpi: PRINT_DPI,
    dpiStatus: "excellent",
    dpiSource: source,
    vector: true,
    transparent: true,
    qualityMode: "vector-print-ready",
    ...extra,
  };
}

export function imageDpiMeta(item: any = {}, source: DpiMeta["dpiSource"] = "image", extra: Partial<DpiMeta> = {}): DpiMeta {
  const naturalWidth = Number(item.naturalWidth || item.width || item.printWidthPx || 4096);
  const naturalHeight = Number(item.naturalHeight || item.height || item.printHeightPx || 4096);
  const dpi = Number(item.dpi || item.effectiveDpi || item.metadataDpi || PRINT_DPI);
  return {
    dpi,
    effectiveDpi: dpi,
    minDpi: LOW_DPI_LIMIT,
    targetDpi: PRINT_DPI,
    dpiStatus: getDpiStatus(dpi),
    dpiSource: source,
    vector: false,
    transparent: item.transparent ?? true,
    naturalWidth,
    naturalHeight,
    printWidthPx: naturalWidth,
    printHeightPx: naturalHeight,
    qualityMode: dpi >= PRINT_DPI ? "print-ready-400dpi" : "needs-higher-dpi",
    ...extra,
  };
}

export function recalcDpiForElement(element: any, nextWidth?: number, nextHeight?: number) {
  const meta = element?.meta || {};
  if (meta.vector || element?.type === "text" || element?.type === "shape") {
    return vectorDpiMeta(meta.dpiSource || (element?.type === "text" ? "vector" : "shape"), meta);
  }

  const width = Math.max(1, Number(nextWidth ?? element?.width ?? 1));
  const height = Math.max(1, Number(nextHeight ?? element?.height ?? 1));
  const naturalWidth = Number(meta.naturalWidth || element?.naturalWidth || width);
  const naturalHeight = Number(meta.naturalHeight || element?.naturalHeight || height);
  const baseDpi = Number(meta.dpi || PRINT_DPI);
  const effectiveDpi = Math.max(1, Math.min((naturalWidth / width) * baseDpi, (naturalHeight / height) * baseDpi));

  return {
    ...meta,
    naturalWidth,
    naturalHeight,
    dpi: baseDpi,
    effectiveDpi: Math.round(effectiveDpi),
    minDpi: LOW_DPI_LIMIT,
    targetDpi: PRINT_DPI,
    dpiStatus: getDpiStatus(effectiveDpi),
    qualityMode: effectiveDpi >= PRINT_DPI ? "print-ready-400dpi" : "needs-higher-dpi",
  };
}
