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

export type SelectedProductVariant = {
  variantId?: string | null;
  productColorId?: string | null;
  colorId?: string | null;
  size?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  sku?: string | null;
  price?: number | string | null;
  variantPrice?: number | string | null;
  image?: string | null;
  imageUrl?: string | null;
};

export interface PreviewPayloadInput {
  productId?: string;
  category?: string;
  side: EditorSide;
  elements: any[];
  frontElements?: any[];
  backElements?: any[];
  mockupColor: string;
  color?: string;
  variantId?: string | null;
  selectedVariant?: SelectedProductVariant | null;
  printBox?: any;
  safeArea?: any;
  designImage?: string | null;
  designImages?: Partial<Record<EditorSide, string | null>>;
  mockupMode?: "on_model_ai" | "product_flat" | string;
  modelMockup?: boolean;
}
