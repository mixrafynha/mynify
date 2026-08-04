const TEXT_SAFE_PADDING_X_RATIO = 0.12;
const TEXT_SAFE_PADDING_Y_RATIO = 0.08;

export function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getTextPadding(fontSize: number, meta: Record<string, any> = {}) {
  const paddingX = finiteNumber(meta.paddingX, Math.ceil(fontSize * TEXT_SAFE_PADDING_X_RATIO));
  const paddingY = finiteNumber(meta.paddingY, Math.ceil(fontSize * TEXT_SAFE_PADDING_Y_RATIO));
  const strokeWidth = Math.max(0, finiteNumber(meta.strokeWidth, 0));
  const effectPadding = meta.shadow || meta.glow ? Math.ceil(fontSize * 0.04) : 0;

  return {
    x: Math.max(2, Math.round(paddingX + strokeWidth + effectPadding)),
    y: Math.max(2, Math.round(paddingY + strokeWidth + effectPadding)),
  };
}
