export type PreviewSide = "front" | "back";
export type PreviewStatus = "ready" | "needs_attention" | "production_risk";
export type PreviewRiskLevel = "low" | "medium" | "high";
export type PreviewWarningSeverity = "info" | "warning" | "danger";
export type PreviewWarningType = "LOW_DPI" | "OUTSIDE_PRINT_AREA" | "TRANSPARENT_ISSUES" | "SMALL_IMAGE" | "EXPORT_RISK" | "EMPTY_DESIGN";

export type PreviewWarning = {
  id: string;
  type: PreviewWarningType;
  title: string;
  message: string;
  severity: PreviewWarningSeverity;
  elementId?: string;
  side?: PreviewSide;
};

export type PreviewElement = {
  id: string;
  type: "image" | "text" | "shape" | string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex?: number;
  src?: string;
  imageWidth?: number;
  imageHeight?: number;
  originalWidth?: number;
  originalHeight?: number;
  text?: string;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  side?: PreviewSide;
  locked?: boolean;
  meta?: Record<string, any>;
};

export type PreviewBox = { x: number; y: number; width: number; height: number };
export type PreviewPrintSize = { widthMm: number; heightMm: number };
export type PreviewExportResolution = { width: number; height: number };

export type PreviewValidationResult = {
  status: PreviewStatus;
  statusLabel: string;
  dpi: number | null;
  warnings: PreviewWarning[];
  printReady: boolean;
  riskLevel: PreviewRiskLevel;
};

export type PreviewSideData = {
  side: PreviewSide;
  elements: PreviewElement[];
  mockupUrl: string;
  printBox: PreviewBox;
  safeArea: PreviewBox;
  printSize: PreviewPrintSize;
  exportResolution: PreviewExportResolution;
  validation: PreviewValidationResult;
};

export type ProductionPreviewData = {
  productId: string;
  category: string;
  activeSide: PreviewSide;
  mockupColor: string;
  front: PreviewSideData;
  back: PreviewSideData;
  current: PreviewSideData;
  combinedStatus: PreviewValidationResult;
};

export type ProductionPreviewInput = {
  productId?: string;
  category?: string;
  side: PreviewSide;
  elements?: PreviewElement[];
  frontElements?: PreviewElement[];
  backElements?: PreviewElement[];
  mockupColor?: string;
  color?: string;
  printBox?: PreviewBox | null;
  safeArea?: PreviewBox | null;
  designImage?: string | null;
  mockupMode?: "on_model_ai" | "product_flat" | string;
  modelMockup?: boolean;
};
