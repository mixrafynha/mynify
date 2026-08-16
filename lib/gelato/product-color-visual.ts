import { normalizeGelatoColorData, type GelatoNormalizedColor } from "./color-normalizer";

export type ProductColorVisualKind = "solid" | "gradient" | "multicolor" | "unknown";

export type ProductColorVisual = {
  kind: ProductColorVisualKind;
  name: string | null;
  gelatoColorKey: string | null;
  cssBackground: string | null;
  hex: string | null;
  rgb: { r: number; g: number; b: number } | null;
  source: "gelato" | "legacy" | "fallback";
  currentHex: string | null;
  migrationHex: string | null;
  hexes: string[];
  gelatoColorData: GelatoNormalizedColor | null;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeHex(value: unknown): string | null {
  const text = cleanString(value);
  if (!text) return null;
  const match = text.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;
  const hex = match[1].toUpperCase();
  if (hex.length === 3 || hex.length === 6 || hex.length === 8) return `#${hex}`;
  return null;
}

function rgbToCss(rgb: { r: number; g: number; b: number }) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readFirstString(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return null;
}

function readExplicitCssBackground(raw: Record<string, unknown> | null) {
  if (!raw) return null;
  const candidate = readFirstString(
    raw.cssBackground,
    raw.css_background,
    raw.background,
    raw.backgroundColor,
    raw.background_color,
    raw.visualBackground,
    raw.visual_background,
  );
  return candidate && /gradient\(|rgb\(|rgba\(|#([0-9a-f]{3,8})/i.test(candidate)
    ? candidate
    : null;
}

function hasExplicitCompositeEvidence(data: GelatoNormalizedColor) {
  const raw = data.rawColorData && isPlainObject(data.rawColorData) ? data.rawColorData : null;
  const rawText = JSON.stringify(raw ?? {});
  return Boolean(
    /linear-gradient\(/i.test(rawText) ||
    /gradient/i.test(readFirstString(
      raw?.kind,
      raw?.type,
      raw?.colorType,
      raw?.visualType,
      data.dimensions.raw,
    ) ?? "") ||
    data.type === "multitone" ||
    data.type === "pattern"
  );
}

function resolveSolidLikeVisual(data: GelatoNormalizedColor, raw: Record<string, unknown> | null): ProductColorVisual {
  const explicitHex = normalizeHex(
    readFirstString(
      raw?.currentHex,
      raw?.current_hex,
      data.dimensions.currentHex,
      raw?.colorHex,
      raw?.color_hex,
      data.primaryHex,
      data.hexes[0],
    ),
  );
  const explicitRgb = data.rgb;
  const cssBackground = readExplicitCssBackground(raw) || explicitHex || (explicitRgb ? rgbToCss(explicitRgb) : null);

  return {
    kind: "solid",
    name: data.label,
    gelatoColorKey: data.attributeValueUid,
    cssBackground,
    hex: explicitHex,
    rgb: explicitRgb,
    source: raw ? "gelato" : "legacy",
    currentHex: data.dimensions.currentHex,
    migrationHex: data.dimensions.migrationHex,
    hexes: data.hexes,
    gelatoColorData: data,
  };
}

function resolveCompositeVisual(data: GelatoNormalizedColor, raw: Record<string, unknown> | null): ProductColorVisual {
  const cssBackground = readExplicitCssBackground(raw);
  return {
    kind: "gradient",
    name: data.label,
    gelatoColorKey: data.attributeValueUid,
    cssBackground: cssBackground || null,
    hex: null,
    rgb: null,
    source: "gelato",
    currentHex: data.dimensions.currentHex,
    migrationHex: data.dimensions.migrationHex,
    hexes: data.hexes,
    gelatoColorData: data,
  };
}

export function resolveProductColorVisual(input: {
  color?: unknown;
  colorName?: unknown;
  colorHex?: unknown;
  gelatoColorKey?: unknown;
  gelatoAttributes?: unknown;
  gelatoColorData?: unknown;
}) : ProductColorVisual {
  const rawAttributes = isPlainObject(input.gelatoAttributes) ? input.gelatoAttributes : null;
  const rawColorData = input.gelatoColorData;
  const normalized = normalizeGelatoColorData(
    rawColorData ??
      rawAttributes?.gelato_color_data ??
      rawAttributes?.gelatoColorData ??
      rawAttributes ??
      {},
  );
  const raw = isPlainObject(rawColorData) ? rawColorData : rawAttributes;
  const explicitCss = readExplicitCssBackground(raw);

  if (explicitCss && /gradient\(/i.test(explicitCss)) {
    return {
      kind: "gradient",
      name: normalized.label ?? cleanString(input.colorName) ?? cleanString(input.color) ?? null,
      gelatoColorKey: cleanString(input.gelatoColorKey) ?? normalized.attributeValueUid,
      cssBackground: explicitCss,
      hex: null,
      rgb: null,
      source: "gelato",
      currentHex: normalized.dimensions.currentHex,
      migrationHex: normalized.dimensions.migrationHex,
      hexes: normalized.hexes,
      gelatoColorData: normalized,
    };
  }

  if (hasExplicitCompositeEvidence(normalized)) {
    return resolveCompositeVisual(normalized, raw);
  }

  return resolveSolidLikeVisual(normalized, raw);
}

