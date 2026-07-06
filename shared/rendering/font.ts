const FONT_MAP: Record<string, string> = {
  Anton: "var(--font-anton)",
  "Bebas Neue": "var(--font-bebas)",
  Orbitron: "var(--font-orbitron)",
  "Playfair Display": "var(--font-playfair)",
  Poppins: "var(--font-poppins)",
  Cinzel: "var(--font-cinzel)",
  "DM Serif Display": "var(--font-dm-serif)",
  "Space Grotesk": "var(--font-space)",
  "Rubik Mono One": "var(--font-rubik-mono)",
  "Black Ops One": "var(--font-black-ops)",
};

const SYSTEM_FONT_FAMILY_RE =
  /^(arial|helvetica|sans-serif|serif|monospace|system-ui|-apple-system|blinkmacsystemfont|ui-sans-serif|ui-serif|ui-monospace|inherit|initial|unset|inter)$/i;

export function resolveFontFamily(font?: string): string {
  if (!font) return "var(--font-poppins), Arial, sans-serif";
  return `${FONT_MAP[font] || `"${font}"`}, Arial, sans-serif`;
}

function stripCssQuotes(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function normalizeGoogleFontFamilyName(value: unknown): string | null {
  const family = stripCssQuotes(String(value || ""));
  if (!family) return null;

  const lower = family.toLowerCase();

  if (family.startsWith("__")) return null;
  if (lower.includes("fallback")) return null;
  if (lower.startsWith("var(")) return null;
  if (family.includes(",")) return null;
  if (SYSTEM_FONT_FAMILY_RE.test(family)) return null;

  return family.replace(/["']/g, "");
}

export function collectGoogleFontFamilies(elements: Array<Record<string, any>>) {
  const families = new Set<string>();

  for (const el of elements) {
    if (el?.type !== "text") continue;

    const family = normalizeGoogleFontFamilyName(
      el.meta?.fontFamily || el.fontFamily,
    );

    if (family) families.add(family);
  }

  return Array.from(families);
}

export function googleFontsLinks(elements: Array<Record<string, any>>) {
  const families = collectGoogleFontFamilies(elements);
  if (!families.length) return "";

  return families
    .map((family) => {
      const encoded = encodeURIComponent(family).replace(/%20/g, "+");
      return `<link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;
    })
    .join("\n");
}
