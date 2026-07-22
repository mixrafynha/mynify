const assetCache = new Map<string, string>();
const stickerRequestCache = new Map<string, Promise<string>>();

function encodeSvg(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function createTextAsset(value: string, color: string, fontFamily: string, emoji: boolean) {
  const cacheKey = `${emoji ? "emoji" : "shape"}|${value}|${color}|${fontFamily}`;
  const cached = assetCache.get(cacheKey);
  if (cached) return cached;
  const fontSize = emoji ? 960 : value.length > 2 ? 720 : 820;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 1024 1024"><text x="512" y="512" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="900" fill="${escapeXml(color)}">${escapeXml(value)}</text></svg>`;
  const result = encodeSvg(svg);
  assetCache.set(cacheKey, result);
  return result;
}

function emojiCodePoint(value: string) {
  const points = Array.from(value.trim()).map((character) => character.codePointAt(0));
  const keepVariationSelector = points.includes(0x200d);
  return points
    .filter((codePoint): codePoint is number => Boolean(codePoint) && (keepVariationSelector || codePoint !== 0xfe0f))
    .map((codePoint) => codePoint.toString(16))
    .join("-");
}

export function createStickerAsset(value: string, svg?: string | null) {
  const rawSvg = typeof svg === "string" ? svg.trim() : "";
  if (rawSvg) return /^data:image\/svg\+xml/i.test(rawSvg) ? rawSvg : rawSvg.startsWith("<svg") ? encodeSvg(rawSvg) : rawSvg;
  const codePoint = emojiCodePoint(value);
  return codePoint ? `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoint}.svg` : "";
}

export async function loadStickerAsset(value: string, svg?: string | null) {
  const source = createStickerAsset(value, svg);
  if (!source || source.startsWith("data:image/svg")) return source;
  if (source.trim().startsWith("<svg")) return encodeSvg(source);

  const cached = stickerRequestCache.get(source);
  if (cached) return cached;

  const request = fetch(source, { mode: "cors", cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Sticker SVG request failed (${response.status})`);
      const content = await response.text();
      if (!content.trim().startsWith("<svg")) throw new Error("Sticker asset is not SVG");
      return encodeSvg(content);
    })
    .catch((error) => {
      stickerRequestCache.delete(source);
      throw error;
    });

  stickerRequestCache.set(source, request);
  return request;
}

export function getRenderableElement(element: any) {
  if (!element || typeof element !== "object") return element;
  if (element.type === "sticker-element") {
    const src = createStickerAsset(String(element.value || ""), element.svg);
    return {
      ...element,
      type: "image",
      src,
      imageUrl: src,
      printUrl: src,
      meta: {
        ...(element.meta || {}),
        isVector: true,
        printKind: "vector",
        dpiQuality: "vector",
        qualityStatus: "Excellent",
      },
    };
  }
  if (element.meta?.source === "shape-raster" && element.meta?.shapeValue) {
    const src = createTextAsset(String(element.meta.shapeValue), String(element.meta.color || "#111111"), String(element.meta.fontFamily || "Arial, sans-serif"), false);
    return { ...element, type: "image", src, imageUrl: src, printUrl: src, meta: { ...(element.meta || {}), isVector: true, printKind: "vector", dpiQuality: "vector", qualityStatus: "Excellent" } };
  }
  return element;
}

export function createShapeAsset(shape: any) {
  const svg = typeof shape?.svg === "string" ? shape.svg.trim() : "";
  if (svg) return svg;
  return createTextAsset(String(shape?.value || ""), String(shape?.color || "#111111"), String(shape?.fontFamily || "Arial, sans-serif"), false);
}
