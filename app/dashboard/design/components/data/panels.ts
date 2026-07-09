export type EditorPanelId = "ai" | "text" | "upload" | "templates" | "icons" | "stickers" | "layers";

export const PANELS = [
  { id: "ai", label: "AI", description: "Generate transparent print graphics" },
  { id: "text", label: "Text", description: "Add text and font presets" },
  { id: "upload", label: "Upload", description: "Import print-ready images" },
  { id: "templates", label: "Templates", description: "Ready product layouts" },
  { id: "icons", label: "Shapes", description: "Simple vector shapes" },
  { id: "stickers", label: "Stickers", description: "Quick graphic stickers" },
  { id: "layers", label: "Layers", description: "Layer order and visibility" },
] as const;
