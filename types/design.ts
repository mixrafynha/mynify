export type DesignElement = {
  id: string;
  type: "image" | "text";

  x: number;
  y: number;

  src?: string;
  text?: string;

  width?: number;
  height?: number;

  fontSize?: number;
  fontFamily?: string;
  color?: string;
};