export type RenderElementType = "image" | "text" | "shape" | string;

export type RenderElement = Record<string, any> & {
  id?: string;
  type?: RenderElementType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  src?: string;
  text?: string;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fill?: string;
  zIndex?: number;
  meta?: Record<string, any>;
};

export type ElementRendererProps = {
  el: RenderElement;
  isSelected?: boolean;
  editing?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  startEditing?: () => void;
  updateText?: (value: string) => void;
  setEditing?: (value: boolean) => void;
  /**
   * Browser/html-to-image capture needs CORS-aware image loading.
   * Server-side Playwright screenshots do not; forcing crossorigin from an
   * about:blank/null origin can make R2 reject otherwise public images.
   */
  imageCrossOrigin?: "anonymous" | false;
};

export type Box = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
