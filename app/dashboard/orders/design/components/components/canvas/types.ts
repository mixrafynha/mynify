export type ElementType = "image" | "text" | "shape" | "logo" | "sticker" | "template" | "svg" | "qr" | "barcode";

export type CanvasSide =
  | "front"
  | "back"
  | "left-sleeve"
  | "right-sleeve";

export type QualityLevel = "excellent" | "good" | "risk" | "poor";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseElementMeta {
  opacity?: number;
  flipX?: boolean;
  locked?: boolean;

  /** Production quality metadata shared by every element type. */
  originalWidth?: number;
  originalHeight?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  dpi?: number | null;
  effectiveDpi?: number | null;
  dpiQuality?: "excellent" | "good" | "risk" | "poor" | "vector" | "unknown";
  qualityStatus?: "Excellent" | "Good" | "Risk" | "Poor Print Quality" | "Unknown";
  printWidth?: number;
  printHeight?: number;
  printWidthMm?: number;
  printHeightMm?: number;
  printPhysicalWidthMm?: number;
  printPhysicalHeightMm?: number;
  printKind?: "raster" | "vector" | "text";
}

export interface ImageMeta extends BaseElementMeta {
  originalWidth?: number;
  originalHeight?: number;
  uploadedAt?: number;
}

export interface TextMeta extends BaseElementMeta {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  fill?: string;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right";
}

export interface ShapeMeta extends BaseElementMeta {
  color?: string;
}

export type ElementMeta = ImageMeta | TextMeta | ShapeMeta;

export interface DesignElement {
  id: string;

  type: ElementType;

  x: number;
  y: number;

  width: number;
  height: number;

  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  opacity?: number;
  flipX?: boolean;

  src?: string;

  text?: string;
  content?: string;
  fill?: string;

  fontFamily?: string;

  meta?: ElementMeta;
}

export interface DPIResult {
  dpi: number;
  quality: QualityLevel;
  recommendedWidthCm: number;
  recommendedHeightCm: number;
}

export interface WarningItem {
  id: string;

  type: "dpi" | "safe-area" | "overflow" | "text-size";

  severity: "warning" | "error";

  message: string;

  elementId?: string;
}

export interface GuideLine {
  id: string;

  type: "vertical" | "horizontal";

  points: number[];
}

export interface GuideConfig {
  showVertical: boolean;
  showHorizontal: boolean;
  verticalPosition?: number;
  horizontalPosition?: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides?: GuideConfig;
  snappedX?: boolean;
  snappedY?: boolean;
}

export interface QualityReport {
  score: number;

  level: QualityLevel;

  warnings: WarningItem[];
}

export interface PrintArea {
  printBox: Box;
  safeArea: Box;
}

export interface ProductCanvasConfig {
  productId: string;

  side: CanvasSide;

  width: number;
  height: number;

  printArea: PrintArea;
}