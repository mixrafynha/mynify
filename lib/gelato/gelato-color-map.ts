export const GELATO_COLOR_HEX_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#111111",
  ash: "#B7B7B7",
  azalea: "#EFA6C8",
  "cardinal-red": "#8A1538",
  "carolina-blue": "#7BAFD4",
  daisy: "#F4D942",
  "dark-heather": "#3F4448",
  "forest-green": "#1F4D36",
  garnet: "#6F263D",
  gold: "#F2B705",
  "graphite-heather": "#555B5E",
  heliconia: "#DB3E78",
  "irish-green": "#00A86B",
  kiwi: "#8DB600",
  "light-blue": "#A7C7E7",
  "light-pink": "#F6C1D0",
  maroon: "#7F1D1D",
  "military-green": "#4B5320",
  natural: "#E8DFCA",
  navy: "#1F2A44",
  orange: "#F97316",
  red: "#DC2626",
  sand: "#CBB994",
  "sport-grey": "#A7A9AC",
};

function normalizeGelatoColorKey(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidNonPlaceholderHex(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return false;
  return !["#ccc", "#cccccc", "#c0c0c0"].includes(normalized);
}

export function resolveGelatoColorHex({
  colorKey,
  colorName,
  gelatoHex,
}: {
  colorKey?: unknown;
  colorName?: unknown;
  gelatoHex?: unknown;
}): string {
  if (isValidNonPlaceholderHex(gelatoHex)) return gelatoHex.trim().toUpperCase();

  const normalizedColorKey = normalizeGelatoColorKey(colorKey);
  if (normalizedColorKey && GELATO_COLOR_HEX_MAP[normalizedColorKey]) {
    return GELATO_COLOR_HEX_MAP[normalizedColorKey];
  }

  const normalizedColorName = normalizeGelatoColorKey(colorName);
  if (normalizedColorName && GELATO_COLOR_HEX_MAP[normalizedColorName]) {
    return GELATO_COLOR_HEX_MAP[normalizedColorName];
  }

  return "#9CA3AF";
}
