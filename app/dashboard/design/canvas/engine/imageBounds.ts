import { clamp } from "../canvasMath";
import { type Rect } from "./bounds";

const MIN_SIZE = 30;
const MAX_SIZE = 2000;

export function resizeImageRect(args: {
  direction: string;
  start: Rect;
  dx: number;
  dy: number;
  safeArea: any;
}): Rect {
  const { direction, start, dx, dy } = args;
  const aspect = start.width / Math.max(1, start.height);

  let targetWidth = start.width;
  let targetHeight = start.height;

  if (direction.includes("r")) targetWidth = start.width + dx;
  if (direction.includes("l")) targetWidth = start.width - dx;
  if (direction.includes("b")) targetHeight = start.height + dy;
  if (direction.includes("t")) targetHeight = start.height - dy;

  const scaleX = targetWidth / Math.max(1, start.width);
  const scaleY = targetHeight / Math.max(1, start.height);
  const scale = direction.length === 1
    ? direction === "l" || direction === "r"
      ? scaleX
      : scaleY
    : Math.max(scaleX, scaleY);

  const width = clamp(start.width * scale, MIN_SIZE, MAX_SIZE);
  const height = clamp(width / aspect, MIN_SIZE, MAX_SIZE);
  const finalWidth = Math.round(height * aspect);
  const finalHeight = Math.round(height);

  const x = direction.includes("l") ? start.x + start.width - finalWidth : start.x;
  const y = direction.includes("t") ? start.y + start.height - finalHeight : start.y;

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: finalWidth,
    height: finalHeight,
  };
}
