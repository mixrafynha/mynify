export type EditorSide = "front" | "back";

export interface TopBarProps {
  productId?: string;
  category?: string;
  side: EditorSide;
  setSide: (side: EditorSide) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onSaveDesign: () => Promise<void> | void;
  onPreviewDesign?: () => Promise<void> | void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRevert?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  saving?: boolean;
  elements: any[];
  frontElements?: any[];
  backElements?: any[];
  mockupColor?: string;
}

export interface PreviewPayloadInput {
  productId?: string;
  category?: string;
  side: EditorSide;
  elements: any[];
  frontElements?: any[];
  backElements?: any[];
  mockupColor: string;
  color?: string;
  printBox?: any;
  safeArea?: any;
  designImage?: string | null;
  designImages?: Partial<Record<EditorSide, string | null>>;
  mockupMode?: "on_model_ai" | "product_flat" | string;
  modelMockup?: boolean;
}
