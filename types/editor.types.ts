export type ElementType = {
  id: string;
  type: "image" | "text" | "shape";
  src?: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  meta?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
  };
};