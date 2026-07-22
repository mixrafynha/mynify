import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { chromium } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import PrintCanvas from "../../shared/rendering/PrintCanvas";
import { googleFontsLinks } from "../../shared/rendering/font";
import { getServiceSupabase } from "./supabase";

export type DesignSide = "front" | "back";

type Box = { x?: number; y?: number; width?: number; height?: number };
type RenderElement = Record<string, any> & {
  id?: string;
  type?: "image" | "text" | "shape" | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  src?: string;
  text?: string;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fill?: string;
  zIndex?: number;
  meta?: Record<string, any>;
};

type SideData = {
  elements?: RenderElement[];
  safeArea?: Box;
  printBox?: Box;
  mockupUrl?: string | null;
};

type DesignData = {
  productId?: string;
  category?: string;
  mockupColor?: string;
  color?: string;
  sides?: Partial<Record<DesignSide, SideData>>;
  mockupUrls?: Partial<Record<DesignSide, string | null>>;
  production?: {
    printSizeMm?: Partial<Record<DesignSide, { widthMm?: number; heightMm?: number }>>;
  };
};

const DEFAULT_PRINT_DPI = 300;
const CHECKOUT_SIZE = 1024;
const MIN_SIZE = 1;
const execFileAsync = promisify(execFile);

let arialFontInstallPromise: Promise<void> | null = null;

function fontFileName(id: string) {
  return id === "arial-bold" ? "Arial-Bold.ttf" : "Arial.ttf";
}

async function downloadFont(url: string) {
  const response = await fetch(url, {
    headers: { accept: "font/ttf,font/otf,application/octet-stream,*/*;q=0.8" },
  });
  if (!response.ok) {
    throw new Error(`Failed to download Arial font: ${response.status} ${response.statusText}`);
  }

  const font = Buffer.from(await response.arrayBuffer());
  if (font.length < 1024) throw new Error("Downloaded Arial font file is invalid or empty.");
  return font;
}

async function installArialFonts() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("editor_fonts")
    .select("id,font_url,enabled")
    .in("id", ["arial", "arial-bold"])
    .eq("enabled", true);

  if (error) throw new Error(`Unable to load Arial font records: ${error.message}`);

  const rows = new Map((data || []).map((row) => [String(row.id), row]));
  for (const id of ["arial", "arial-bold"]) {
    const fontUrl = String(rows.get(id)?.font_url || "").trim();
    if (!fontUrl) {
      throw new Error(`editor_fonts.${id}.font_url is required for identical shape rendering.`);
    }
  }

  const fontDirectory = "/tmp/ryfio-fonts";
  const fontCacheDirectory = "/tmp/ryfio-fontconfig-cache";
  const fontConfigDirectory = "/tmp/ryfio-fontconfig";
  const fontConfigFile = join(fontConfigDirectory, "fonts.conf");
  await mkdir(fontDirectory, { recursive: true });
  await mkdir(fontCacheDirectory, { recursive: true });
  await mkdir(fontConfigDirectory, { recursive: true });

  await Promise.all(
    ["arial", "arial-bold"].map(async (id) => {
      const fontUrl = String(rows.get(id)?.font_url || "").trim();
      await writeFile(join(fontDirectory, fontFileName(id)), await downloadFont(fontUrl));
    }),
  );

  await writeFile(
    fontConfigFile,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>${fontDirectory}</dir>
  <cachedir>${fontCacheDirectory}</cachedir>
</fontconfig>`,
    "utf8",
  );

  const fontconfigEnv = {
    ...process.env,
    FONTCONFIG_FILE: fontConfigFile,
    FONTCONFIG_PATH: "/etc/fonts",
    XDG_CACHE_HOME: fontCacheDirectory,
  };
  await execFileAsync("fc-cache", ["-f"], { env: fontconfigEnv });
  const { stdout } = await execFileAsync("fc-match", ["Arial", "-f", "%{family}"], {
    env: fontconfigEnv,
  });
  if (!String(stdout).toLowerCase().includes("arial")) {
    throw new Error(`Arial font registration failed; fontconfig returned: ${String(stdout).trim() || "unknown"}`);
  }

  process.env.FONTCONFIG_FILE = fontConfigFile;
  process.env.FONTCONFIG_PATH = "/etc/fonts";
  process.env.XDG_CACHE_HOME = fontCacheDirectory;
}

async function ensureArialFontsInstalled() {
  if (!arialFontInstallPromise) {
    arialFontInstallPromise = installArialFonts().catch((error) => {
      arialFontInstallPromise = null;
      throw error;
    });
  }
  await arialFontInstallPromise;
}

function n(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positive(value: unknown, fallback: number) {
  return Math.max(MIN_SIZE, n(value, fallback));
}

function round(value: number) {
  return Math.round(value);
}

function hasArtwork(elements: RenderElement[]) {
  return elements.some((el) => el && !el.meta?.hidden && ["image", "text", "shape"].includes(String(el.type || "")));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isInlineImageSrc(src: string) {
  return src.startsWith("data:");
}

function isFetchableImageSrc(src: string) {
  return /^https?:\/\//i.test(src);
}

function resolveElementImageSrc(el: RenderElement) {
  return String(
    el.src ||
      el.printUrl ||
      el.print_url ||
      el.imageUrl ||
      el.image_url ||
      el.assetUrl ||
      el.asset_url ||
      el.publicImageUrl ||
      el.public_image_url ||
      el.url ||
      el.image ||
      el.meta?.src ||
      el.meta?.printUrl ||
      el.meta?.print_url ||
      el.meta?.imageUrl ||
      el.meta?.image_url ||
      el.meta?.assetUrl ||
      el.meta?.asset_url ||
      el.meta?.publicImageUrl ||
      el.meta?.public_image_url ||
      el.meta?.url ||
      el.meta?.image ||
      "",
  ).trim();
}

async function imageUrlToDataUrl(src: string) {
  const cleanSrc = String(src || "").trim();
  if (!cleanSrc || isInlineImageSrc(cleanSrc)) return cleanSrc;

  if (!isFetchableImageSrc(cleanSrc)) {
    throw new Error(`Unsupported image source for server render: ${cleanSrc.slice(0, 180)}`);
  }

  const response = await fetch(cleanSrc, {
    headers: {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image for server render: ${response.status} ${response.statusText} | ${cleanSrc}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Invalid image content-type for server render: ${contentType} | ${cleanSrc}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new Error(`Empty image response for server render: ${cleanSrc}`);
  }

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function inlineRenderImages(elements: RenderElement[]) {
  return Promise.all(
    elements.map(async (el) => {
      if (String(el.type || "") !== "image") return el;

      const src = resolveElementImageSrc(el);
      if (!src) return el;

      const inlinedSrc = await imageUrlToDataUrl(src);
      return {
        ...el,
        src: inlinedSrc,
        imageUrl: inlinedSrc,
        url: inlinedSrc,
        meta: {
          ...(el.meta || {}),
          src: inlinedSrc,
          imageUrl: inlinedSrc,
          url: inlinedSrc,
          originalSrc: el.meta?.originalSrc || src,
        },
      };
    }),
  );
}

function normalizeElements(value: unknown): RenderElement[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((el): el is RenderElement => Boolean(el) && typeof el === "object")
    .filter((el) => !el.meta?.hidden)
    .map((el, index) => {
      const meta = el.meta && typeof el.meta === "object" ? el.meta : {};
      const width = positive(el.width, el.type === "shape" ? 120 : 140);
      const height = positive(el.height, el.type === "shape" ? 120 : 140);

      return {
        ...el,
        id: el.id || `${el.type || "element"}-${index}`,
        type: String(el.type || ""),
        x: n(el.x, 0),
        y: n(el.y, 0),
        width,
        height,
        meta,
      };
    })
    .sort((a, b) => n(a.zIndex, 0) - n(b.zIndex, 0));
}

function getPrintPixelSize(designData: DesignData, side: DesignSide, sideData: SideData) {
  const printSize = designData.production?.printSizeMm?.[side];
  const widthMm = n(printSize?.widthMm, 0);
  const heightMm = n(printSize?.heightMm, 0);

  if (widthMm > 0 && heightMm > 0) {
    return {
      width: Math.max(1, Math.round((widthMm / 25.4) * DEFAULT_PRINT_DPI)),
      height: Math.max(1, Math.round((heightMm / 25.4) * DEFAULT_PRINT_DPI)),
    };
  }

  const source = sideData.safeArea || sideData.printBox || {};
  return {
    width: positive(source.width, CHECKOUT_SIZE),
    height: positive(source.height, CHECKOUT_SIZE),
  };
}

async function renderHtmlPng(args: {
  elements: RenderElement[];
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  transparent?: boolean;
  mockupUrl?: string | null;
  mockupColor?: string | null;
  overlayLeft?: number;
  overlayTop?: number;
  overlayWidth?: number;
  overlayHeight?: number;
  /**
   * Production print files must match the editor DOM exactly.
   * The editor renders a logical safe-area layer first, then scales that whole
   * layer to the production bitmap. Scaling each element independently changes
   * transform order, sub-pixel layout, rotated objects, text metrics and font
   * wrapping. Keep false for checkout thumbnails/mockups.
   */
  scaleWholeLayer?: boolean;
}) {
  await ensureArialFontsInstalled();
  const elements = await inlineRenderImages(normalizeElements(args.elements));
  const outputScaleX = args.outputWidth / args.sourceWidth;
  const outputScaleY = args.outputHeight / args.sourceHeight;
  const elementScaleX = args.scaleWholeLayer ? 1 : outputScaleX;
  const elementScaleY = args.scaleWholeLayer ? 1 : outputScaleY;
  const logicalWidth = args.scaleWholeLayer ? args.sourceWidth : positive(args.overlayWidth, args.outputWidth);
  const logicalHeight = args.scaleWholeLayer ? args.sourceHeight : positive(args.overlayHeight, args.outputHeight);
  const htmlElements = renderToStaticMarkup(
    <PrintCanvas
      elements={elements}
      safeArea={{ width: logicalWidth, height: logicalHeight }}
      scaleX={elementScaleX}
      scaleY={elementScaleY}
    />,
  );
  const background = args.transparent ? "transparent" : (args.mockupColor || "transparent");
  const mockupSrc = args.mockupUrl ? await imageUrlToDataUrl(args.mockupUrl) : null;

  const mockupHtml = mockupSrc
    ? `<img src="${escapeHtml(mockupSrc)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;" />`
    : "";

  const overlayWidth = args.scaleWholeLayer ? args.sourceWidth : positive(args.overlayWidth, args.outputWidth);
  const overlayHeight = args.scaleWholeLayer ? args.sourceHeight : positive(args.overlayHeight, args.outputHeight);
  const overlayTransform = args.scaleWholeLayer
    ? `transform:scale(${outputScaleX}, ${outputScaleY});transform-origin:top left;`
    : "";

  const overlayStyle = [
    "position:absolute",
    `left:${n(args.overlayLeft, 0)}px`,
    `top:${n(args.overlayTop, 0)}px`,
    `width:${overlayWidth}px`,
    `height:${overlayHeight}px`,
    overlayTransform,
    "overflow:hidden",
    "clip-path:inset(0)",
  ].filter(Boolean).join(";");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
${googleFontsLinks(elements)}
<style>
  * { box-sizing: border-box; }
  html, body { width:${args.outputWidth}px; height:${args.outputHeight}px; margin:0; padding:0; overflow:hidden; background:${background}; }
  body { position:relative; }
</style>
</head>
<body>
  ${mockupHtml}
  <div id="design-layer" style="${overlayStyle}">${htmlElements}</div>
</body>
</html>`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: args.outputWidth, height: args.outputHeight },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts?.ready;
      const images = Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();

          return new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Image failed to load: ${img.src.slice(0, 240)}`));
          });
        }),
      );

      const failed = images
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src.slice(0, 240));

      if (failed.length) {
        throw new Error(`Render image load failed: ${failed.join(" | ")}`);
      }
    });
    return Buffer.from(await page.screenshot({ type: "png", omitBackground: !!args.transparent }));
  } finally {
    await browser.close();
  }
}

export async function renderPrintFilePng(args: { designData: DesignData; side: DesignSide }) {
  const sideData = args.designData.sides?.[args.side];
  if (!sideData) throw new Error(`Missing design side data: ${args.side}`);

  const elements = normalizeElements(sideData.elements);
  if (!hasArtwork(elements)) return null;

  const source = sideData.safeArea || sideData.printBox || {};
  const sourceWidth = positive(source.width, 1);
  const sourceHeight = positive(source.height, 1);
  const output = getPrintPixelSize(args.designData, args.side, sideData);

  return renderHtmlPng({
    elements,
    sourceWidth,
    sourceHeight,
    outputWidth: output.width,
    outputHeight: output.height,
    transparent: true,
    overlayLeft: 0,
    overlayTop: 0,
    overlayWidth: output.width,
    overlayHeight: output.height,
    scaleWholeLayer: true,
  });
}

export async function renderCheckoutThumbnailWebp(args: {
  designData: DesignData;
  side?: DesignSide;
  size?: number;
}) {
  const frontElements = normalizeElements(args.designData.sides?.front?.elements);
  const side: DesignSide = args.side || (hasArtwork(frontElements) ? "front" : "back");
  const sideData = args.designData.sides?.[side];
  if (!sideData) throw new Error(`Missing thumbnail side data: ${side}`);

  const elements = normalizeElements(sideData.elements);
  const mockupUrl = sideData.mockupUrl || args.designData.mockupUrls?.[side] || null;
  const size = args.size || CHECKOUT_SIZE;
  const safeArea = sideData.safeArea || sideData.printBox || {};
  const printBox = sideData.printBox || safeArea;
  const sourceWidth = positive(safeArea.width, positive(printBox.width, size));
  const sourceHeight = positive(safeArea.height, positive(printBox.height, size));
  const scale = size / 1024;
  const overlayLeft = round(n(safeArea.x, n(printBox.x, 0)) * scale);
  const overlayTop = round(n(safeArea.y, n(printBox.y, 0)) * scale);
  const overlayWidth = round(sourceWidth * scale);
  const overlayHeight = round(sourceHeight * scale);

  const png = await renderHtmlPng({
    elements,
    sourceWidth,
    sourceHeight,
    outputWidth: size,
    outputHeight: size,
    transparent: true,
    mockupUrl,
    mockupColor: args.designData.mockupColor || args.designData.color || null,
    overlayLeft,
    overlayTop,
    overlayWidth,
    overlayHeight,
  });

  return sharp(png).webp({ quality: 84, effort: 4 }).toBuffer();
}
