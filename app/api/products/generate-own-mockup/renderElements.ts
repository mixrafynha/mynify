import sharp from "sharp";
import { loadImageBuffer } from "./assets";
import { saveDebug } from "./debug";
import { elementNumber, escapeXml } from "./utils";
import type { Box, OutputArea } from "./types";

function renderTextSvg(args: {
  text: string;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string | number;
}) {
  const padding = Math.ceil(args.fontSize * 0.35);
  const svgWidth = args.width + padding * 2;
  const svgHeight = args.height + padding * 2;
  const lines = args.text.split("\n").slice(0, 8);
  const lineHeight = args.fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  const startY = Math.max(args.fontSize, (svgHeight - totalHeight) / 2 + args.fontSize);

  const tspans = lines
    .map((line, index) => {
      return `<tspan x="50%" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <text
        text-anchor="middle"
        font-family="${escapeXml(args.fontFamily)}, Arial, sans-serif"
        font-size="${args.fontSize}"
        font-weight="${escapeXml(args.fontWeight)}"
        fill="${escapeXml(args.color)}"
      >
        ${tspans}
      </text>
    </svg>
  `);
}

function resolveElementPosition(el: any, safeArea: Box) {
  const rawX = elementNumber(el.x ?? el.left ?? el.position?.x, 0);
  const rawY = elementNumber(el.y ?? el.top ?? el.position?.y, 0);

  const looksLocal =
    rawX >= -50 &&
    rawY >= -50 &&
    rawX <= safeArea.width + 50 &&
    rawY <= safeArea.height + 50;

  if (looksLocal) {
    return {
      x: safeArea.x + Math.round(rawX),
      y: safeArea.y + Math.round(rawY),
    };
  }

  return {
    x: Math.round(rawX),
    y: Math.round(rawY),
  };
}

export async function renderElementsLayer(args: {
  elements: any[];
  outputArea: OutputArea;
  safeArea: Box;
}) {
  const elements = (Array.isArray(args.elements) ? args.elements : [])
    .filter(Boolean)
    .sort((a, b) => elementNumber(a.zIndex) - elementNumber(b.zIndex));

  console.log(
    "ELEMENTS DEBUG",
    elements.map((el) => {
      const src =
        el.src ||
        el.url ||
        el.image ||
        el.imageUrl ||
        el.preview ||
        el.dataUrl ||
        el.meta?.src ||
        el.meta?.url ||
        el.meta?.image ||
        el.meta?.imageUrl ||
        el.meta?.preview ||
        el.meta?.dataUrl;

      return {
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        text: el.text,
        content: el.content,
        hasSrc: Boolean(src),
        srcStart: src ? String(src).slice(0, 120) : null,
        metaKeys: el.meta ? Object.keys(el.meta) : [],
      };
    })
  );

  const composites: sharp.OverlayOptions[] = [];

  for (const el of elements) {
    const position = resolveElementPosition(el, args.safeArea);

    const width = Math.max(
      1,
      Math.round(elementNumber(el.width ?? el.w ?? el.meta?.width ?? el.meta?.w, 160))
    );

    const height = Math.max(
      1,
      Math.round(elementNumber(el.height ?? el.h ?? el.meta?.height ?? el.meta?.h, 80))
    );

    const rotation = elementNumber(el.rotation ?? el.meta?.rotation, 0);

    const src =
      el.src ||
      el.url ||
      el.image ||
      el.imageUrl ||
      el.preview ||
      el.dataUrl ||
      el.meta?.src ||
      el.meta?.url ||
      el.meta?.image ||
      el.meta?.imageUrl ||
      el.meta?.preview ||
      el.meta?.dataUrl;

    if (src) {
      try {
        const imageBuffer = await loadImageBuffer(String(src));

        let input = await sharp(imageBuffer)
          .resize({
            width,
            height,
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();

        if (rotation) {
          input = await sharp(input)
            .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        }

        composites.push({
          input,
          left: position.x,
          top: position.y,
          blend: "over",
        });

        continue;
      } catch (error: any) {
        console.error("ELEMENT IMAGE RENDER FAILED:", {
          message: error?.message || error,
          srcStart: String(src).slice(0, 160),
        });
      }
    }

    const text = String(
      el.text ||
        el.content ||
        el.value ||
        el.meta?.text ||
        el.meta?.content ||
        ""
    ).slice(0, 300);

    if (text) {
      try {
        const fontSize = Math.max(
          1,
          elementNumber(el.fontSize ?? el.meta?.fontSize, 42)
        );

        const color = String(
          el.color || el.fill || el.meta?.color || el.meta?.fill || "#111111"
        );

        const fontFamily = String(el.fontFamily || el.meta?.fontFamily || "Arial");
        const fontWeight = el.fontWeight || el.meta?.fontWeight || 800;
        const textPadding = Math.ceil(fontSize * 0.35);

        let input = await sharp(
          renderTextSvg({
            text,
            width,
            height,
            fontSize,
            color,
            fontFamily,
            fontWeight,
          })
        )
          .png()
          .toBuffer();

        if (rotation) {
          input = await sharp(input)
            .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        }

        composites.push({
          input,
          left: position.x - textPadding,
          top: position.y - textPadding,
          blend: "over",
        });
      } catch (error: any) {
        console.error("ELEMENT TEXT RENDER FAILED:", error?.message || error);
      }
    }
  }

  if (!composites.length) {
    console.log("ELEMENTS LAYER EMPTY");
    return null;
  }

  const layer = await sharp({
    create: {
      width: args.outputArea.width,
      height: args.outputArea.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  await saveDebug("03-elements-layer.png", layer);

  return layer;
}
