const TEXT_SAFE_PADDING_X_RATIO = 0.28;
const TEXT_SAFE_PADDING_Y_RATIO = 0.26;

export function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getTextPadding(fontSize: number, meta: Record<string, any> = {}) {
  const paddingX = finiteNumber(meta.paddingX, Math.ceil(fontSize * TEXT_SAFE_PADDING_X_RATIO));
  const paddingY = finiteNumber(meta.paddingY, Math.ceil(fontSize * TEXT_SAFE_PADDING_Y_RATIO));

  return {
    x: Math.max(4, Math.round(paddingX)),
    y: Math.max(4, Math.round(paddingY)),
  };
}
