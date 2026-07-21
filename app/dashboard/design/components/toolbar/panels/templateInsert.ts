import { loadEditorFont, type TemplatePreset } from "../../data";

function textElement(template: TemplatePreset, source: any) {
  const text = String(source.text || source.content || template.text);
  const fontFamily = String(source.fontFamily || source.meta?.fontFamily || template.fontFamily);
  const fontSize = Number(source.fontSize || source.meta?.fontSize || template.fontSize);
  void loadEditorFont(fontFamily);
  return {
    type: "text",
    text,
    content: text,
    width: Number(source.width) || Math.max(150, Math.round(text.length * fontSize * 0.52)),
    height: Number(source.height) || Math.round(fontSize * (text.includes(" ") ? 1.45 : 1.25)),
    ...source,
    fontFamily,
    fontSize,
    fontWeight: source.fontWeight || source.meta?.fontWeight || template.fontWeight,
    color: source.color || source.meta?.color || template.color,
    meta: {
      fontFamily,
      color: source.color || source.meta?.color || template.color,
      fontSize,
      fontWeight: source.fontWeight || source.meta?.fontWeight || template.fontWeight,
      letterSpacing: source.letterSpacing ?? source.meta?.letterSpacing ?? template.letterSpacing ?? 0,
      lineHeight: source.lineHeight ?? source.meta?.lineHeight ?? template.lineHeight ?? 0.92,
      opacity: 1,
      rotation: source.rotation ?? source.meta?.rotation ?? 0,
      textAlign: source.textAlign || source.meta?.textAlign || "center",
      textShape: "straight",
      template: template.label,
      ...(source.meta || {}),
    },
  };
}

export function insertTemplate(createElement: ((element: any) => void) | undefined, template: TemplatePreset) {
  const sources = template.elements?.length ? template.elements : [{}];
  sources.forEach((source) => createElement?.(source.type === "text" || !source.type ? textElement(template, source) : { ...source, meta: { template: template.label, ...(source.meta || {}) } }));
}
