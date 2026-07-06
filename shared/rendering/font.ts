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

export function resolveFontFamily(font?: string): string {
  if (!font) return "var(--font-poppins), Arial, sans-serif";
  return `${FONT_MAP[font] || `"${font}"`}, Arial, sans-serif`;
}

export function collectGoogleFontFamilies(elements: Array<Record<string, any>>) {
  const families = new Set<string>();

  for (const el of elements) {
    if (el?.type !== "text") continue;
    const family = String(el.meta?.fontFamily || el.fontFamily || "").trim();
    if (!family) continue;
    if (/^(arial|sans-serif|serif|monospace|system-ui)$/i.test(family)) continue;
    families.add(family.replace(/["']/g, ""));
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
