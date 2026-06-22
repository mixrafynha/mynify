export type TextPreset = { label: string; text: string; fontFamily: string; fontSize: number; fontWeight: string | number; color: string; letterSpacing?: number; lineHeight?: number; };
export const TEXT_PRESETS: TextPreset[] = [
  { label: "Headline", text: "Add your text", fontFamily: "Inter", fontSize: 44, fontWeight: 900, color: "#111111" },
  { label: "Subheading", text: "Your subtitle", fontFamily: "Inter", fontSize: 30, fontWeight: 800, color: "#111111" },
  { label: "Small text", text: "Small text", fontFamily: "Inter", fontSize: 20, fontWeight: 600, color: "#111111" },
  { label: "Quote", text: "Make it happen", fontFamily: "Playfair Display", fontSize: 34, fontWeight: 800, color: "#111111" },
  { label: "Street", text: "LIMITED DROP", fontFamily: "Bebas Neue", fontSize: 42, fontWeight: 900, color: "#111111" },
];
export const FONT_COMBINATIONS: TextPreset[] = [
  { label: "Street bold", text: "STREET MODE", fontFamily: "Impact", fontSize: 42, fontWeight: 900, color: "#111111" },
  { label: "Luxury serif", text: "Luxury Club", fontFamily: "Playfair Display", fontSize: 38, fontWeight: 900, color: "#111111" },
  { label: "Cyber", text: "CYBER SOUL", fontFamily: "Orbitron", fontSize: 32, fontWeight: 900, color: "#111111", letterSpacing: 1 },
  { label: "Minimal", text: "minimal studio", fontFamily: "Poppins", fontSize: 34, fontWeight: 800, color: "#111111" },
  { label: "Sport", text: "GAME DAY", fontFamily: "Arial Black", fontSize: 40, fontWeight: 900, color: "#111111" },
  { label: "Script", text: "Made with Love", fontFamily: "Pacifico", fontSize: 34, fontWeight: 700, color: "#111111" },
];
