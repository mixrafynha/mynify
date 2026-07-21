import type { TextPreset } from "./presets";

export type TemplateCategory = "t-shirt" | "hoodie" | "mug" | "tote bag" | "poster" | "logo" | "streetwear" | "gym" | "birthday" | "business" | "quotes" | "vintage" | "minimal";

export type TemplatePreset = TextPreset & {
  id: string;
  category: TemplateCategory;
  preview: string;
  accent: string;
  background: string;
  tag?: string;
  subtitle?: string;
  tone?: "dark" | "light";
  elements?: any[];
};

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["t-shirt", "hoodie", "mug", "tote bag", "poster", "logo", "streetwear", "gym", "birthday", "business", "quotes", "vintage", "minimal"];

const premiumTemplates = [
  ["dream-big", "t-shirt", "T-Shirt Template", "DREAM BIG", "Permanent Marker", 42, 900, "#ffffff", "DREAM\nBIG", "#a855f7", "radial-gradient(circle at 25% 20%,rgba(168,85,247,.42),transparent 38%),linear-gradient(145deg,#080915,#161028 58%,#070712)", "NEW", "Streetwear • Brush"],
  ["limited-drop", "hoodie", "Hoodie Template", "LIMITED DROP", "Bebas Neue", 48, 900, "#ff3f8f", "LIMITED\nDROP", "#ec4899", "radial-gradient(circle at 70% 15%,rgba(236,72,153,.32),transparent 40%),linear-gradient(145deg,#090915,#170914 58%,#07070d)", "HOT", "Exclusive • Drop"],
  ["no-limits", "mug", "Mug Template", "NO LIMITS", "Archivo Black", 42, 900, "#ffffff", "NO\nLIMITS", "#fb923c", "radial-gradient(circle at 78% 82%,rgba(249,115,22,.28),transparent 36%),linear-gradient(145deg,#090909,#16120f 58%,#050505)", "CLEAN", "Minimal • Bold"],
  ["stay-focused", "poster", "Poster Template", "STAY FOCUSED", "Pacifico", 38, 800, "#ffd166", "Stay\nFocused", "#facc15", "radial-gradient(circle at 50% 35%,rgba(250,204,21,.22),transparent 42%),linear-gradient(145deg,#090909,#12100a 55%,#050505)", "PRO", "Motivation • Script"],
  ["paris-mode", "tote bag", "Tote Bag Template", "PARIS MODE", "Playfair Display", 42, 900, "#2dd4bf", "PARIS\nMODE", "#14b8a6", "radial-gradient(circle at 20% 90%,rgba(20,184,166,.34),transparent 38%),linear-gradient(145deg,#07100e,#071a18 58%,#050807)", "DROP", "Fashion • Serif"],
  ["game-day", "poster", "Poster Template", "GAME DAY", "Anton", 46, 900, "#fff4d6", "GAME\nDAY", "#f59e0b", "radial-gradient(circle at 70% 20%,rgba(245,158,11,.22),transparent 38%),linear-gradient(145deg,#100e0a,#181410 58%,#070706)", "PREMIUM", "Sport • Strong"],
  ["stay-wild", "logo", "Logo Template", "STAY WILD", "Knewave", 42, 900, "#ffffff", "STAY\nWILD", "#8b5cf6", "radial-gradient(circle at 72% 15%,rgba(139,92,246,.3),transparent 38%),linear-gradient(145deg,#090912,#11101e 58%,#06060b)", "NEW", "Urban • Brush"],
  ["create-more", "streetwear", "Streetwear Template", "CREATE MORE", "Bungee Outline", 40, 900, "#ffffff", "CREATE\nMORE", "#ec4899", "radial-gradient(circle at 20% 88%,rgba(236,72,153,.28),transparent 40%),linear-gradient(145deg,#08080d,#111015 58%,#050508)", "HOT", "Creative • Heavy"],
  ["born-free", "gym", "Gym Template", "BORN FREE", "Oswald", 46, 900, "#fb923c", "BORN\nFREE", "#f97316", "radial-gradient(circle at 15% 80%,rgba(249,115,22,.34),transparent 40%),linear-gradient(145deg,#110b07,#1b0d06 58%,#070504)", "CLEAN", "Adventure • Condensed"],
  ["vision-club", "birthday", "Birthday Template", "VISION CLUB", "League Spartan", 44, 900, "#2dd4bf", "VISION\nCLUB", "#22d3ee", "radial-gradient(circle at 78% 25%,rgba(34,211,238,.28),transparent 38%),linear-gradient(145deg,#061011,#071919 58%,#030707)", "DROP", "Lifestyle • Modern"],
  ["gym-mode", "business", "Business Template", "GYM MODE", "Bodoni Moda", 42, 900, "#fff7df", "GYM\nMODE", "#c4b5fd", "radial-gradient(circle at 30% 20%,rgba(196,181,253,.2),transparent 38%),linear-gradient(145deg,#0c0a10,#17131d 58%,#060508)", "PRO", "Fitness • Elegant"],
  ["happy-day", "quotes", "Quotes Template", "HAPPY DAY", "Rubik Glitch", 38, 900, "#ffffff", "HAPPY\nDAY", "#a855f7", "radial-gradient(circle at 70% 75%,rgba(168,85,247,.26),transparent 40%),linear-gradient(145deg,#090912,#11101b 58%,#06060a)", "NEW", "Quotes • Friendly"],
  ["local-brand", "vintage", "Vintage Template", "LOCAL BRAND", "Cormorant Garamond", 43, 900, "#fff4d6", "LOCAL\nBRAND", "#fde68a", "radial-gradient(circle at 74% 20%,rgba(253,230,138,.18),transparent 38%),linear-gradient(145deg,#090807,#17130d 58%,#050504)", "HOT", "Vintage • Serif"],
  ["good-vibes", "minimal", "Minimal Template", "GOOD VIBES", "Archivo Black", 39, 900, "#ffffff", "GOOD\nVIBES", "#f97316", "radial-gradient(circle at 18% 84%,rgba(249,115,22,.26),transparent 42%),linear-gradient(145deg,#090909,#15100c 58%,#050504)", "CLEAN", "Minimal • Bold"],
  ["vintage-goods", "t-shirt", "T-Shirt Template", "VINTAGE GOODS", "Bebas Neue", 43, 900, "#2dd4bf", "VINTAGE\nGOODS", "#14b8a6", "radial-gradient(circle at 72% 15%,rgba(20,184,166,.25),transparent 38%),linear-gradient(145deg,#050e0f,#071b1b 58%,#030606)", "DROP", "Retro • Built to last"],
  ["minimal-studio", "hoodie", "Hoodie Template", "MINIMAL STUDIO", "Montserrat", 39, 900, "#f7f1df", "MINIMAL\nSTUDIO", "#e9d5ff", "radial-gradient(circle at 50% 10%,rgba(233,213,255,.16),transparent 38%),linear-gradient(145deg,#08080c,#121118 58%,#050507)", "PRO", "Minimal • Studio"],
  ["make-it-happen", "mug", "Mug Template", "MAKE IT HAPPEN", "Fugaz One", 34, 900, "#ffffff", "MAKE IT\nHAPPEN", "#8b5cf6", "radial-gradient(circle at 18% 22%,rgba(139,92,246,.32),transparent 36%),linear-gradient(145deg,#090912,#12101f 58%,#06060b)", "NEW", "Action • Bold"],
  ["focus-club", "tote bag", "Tote Bag Template", "FOCUS CLUB", "Sora", 35, 900, "#ff4da6", "FOCUS\nCLUB", "#ec4899", "radial-gradient(circle at 75% 78%,rgba(236,72,153,.22),transparent 38%),linear-gradient(145deg,#0a0710,#16101a 58%,#050409)", "HOT", "Focus • Modern"],
  ["hustle-hard", "poster", "Poster Template", "HUSTLE HARD", "Barlow Condensed", 46, 900, "#fb923c", "HUSTLE\nHARD", "#fb923c", "radial-gradient(circle at 18% 78%,rgba(251,146,60,.3),transparent 40%),linear-gradient(145deg,#100806,#1a0d06 58%,#060302)", "CLEAN", "Sport • Heavy"],
  ["smile-more", "logo", "Logo Template", "SMILE MORE", "Shrikhand", 36, 900, "#2dd4bf", "SMILE\nMORE", "#22d3ee", "radial-gradient(circle at 78% 20%,rgba(34,211,238,.22),transparent 38%),linear-gradient(145deg,#061011,#07191b 58%,#030707)", "DROP", "Logo • Retro"],
  ["new-wave", "streetwear", "Streetwear Template", "NEW WAVE", "Rubik Spray Paint", 38, 900, "#ffffff", "NEW\nWAVE", "#a855f7", "radial-gradient(circle at 22% 78%,rgba(168,85,247,.34),transparent 42%),linear-gradient(145deg,#090912,#151023 58%,#050508)", "PRO", "Street • Spray"],
  ["discipline", "gym", "Gym Template", "DISCIPLINE", "Anton", 42, 900, "#fff4d6", "DISCIPLINE", "#f59e0b", "radial-gradient(circle at 72% 18%,rgba(245,158,11,.22),transparent 40%),linear-gradient(145deg,#0c0904,#181006 58%,#050403)", "PRO", "Fitness • Power"],
  ["party-time", "birthday", "Birthday Template", "PARTY TIME", "Bangers", 42, 900, "#ffffff", "PARTY\nTIME", "#ec4899", "radial-gradient(circle at 20% 20%,rgba(236,72,153,.32),transparent 38%),linear-gradient(145deg,#0a0710,#17101d 58%,#050409)", "NEW", "Birthday • Fun"],
  ["studio-club", "business", "Business Template", "STUDIO CLUB", "Space Grotesk", 38, 900, "#ffffff", "STUDIO\nCLUB", "#8b5cf6", "radial-gradient(circle at 78% 78%,rgba(139,92,246,.26),transparent 40%),linear-gradient(145deg,#080914,#121525 58%,#05060a)", "CLEAN", "Brand • Clean"],
  ["good-things", "quotes", "Quotes Template", "GOOD THINGS TAKE TIME", "Prata", 31, 900, "#fff7df", "GOOD\nTHINGS\nTAKE TIME", "#fde68a", "radial-gradient(circle at 50% 20%,rgba(253,230,138,.16),transparent 38%),linear-gradient(145deg,#0c0a06,#17130d 58%,#050504)", "PRO", "Quote • Serif"],
  ["everyday-chance", "minimal", "Minimal Template", "EVERYDAY IS A NEW CHANCE", "Cormorant SC", 30, 900, "#fff4d6", "EVERYDAY\nIS A NEW\nCHANCE", "#fde68a", "radial-gradient(circle at 75% 22%,rgba(253,230,138,.14),transparent 38%),linear-gradient(145deg,#090807,#15120c 58%,#050504)", "PRO", "Minimal • Premium"],
] as const;

const generatedTemplates: TemplatePreset[] = premiumTemplates.map(([id, category, label, text, fontFamily, fontSize, fontWeight, color, preview, accent, background, tag, subtitle]) => ({
  id,
  category: category as TemplateCategory,
  label,
  text,
  fontFamily,
  fontSize,
  fontWeight,
  color,
  preview,
  accent,
  background,
  tag,
  subtitle,
  letterSpacing: fontFamily === "Bebas Neue" || fontFamily === "Barlow Condensed" ? 0.6 : fontFamily === "Sora" || fontFamily === "Space Grotesk" ? -0.4 : 0,
}));

const craftedTemplates: TemplatePreset[] = [
  {
    id: "graffiti-wild-style", category: "streetwear", label: "Wild Style Graffiti", text: "NO RULES", fontFamily: "Rubik Spray Paint", fontSize: 62, fontWeight: 900, color: "#f8fafc", preview: "NO\nRULES", accent: "#ec4899", background: "radial-gradient(circle at 20% 20%,#ec489955,transparent 38%),linear-gradient(145deg,#09070f,#22102d 58%,#050508)", tag: "GRAFFITI", subtitle: "Spray paint · Layered",
    elements: [
      { type: "text", text: "NO", x: 24, y: 62, width: 282, height: 84, fontFamily: "Rubik Spray Paint", fontSize: 72, color: "#f8fafc", rotation: -4, meta: { strokeWidth: 5, strokeColor: "#111111", shadow: true, shadowColor: "#ec4899" } },
      { type: "text", text: "RULES", x: 14, y: 143, width: 305, height: 92, fontFamily: "Knewave", fontSize: 76, color: "#facc15", rotation: 3, meta: { strokeWidth: 5, strokeColor: "#111111" } },
      { type: "text", text: "EST. 2026 · STREET CULTURE", x: 48, y: 242, width: 235, height: 34, fontFamily: "Permanent Marker", fontSize: 17, color: "#f8fafc", meta: { letterSpacing: 1.4 } },
    ],
  },
  {
    id: "graffiti-city-noise", category: "streetwear", label: "City Noise Graffiti", text: "CITY NOISE", fontFamily: "Knewave", fontSize: 58, fontWeight: 900, color: "#ffffff", preview: "CITY\nNOISE", accent: "#22d3ee", background: "radial-gradient(circle at 80% 20%,#22d3ee44,transparent 40%),linear-gradient(145deg,#05080c,#0b1f26 60%,#030405)", tag: "URBAN", subtitle: "Graffiti · Neon",
    elements: [
      { type: "text", text: "CITY", x: 24, y: 72, width: 280, height: 78, fontFamily: "Knewave", fontSize: 70, color: "#22d3ee", rotation: -2, meta: { strokeWidth: 6, strokeColor: "#071018" } },
      { type: "text", text: "NOISE", x: 12, y: 145, width: 308, height: 96, fontFamily: "Rubik Spray Paint", fontSize: 76, color: "#ffffff", rotation: 2, meta: { strokeWidth: 4, strokeColor: "#111827", glow: true, glowColor: "#22d3ee" } },
      { type: "text", text: "UNDERGROUND MOVEMENT", x: 54, y: 246, width: 225, height: 30, fontFamily: "Rock Salt", fontSize: 14, color: "#a5f3fc" },
    ],
  },
  {
    id: "street-rebel-club", category: "t-shirt", label: "Rebel Club", text: "REBEL CLUB", fontFamily: "Black Ops One", fontSize: 54, fontWeight: 900, color: "#fff7ed", preview: "REBEL\nCLUB", accent: "#f97316", background: "radial-gradient(circle at 20% 80%,#f9731644,transparent 38%),linear-gradient(145deg,#0c0805,#231208 58%,#050403)", tag: "PREMIUM", subtitle: "Street badge · Distressed",
    elements: [
      { type: "text", text: "REBEL", x: 30, y: 74, width: 270, height: 70, fontFamily: "Black Ops One", fontSize: 62, color: "#fff7ed", meta: { strokeWidth: 3, strokeColor: "#7c2d12", letterSpacing: 2 } },
      { type: "text", text: "CLUB", x: 48, y: 143, width: 235, height: 78, fontFamily: "Bangers", fontSize: 72, color: "#f97316", meta: { strokeWidth: 4, strokeColor: "#111111", letterSpacing: 3 } },
      { type: "text", text: "BUILT DIFFERENT · SINCE 2026", x: 36, y: 230, width: 260, height: 32, fontFamily: "Permanent Marker", fontSize: 15, color: "#fed7aa" },
    ],
  },
  {
    id: "street-underground", category: "hoodie", label: "Underground", text: "UNDERGROUND", fontFamily: "Nosifer", fontSize: 46, fontWeight: 900, color: "#ef4444", preview: "UNDER\nGROUND", accent: "#ef4444", background: "radial-gradient(circle at 70% 15%,#ef444433,transparent 42%),linear-gradient(145deg,#090606,#1c0909 60%,#040303)", tag: "DARK", subtitle: "Horror graffiti · Heavy",
    elements: [
      { type: "text", text: "UNDER", x: 23, y: 78, width: 286, height: 72, fontFamily: "Nosifer", fontSize: 55, color: "#ef4444", rotation: -2, meta: { strokeWidth: 4, strokeColor: "#0a0a0a" } },
      { type: "text", text: "GROUND", x: 14, y: 147, width: 306, height: 82, fontFamily: "Nosifer", fontSize: 58, color: "#f8fafc", rotation: 2, meta: { strokeWidth: 4, strokeColor: "#7f1d1d" } },
      { type: "text", text: "NO FEAR / NO LIMITS", x: 58, y: 239, width: 215, height: 29, fontFamily: "Rock Salt", fontSize: 14, color: "#fca5a5" },
    ],
  },
  {
    id: "vintage-riders", category: "vintage", label: "Midnight Riders", text: "MIDNIGHT RIDERS", fontFamily: "Bangers", fontSize: 50, fontWeight: 900, color: "#fef3c7", preview: "MIDNIGHT\nRIDERS", accent: "#f59e0b", background: "radial-gradient(circle at 50% 15%,#f59e0b33,transparent 38%),linear-gradient(145deg,#0c0a06,#21180b 60%,#050403)", tag: "VINTAGE", subtitle: "Motor club · Authentic",
    elements: [
      { type: "text", text: "MIDNIGHT", x: 36, y: 78, width: 260, height: 54, fontFamily: "Permanent Marker", fontSize: 38, color: "#fef3c7", meta: { letterSpacing: 2 } },
      { type: "text", text: "RIDERS", x: 20, y: 126, width: 292, height: 90, fontFamily: "Bangers", fontSize: 82, color: "#f59e0b", meta: { strokeWidth: 5, strokeColor: "#451a03", letterSpacing: 3 } },
      { type: "text", text: "OPEN ROAD · MOTOR DIVISION", x: 47, y: 225, width: 238, height: 31, fontFamily: "Black Ops One", fontSize: 14, color: "#fde68a" },
    ],
  },
  {
    id: "positive-vandal", category: "quotes", label: "Positive Vandal", text: "MAKE SOME NOISE", fontFamily: "Rubik Spray Paint", fontSize: 48, fontWeight: 900, color: "#ffffff", preview: "MAKE SOME\nNOISE", accent: "#a855f7", background: "radial-gradient(circle at 15% 75%,#a855f744,transparent 40%),linear-gradient(145deg,#080611,#1a1028 60%,#040306)", tag: "GRAFFITI", subtitle: "Positive message · Spray",
    elements: [
      { type: "text", text: "MAKE SOME", x: 38, y: 91, width: 258, height: 55, fontFamily: "Permanent Marker", fontSize: 41, color: "#e9d5ff", rotation: -3 },
      { type: "text", text: "NOISE", x: 16, y: 143, width: 302, height: 96, fontFamily: "Rubik Spray Paint", fontSize: 84, color: "#ffffff", rotation: 2, meta: { strokeWidth: 5, strokeColor: "#581c87", glow: true, glowColor: "#a855f7" } },
      { type: "text", text: "YOUR VOICE MATTERS", x: 62, y: 247, width: 208, height: 28, fontFamily: "Rock Salt", fontSize: 13, color: "#d8b4fe" },
    ],
  },
];

export const TEMPLATES: TemplatePreset[] = [...craftedTemplates, ...generatedTemplates];
