type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type GelatoRgb = { r: number; g: number; b: number };

export type GelatoNormalizedColor = {
  source: "gelato";
  attributeUid: string | null;
  attributeValueUid: string | null;
  label: string | null;
  type: "solid" | "heather" | "melange" | "blend" | "multitone" | "pattern" | "unknown";
  primaryHex: string | null;
  primaryHexSourceKey: string | null;
  hexes: string[];
  rgb: GelatoRgb | null;
  rgbs: GelatoRgb[];
  dimensions: {
    sourceKeys: string[];
    raw: JsonValue | null;
    currentHex: string | null;
    migrationHex: string | null;
  };
  rawColorData: JsonValue | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function normalizeHex(value: unknown): string | null {
  if (!isHexColor(value)) return null;
  return value.trim().toUpperCase();
}

function normalizeKey(value: unknown): string {
  return cleanString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "") ?? "";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(cleanString(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRgbCandidate(value: unknown): GelatoRgb | null {
  if (!isPlainObject(value)) return null;
  const r = toNumber(value.r ?? value.red);
  const g = toNumber(value.g ?? value.green);
  const b = toNumber(value.b ?? value.blue);
  if (r === null || g === null || b === null) return null;
  return { r, g, b };
}

function inferColorType(label: string | null, raw: Record<string, unknown>): GelatoNormalizedColor["type"] {
  const joined = [label, raw.colorType, raw.type, raw.kind]
    .map((value) => cleanString(value))
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  if (joined.includes("heather")) return "heather";
  if (joined.includes("melange")) return "melange";
  if (joined.includes("blend") || joined.includes("triblend")) return "blend";
  if (joined.includes("multi") || joined.includes("two-tone") || joined.includes("tint")) return "multitone";
  if (joined.includes("pattern") || joined.includes("swatch")) return "pattern";
  if (joined.includes("solid")) return "solid";
  return "unknown";
}

function collectHexes(value: unknown, output: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectHexes(item, output);
    return output;
  }

  if (!isPlainObject(value)) {
    const hex = normalizeHex(value);
    if (hex) output.push(hex);
    return output;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (/hex/i.test(key) && normalizeHex(nested)) {
      output.push(normalizeHex(nested)!);
    } else if (/color|swatch|primary|secondary|foreground|background|tone|shade|pattern/i.test(key)) {
      collectHexes(nested, output);
    }
  }
  return output;
}

function collectRgbs(value: unknown, output: GelatoRgb[] = []): GelatoRgb[] {
  if (Array.isArray(value)) {
    for (const item of value) collectRgbs(item, output);
    return output;
  }

  const rgb = normalizeRgbCandidate(value);
  if (rgb) {
    output.push(rgb);
    return output;
  }

  if (!isPlainObject(value)) return output;
  for (const nested of Object.values(value)) {
    collectRgbs(nested, output);
  }
  return output;
}

function collectDimensions(raw: Record<string, unknown>) {
  const entries = Object.entries(raw).filter(([key]) => /color|hex/i.test(normalizeKey(key)));
  const sourceKeys = entries.map(([key]) => key);
  const rawDimensions = entries.length > 0 ? Object.fromEntries(entries) : null;
  const hexEntries = entries
    .map(([key, value]) => ({
      key,
      hex: normalizeHex(isPlainObject(value) ? value.value : value),
      raw: value,
    }))
    .filter((entry) => Boolean(entry.hex));

  const preferenceWeight = (key: string) => {
    const normalized = normalizeKey(key);
    if (normalized.includes("contentsshouldbecopiedtooriginalcolorhexcodeonceapparelv2migrationisfinished")) return 100;
    if (normalized === "colorhexcode") return 80;
    if (normalized.includes("colorhexcodetmpnew")) return 60;
    if (normalized.includes("colorhex")) return 50;
    return 10;
  };

  const ranked = [...hexEntries].sort((a, b) => preferenceWeight(b.key) - preferenceWeight(a.key));
  const explicitPrimary = ranked.find((entry) => {
    const key = normalizeKey(entry.key);
    return (
      key.includes("contentsshouldbecopiedtooriginalcolorhexcodeonceapparelv2migrationisfinished") ||
      (hexEntries.length === 1 && key.includes("colorhex"))
    );
  }) ?? null;
  const migration = hexEntries.find((entry) => normalizeKey(entry.key).includes("tmpnew"))
    ?? hexEntries.find((entry) => normalizeKey(entry.key).includes("contentsshouldbecopiedtooriginalcolorhexcodeonceapparelv2migrationisfinished"))
    ?? null;
  const current = hexEntries.find((entry) => normalizeKey(entry.key) === "colorhexcode") ?? null;
  const primary = explicitPrimary;

  return {
    sourceKeys,
    raw: rawDimensions as JsonValue | null,
    currentHex: current?.hex ?? null,
    migrationHex: migration?.hex ?? null,
    primaryHex: primary?.hex ?? null,
    primaryHexSourceKey: primary?.key ?? null,
    hexes: Array.from(new Set(hexEntries.map((entry) => entry.hex).filter(Boolean) as string[])),
  };
}

function findColorAttribute(raw: Record<string, unknown>) {
  const candidateKeys = [
    "GarmentColor",
    "Color",
    "Colour",
    "color",
    "colour",
    "attributeValueUid",
  ];
  for (const key of candidateKeys) {
    const value = cleanString(raw[key]);
    if (value) return { attributeUid: key, attributeValueUid: value, label: value };
  }

  for (const [key, value] of Object.entries(raw)) {
    if (!/(^|_)(color|colour)(_|$)/i.test(key)) continue;
    const cleaned = cleanString(value);
    if (cleaned) return { attributeUid: key, attributeValueUid: cleaned, label: cleaned };
  }

  return { attributeUid: null, attributeValueUid: null, label: null };
}

export function normalizeGelatoColorData(rawColorData: unknown): GelatoNormalizedColor {
  const rawObject = isPlainObject(rawColorData) ? rawColorData : null;
  const attribute = rawObject ? findColorAttribute(rawObject) : { attributeUid: null, attributeValueUid: null, label: null };
  const label = attribute.label;
  const dimensionsSource = rawObject && isPlainObject(rawObject.dimensions) ? (rawObject.dimensions as Record<string, unknown>) : null;
  const dimensions = dimensionsSource
    ? collectDimensions(dimensionsSource)
    : { sourceKeys: [], raw: null, currentHex: null, migrationHex: null, primaryHex: null, primaryHexSourceKey: null, hexes: [] };
  const hexes = Array.from(new Set([...dimensions.hexes, ...collectHexes(rawColorData).map((hex) => hex.toUpperCase())]));
  const rgbs = collectRgbs(rawColorData);
  const primaryHex = dimensions.primaryHex ?? null;

  return {
    source: "gelato",
    attributeUid: attribute.attributeUid,
    attributeValueUid: attribute.attributeValueUid,
    label,
    type: inferColorType(label, rawObject ?? {}),
    primaryHex,
    primaryHexSourceKey: dimensions.primaryHexSourceKey,
    hexes,
    rgb: rgbs[0] ?? null,
    rgbs,
    dimensions,
    rawColorData: rawColorData as JsonValue | null,
  };
}
