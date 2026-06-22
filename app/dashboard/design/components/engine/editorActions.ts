export type EditorElement = Record<string, any>;
export function duplicateElement(element: EditorElement, offset = 24): EditorElement {
  return { ...element, id: typeof crypto !== "undefined" ? crypto.randomUUID() : `${element.id}-copy-${Date.now()}`, x: Number(element.x || 0) + offset, y: Number(element.y || 0) + offset, selected: false, meta: { ...(element.meta || {}) } };
}
export function patchElement(element: EditorElement, patch: EditorElement): EditorElement {
  const next = { ...element, ...patch, meta: { ...(element.meta || {}), ...(patch.meta || {}) } };
  delete next.__transient; delete next.delete; delete next.duplicate; delete next.zAction;
  return next;
}
export function reorderElement(elements: EditorElement[], id: string, action: "bringForward" | "sendBackward" | "bringToFront" | "sendToBack") {
  const maxZ = Math.max(0, ...elements.map((item) => item.zIndex || 0));
  return elements.map((item) => {
    if (item.id !== id) return action === "sendToBack" ? { ...item, zIndex: (item.zIndex || 0) + 1 } : item;
    if (action === "bringForward") return { ...item, zIndex: (item.zIndex || 0) + 1 };
    if (action === "sendBackward") return { ...item, zIndex: Math.max(0, (item.zIndex || 0) - 1) };
    if (action === "bringToFront") return { ...item, zIndex: maxZ + 1 };
    return { ...item, zIndex: 0 };
  });
}
export function buildTextElement(text = "Add your text", fontFamily = "Inter") {
  return { type: "text", text, content: text, width: Math.max(128, text.length * 22), height: 60, fontFamily, fontSize: 36, fontWeight: 800, color: "#111111", meta: { fontFamily, fontSize: 36, fontWeight: 800, color: "#111111", opacity: 1, rotation: 0, textAlign: "center", textShape: "straight" } };
}
