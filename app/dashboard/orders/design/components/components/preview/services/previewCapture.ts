import { toPng } from "html-to-image";

const HIDDEN_SELECTORS = [
  "[data-element-control]",
  "[data-resize-handle]",
  "[data-warning-frame]",
  "[data-editor-only]",
  "[data-selection-frame]",
  "#design-safe-area canvas",
];

export async function captureProductionPreview(node: HTMLElement | null) {
  if (!node) return null;

  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "transparent",
    filter: (target) => {
      if (!(target instanceof HTMLElement)) return true;
      return !HIDDEN_SELECTORS.some((selector) => target.matches(selector) || !!target.closest(selector));
    },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
