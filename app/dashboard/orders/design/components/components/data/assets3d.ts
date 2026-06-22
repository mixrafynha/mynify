import type { PrintAssetPreset } from "./assets";

function unsplashPhoto(id: string, w = 4096) {
  return `https://images.unsplash.com/${id}?q=95&w=${w}&auto=format&fit=crop`;
}

const make3d = (
  id: string,
  title: string,
  category: string,
  tags: string[],
  photoId: string
): PrintAssetPreset => ({
  id,
  title,
  label: title,
  category,
  collection: category,
  tags,
  type: "3d",
  previewUrl: unsplashPhoto(photoId, 1600),
  printUrl: unsplashPhoto(photoId, 4096),
  width: 4096,
  height: 4096,
  dpi: 300,
  transparent: false,
  background: "transparent",
  license: "unsplash-license",
  credit: "Unsplash",
  safeForPrint: true,
  printNotes:
    "High-resolution 3D/abstract source image. For transparent 3D PNGs, replace printUrl with your own rendered PNG under /public/assets/print/3d/.",
});

export const ASSET_3D_CATEGORIES = [
  "Chrome",
  "Glass",
  "Inflated",
  "Clay",
  "Neon",
  "Metal",
  "Abstract",
  "Luxury",
] as const;

export const ASSETS_3D: PrintAssetPreset[] = [
  make3d("chrome-001", "Chrome Liquid", "Chrome", ["chrome", "liquid", "silver"], "photo-1618005198919-d3d4b5a92ead"),
  make3d("chrome-002", "Chrome Waves", "Chrome", ["chrome", "wave", "premium"], "photo-1618005182384-a83a8bd57fbe"),
  make3d("chrome-003", "Silver Abstract", "Chrome", ["silver", "abstract", "metal"], "photo-1541701494587-cb58502866ab"),
  make3d("glass-001", "Glass Prism", "Glass", ["glass", "prism", "transparent"], "photo-1557683316-973673baf926"),
  make3d("glass-002", "Crystal Light", "Glass", ["crystal", "light", "3d"], "photo-1500530855697-b586d89ba3ee"),
  make3d("inflated-001", "Soft Bubble", "Inflated", ["bubble", "soft", "inflated"], "photo-1618005198919-d3d4b5a92ead"),
  make3d("inflated-002", "Bubble Form", "Inflated", ["bubble", "plastic", "form"], "photo-1618005182384-a83a8bd57fbe"),
  make3d("clay-001", "Clay Form", "Clay", ["clay", "soft", "object"], "photo-1518005020951-eccb494ad742"),
  make3d("clay-002", "Minimal Clay", "Clay", ["clay", "minimal", "matte"], "photo-1518655048521-f130df041f66"),
  make3d("neon-001", "Neon Tunnel", "Neon", ["neon", "cyber", "light"], "photo-1550745165-9bc0b252726f"),
  make3d("neon-002", "Purple Neon", "Neon", ["purple", "gaming", "neon"], "photo-1511512578047-dfb367046420"),
  make3d("metal-001", "Dark Metal", "Metal", ["metal", "dark", "steel"], "photo-1534438327276-14e5300c3a48"),
  make3d("metal-002", "Gold Metal", "Metal", ["gold", "luxury", "premium"], "photo-1618005182384-a83a8bd57fbe"),
  make3d("abstract-001", "3D Fluid", "Abstract", ["fluid", "3d", "abstract"], "photo-1541701494587-cb58502866ab"),
  make3d("abstract-002", "Modern Blob", "Abstract", ["blob", "modern", "3d"], "photo-1557683316-973673baf926"),
  make3d("luxury-001", "Luxury Marble", "Luxury", ["marble", "luxury", "premium"], "photo-1618005198919-d3d4b5a92ead"),
];
