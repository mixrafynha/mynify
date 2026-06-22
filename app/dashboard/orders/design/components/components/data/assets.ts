export type AssetLicense =
  | "unsplash-license"
  | "public-domain"
  | "owned"
  | "commercial-license-required";

export type PrintAssetPreset = {
  id: string;
  title: string;
  label: string;
  category: string;
  collection?: string;
  tags: string[];
  type: "photo" | "png" | "vector" | "3d" | "texture" | "template";
  previewUrl: string;
  printUrl: string;
  width: number;
  height: number;
  dpi: number;
  transparent: boolean;
  background?: string;
  license: AssetLicense;
  credit?: string;
  sourceUrl?: string;
  safeForPrint: boolean;
  printNotes?: string;
};

export type SvgAssetPreset = PrintAssetPreset & {
  svg?: string;
  tag?: string;
};

export function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function unsplashPhoto(id: string, w = 4096) {
  return `https://images.unsplash.com/${id}?q=95&w=${w}&auto=format&fit=crop`;
}

export function makeSvgAsset(title: string, icon: string, a: string, b: string, c = "#ffffff") {
  const esc = (v: string) =>
    String(v).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] || m));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="4500" height="5400" viewBox="0 0 4500 5400"><rect width="4500" height="5400" fill="transparent"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="42" stdDeviation="42" flood-color="#000" flood-opacity=".25"/></filter></defs><text x="2250" y="2440" text-anchor="middle" font-size="1380" font-family="Arial, sans-serif" filter="url(#s)">${esc(icon)}</text><text x="2250" y="3360" text-anchor="middle" font-size="330" font-weight="900" font-family="Arial Black, Impact, Arial" fill="url(#g)" filter="url(#s)">${esc(title)}</text></svg>`;
}

const makeAsset = (
  id: string,
  title: string,
  category: string,
  tags: string[],
  photoId: string,
  extra: Partial<PrintAssetPreset> = {}
): PrintAssetPreset => ({
  id,
  title,
  label: title,
  category,
  collection: category,
  tags,
  type: extra.type || "photo",
  previewUrl: extra.previewUrl || unsplashPhoto(photoId, 1600),
  printUrl: extra.printUrl || unsplashPhoto(photoId, 4096),
  width: extra.width || 4096,
  height: extra.height || 4096,
  dpi: extra.dpi || 300,
  transparent: extra.transparent ?? false,
  background: extra.background || "transparent",
  license: extra.license || "unsplash-license",
  credit: extra.credit || "Unsplash",
  sourceUrl: extra.sourceUrl,
  safeForPrint: extra.safeForPrint ?? true,
  printNotes:
    extra.printNotes ||
    "High-resolution photographic asset. For POD resale, verify the final asset license and avoid trademarked/recognizable protected content.",
});

export const PRINT_ASSET_CATEGORIES = [
  "Featured",
  "Streetwear",
  "Vintage",
  "Nature",
  "Luxury",
  "Texture",
  "Gym",
  "Gaming",
  "Tattoo",
  "Travel",
  "Animals",
  "Abstract",
] as const;

export const IMAGE_TEMPLATES: PrintAssetPreset[] = [
  makeAsset("streetwear-neon-001", "Neon Street Texture", "Streetwear", ["streetwear", "neon", "urban", "poster"], "photo-1550684376-efcbd6e3f031"),
  makeAsset("streetwear-wall-002", "Urban Wall Print", "Streetwear", ["wall", "grunge", "oversized"], "photo-1500530855697-b586d89ba3ee"),
  makeAsset("streetwear-night-003", "Night City Drop", "Streetwear", ["city", "night", "drop"], "photo-1519501025264-65ba15a82390"),
  makeAsset("streetwear-smoke-004", "Smoke Graphic", "Streetwear", ["smoke", "dark", "print"], "photo-1493246507139-91e8fad9978e"),

  makeAsset("vintage-sunset-001", "Vintage Sunset", "Vintage", ["sunset", "retro", "washed"], "photo-1500534314209-a25ddb2bd429"),
  makeAsset("vintage-car-002", "Retro Road", "Vintage", ["road", "travel", "retro"], "photo-1500534314209-a25ddb2bd429"),
  makeAsset("vintage-desert-003", "Desert Poster", "Vintage", ["desert", "warm", "poster"], "photo-1509316785289-025f5b846b35"),
  makeAsset("vintage-film-004", "Film Grain Mood", "Vintage", ["grain", "analog", "film"], "photo-1492684223066-81342ee5ff30"),

  makeAsset("nature-mountain-001", "Mountain Crest", "Nature", ["mountain", "outdoor", "adventure"], "photo-1506905925346-21bda4d32df4"),
  makeAsset("nature-ocean-002", "Ocean Wave", "Nature", ["ocean", "wave", "summer"], "photo-1507525428034-b723cf961d3e"),
  makeAsset("nature-forest-003", "Forest Print", "Nature", ["forest", "green", "camp"], "photo-1448375240586-882707db888b"),
  makeAsset("nature-flower-004", "Botanical Bloom", "Nature", ["flower", "botanical", "soft"], "photo-1490750967868-88aa4486c946"),

  makeAsset("luxury-marble-001", "Black Marble", "Luxury", ["marble", "black", "premium"], "photo-1618005198919-d3d4b5a92ead"),
  makeAsset("luxury-gold-002", "Gold Detail", "Luxury", ["gold", "premium", "elegant"], "photo-1618005182384-a83a8bd57fbe"),
  makeAsset("luxury-silk-003", "Silk Shadow", "Luxury", ["fabric", "silk", "elegant"], "photo-1515886657613-9f3515b0c78f"),
  makeAsset("luxury-architecture-004", "Premium Lines", "Luxury", ["architecture", "minimal", "premium"], "photo-1518005020951-eccb494ad742"),

  makeAsset("texture-grunge-001", "Grunge Texture", "Texture", ["texture", "distressed", "grunge"], "photo-1518655048521-f130df041f66"),
  makeAsset("texture-paper-002", "Paper Grain", "Texture", ["paper", "grain", "poster"], "photo-1500530855697-b586d89ba3ee"),
  makeAsset("texture-concrete-003", "Concrete Print", "Texture", ["concrete", "urban", "neutral"], "photo-1518005020951-eccb494ad742"),
  makeAsset("texture-water-004", "Liquid Texture", "Texture", ["water", "liquid", "abstract"], "photo-1507525428034-b723cf961d3e"),

  makeAsset("gym-steel-001", "Steel Power", "Gym", ["gym", "steel", "power"], "photo-1534438327276-14e5300c3a48"),
  makeAsset("gym-motion-002", "Motion Energy", "Gym", ["fitness", "motion", "sport"], "photo-1517836357463-d25dfeac3438"),
  makeAsset("gym-dark-003", "Dark Training", "Gym", ["training", "dark", "hardcore"], "photo-1571019613454-1cb2f99b2d8b"),
  makeAsset("gym-run-004", "Run Club", "Gym", ["running", "sport", "club"], "photo-1461896836934-ffe607ba8211"),

  makeAsset("gaming-cyber-001", "Cyber Grid", "Gaming", ["gaming", "cyber", "neon"], "photo-1550745165-9bc0b252726f"),
  makeAsset("gaming-purple-002", "Purple Arena", "Gaming", ["purple", "arena", "esports"], "photo-1511512578047-dfb367046420"),
  makeAsset("gaming-keyboard-003", "RGB Keys", "Gaming", ["rgb", "keyboard", "tech"], "photo-1542751371-adc38448a05e"),
  makeAsset("gaming-controller-004", "Controller Mood", "Gaming", ["controller", "game", "stream"], "photo-1493711662062-fa541adb3fc8"),

  makeAsset("tattoo-skull-001", "Dark Skull Mood", "Tattoo", ["skull", "dark", "tattoo"], "photo-1515405295579-ba7b45403062"),
  makeAsset("tattoo-rose-002", "Rose Ink", "Tattoo", ["rose", "ink", "classic"], "photo-1490750967868-88aa4486c946"),
  makeAsset("tattoo-snake-003", "Snake Luxury", "Tattoo", ["snake", "luxury", "tattoo"], "photo-1534447677768-be436bb09401"),
  makeAsset("tattoo-tiger-004", "Vintage Tiger", "Tattoo", ["tiger", "wild", "vintage"], "photo-1579783902614-a3fb3927b6a5"),

  makeAsset("travel-paris-001", "Paris Poster", "Travel", ["paris", "travel", "poster"], "photo-1502602898657-3e91760cbb34"),
  makeAsset("travel-beach-002", "Summer Beach", "Travel", ["beach", "summer", "vacation"], "photo-1507525428034-b723cf961d3e"),
  makeAsset("travel-road-003", "Road Trip", "Travel", ["road", "trip", "adventure"], "photo-1500534314209-a25ddb2bd429"),
  makeAsset("travel-alps-004", "Alpine Club", "Travel", ["alps", "mountain", "club"], "photo-1506905925346-21bda4d32df4"),

  makeAsset("animals-wolf-001", "Wolf Mood", "Animals", ["wolf", "wild", "animal"], "photo-1546182990-dffeafbe841d"),
  makeAsset("animals-lion-002", "Lion Power", "Animals", ["lion", "power", "wild"], "photo-1546182990-dffeafbe841d"),
  makeAsset("animals-bird-003", "Bird Flight", "Animals", ["bird", "flight", "nature"], "photo-1444464666168-49d633b86797"),
  makeAsset("animals-horse-004", "Horse Spirit", "Animals", ["horse", "western", "spirit"], "photo-1553284965-83fd3e82fa5a"),

  makeAsset("abstract-fluid-001", "Fluid Abstract", "Abstract", ["abstract", "fluid", "art"], "photo-1541701494587-cb58502866ab"),
  makeAsset("abstract-gradient-002", "Gradient Flow", "Abstract", ["gradient", "flow", "modern"], "photo-1557683316-973673baf926"),
  makeAsset("abstract-light-003", "Light Burst", "Abstract", ["light", "burst", "energy"], "photo-1500530855697-b586d89ba3ee"),
  makeAsset("abstract-chrome-004", "Chrome Blur", "Abstract", ["chrome", "blur", "premium"], "photo-1618005198919-d3d4b5a92ead"),
];

export const FEATURED_PRINT_ASSETS = IMAGE_TEMPLATES.slice(0, 12);
