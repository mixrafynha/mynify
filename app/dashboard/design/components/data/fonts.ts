export type FontCategory = "sans" | "serif" | "display" | "handwritten" | "luxury" | "sporty" | "streetwear" | "kids" | "minimalist" | "retro";

export type FontItem = {
  id: string;
  family: string;
  category: FontCategory;
  preview: string;
  previewSvg?: string;
  google?: string;
  premium?: boolean;
};

export const FONT_CATEGORIES: FontCategory[] = ["minimalist", "sans", "luxury", "serif", "display", "sporty", "handwritten", "streetwear", "retro", "kids"];

const PREMIUM_PREVIEW = "RYFIO";

export const FONT_ITEMS: FontItem[] = [
  { id: "inter", family: "Inter", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/inter.svg", google: "Inter", premium: true },
  { id: "geist", family: "Geist", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/geist.svg", google: "Geist", premium: true },
  { id: "manrope", family: "Manrope", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/manrope.svg", google: "Manrope", premium: true },
  { id: "sora", family: "Sora", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/sora.svg", google: "Sora", premium: true },
  { id: "onest", family: "Onest", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/onest.svg", google: "Onest", premium: true },
  { id: "outfit", family: "Outfit", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/outfit.svg", google: "Outfit", premium: true },
  { id: "urbanist", family: "Urbanist", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/urbanist.svg", google: "Urbanist", premium: true },
  { id: "plus-jakarta-sans", family: "Plus Jakarta Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/plus-jakarta-sans.svg", google: "Plus Jakarta Sans", premium: true },
  { id: "dm-sans", family: "DM Sans", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/dm-sans.svg", google: "DM Sans", premium: true },
  { id: "figtree", family: "Figtree", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/figtree.svg", google: "Figtree", premium: true },
  { id: "public-sans", family: "Public Sans", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/public-sans.svg", google: "Public Sans", premium: true },
  { id: "instrument-sans", family: "Instrument Sans", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/instrument-sans.svg", google: "Instrument Sans", premium: true },
  { id: "space-grotesk", family: "Space Grotesk", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/space-grotesk.svg", google: "Space Grotesk", premium: true },
  { id: "ibm-plex-sans", family: "IBM Plex Sans", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/ibm-plex-sans.svg", google: "IBM Plex Sans", premium: true },
  { id: "ibm-plex-sans-condensed", family: "IBM Plex Sans Condensed", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/ibm-plex-sans-condensed.svg", google: "IBM Plex Sans Condensed", premium: true },
  { id: "work-sans", family: "Work Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/work-sans.svg", google: "Work Sans", premium: true },
  { id: "archivo", family: "Archivo", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/archivo.svg", google: "Archivo", premium: true },
  { id: "archivo-narrow", family: "Archivo Narrow", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/archivo-narrow.svg", google: "Archivo Narrow", premium: true },
  { id: "barlow", family: "Barlow", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/barlow.svg", google: "Barlow", premium: true },
  { id: "barlow-condensed", family: "Barlow Condensed", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/barlow-condensed.svg", google: "Barlow Condensed", premium: true },
  { id: "karla", family: "Karla", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/karla.svg", google: "Karla", premium: true },
  { id: "lexend", family: "Lexend", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/lexend.svg", google: "Lexend", premium: true },
  { id: "rubik", family: "Rubik", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik.svg", google: "Rubik", premium: true },
  { id: "raleway", family: "Raleway", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/raleway.svg", google: "Raleway", premium: true },
  { id: "montserrat", family: "Montserrat", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/montserrat.svg", google: "Montserrat", premium: true },
  { id: "montserrat-alternates", family: "Montserrat Alternates", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/montserrat-alternates.svg", google: "Montserrat Alternates", premium: true },
  { id: "poppins", family: "Poppins", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/poppins.svg", google: "Poppins", premium: true },
  { id: "nunito-sans", family: "Nunito Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/nunito-sans.svg", google: "Nunito Sans", premium: true },
  { id: "mulish", family: "Mulish", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/mulish.svg", google: "Mulish", premium: true },
  { id: "cabin", family: "Cabin", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cabin.svg", google: "Cabin", premium: true },
  { id: "fira-sans", family: "Fira Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/fira-sans.svg", google: "Fira Sans", premium: true },
  { id: "source-sans-3", family: "Source Sans 3", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/source-sans-3.svg", google: "Source Sans 3", premium: true },
  { id: "noto-sans", family: "Noto Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/noto-sans.svg", google: "Noto Sans", premium: true },
  { id: "hanken-grotesk", family: "Hanken Grotesk", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/hanken-grotesk.svg", google: "Hanken Grotesk", premium: true },
  { id: "albert-sans", family: "Albert Sans", category: "minimalist", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/albert-sans.svg", google: "Albert Sans", premium: true },
  { id: "red-hat-display", family: "Red Hat Display", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/red-hat-display.svg", google: "Red Hat Display", premium: true },
  { id: "red-hat-text", family: "Red Hat Text", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/red-hat-text.svg", google: "Red Hat Text", premium: true },
  { id: "epilogue", family: "Epilogue", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/epilogue.svg", google: "Epilogue", premium: true },
  { id: "syne", family: "Syne", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/syne.svg", google: "Syne", premium: true },
  { id: "prompt", family: "Prompt", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/prompt.svg", google: "Prompt", premium: true },
  { id: "kanit", family: "Kanit", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/kanit.svg", google: "Kanit", premium: true },
  { id: "josefin-sans", family: "Josefin Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/josefin-sans.svg", google: "Josefin Sans", premium: true },
  { id: "quicksand", family: "Quicksand", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/quicksand.svg", google: "Quicksand", premium: true },
  { id: "alegreya-sans", family: "Alegreya Sans", category: "sans", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/alegreya-sans.svg", google: "Alegreya Sans", premium: true },
  { id: "playfair-display", family: "Playfair Display", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/playfair-display.svg", google: "Playfair Display", premium: true },
  { id: "cormorant-garamond", family: "Cormorant Garamond", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cormorant-garamond.svg", google: "Cormorant Garamond", premium: true },
  { id: "cormorant-sc", family: "Cormorant SC", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cormorant-sc.svg", google: "Cormorant SC", premium: true },
  { id: "cormorant-infant", family: "Cormorant Infant", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cormorant-infant.svg", google: "Cormorant Infant", premium: true },
  { id: "bodoni-moda", family: "Bodoni Moda", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bodoni-moda.svg", google: "Bodoni Moda", premium: true },
  { id: "prata", family: "Prata", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/prata.svg", google: "Prata", premium: true },
  { id: "gloock", family: "Gloock", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/gloock.svg", google: "Gloock", premium: true },
  { id: "bellefair", family: "Bellefair", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bellefair.svg", google: "Bellefair", premium: true },
  { id: "marcellus", family: "Marcellus", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/marcellus.svg", google: "Marcellus", premium: true },
  { id: "vidaloka", family: "Vidaloka", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/vidaloka.svg", google: "Vidaloka", premium: true },
  { id: "fraunces", family: "Fraunces", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/fraunces.svg", google: "Fraunces", premium: true },
  { id: "cinzel", family: "Cinzel", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cinzel.svg", google: "Cinzel", premium: true },
  { id: "forum", family: "Forum", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/forum.svg", google: "Forum", premium: true },
  { id: "italiana", family: "Italiana", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/italiana.svg", google: "Italiana", premium: true },
  { id: "libre-baskerville", family: "Libre Baskerville", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/libre-baskerville.svg", google: "Libre Baskerville", premium: true },
  { id: "lora", family: "Lora", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/lora.svg", google: "Lora", premium: true },
  { id: "eb-garamond", family: "EB Garamond", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/eb-garamond.svg", google: "EB Garamond", premium: true },
  { id: "crimson-text", family: "Crimson Text", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/crimson-text.svg", google: "Crimson Text", premium: true },
  { id: "source-serif-4", family: "Source Serif 4", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/source-serif-4.svg", google: "Source Serif 4", premium: true },
  { id: "dm-serif-display", family: "DM Serif Display", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/dm-serif-display.svg", google: "DM Serif Display", premium: true },
  { id: "newsreader", family: "Newsreader", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/newsreader.svg", google: "Newsreader", premium: true },
  { id: "spectral", family: "Spectral", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/spectral.svg", google: "Spectral", premium: true },
  { id: "alegreya", family: "Alegreya", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/alegreya.svg", google: "Alegreya", premium: true },
  { id: "cardo", family: "Cardo", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cardo.svg", google: "Cardo", premium: true },
  { id: "unna", family: "Unna", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/unna.svg", google: "Unna", premium: true },
  { id: "balthazar", family: "Balthazar", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/balthazar.svg", google: "Balthazar", premium: true },
  { id: "sorts-mill-goudy", family: "Sorts Mill Goudy", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/sorts-mill-goudy.svg", google: "Sorts Mill Goudy", premium: true },
  { id: "josefin-slab", family: "Josefin Slab", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/josefin-slab.svg", google: "Josefin Slab", premium: true },
  { id: "noto-serif-display", family: "Noto Serif Display", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/noto-serif-display.svg", google: "Noto Serif Display", premium: true },
  { id: "noto-serif", family: "Noto Serif", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/noto-serif.svg", google: "Noto Serif", premium: true },
  { id: "bitter", family: "Bitter", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bitter.svg", google: "Bitter", premium: true },
  { id: "domine", family: "Domine", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/domine.svg", google: "Domine", premium: true },
  { id: "vollkorn", family: "Vollkorn", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/vollkorn.svg", google: "Vollkorn", premium: true },
  { id: "arvo", family: "Arvo", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/arvo.svg", google: "Arvo", premium: true },
  { id: "zilla-slab", family: "Zilla Slab", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/zilla-slab.svg", google: "Zilla Slab", premium: true },
  { id: "roboto-slab", family: "Roboto Slab", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/roboto-slab.svg", google: "Roboto Slab", premium: true },
  { id: "pt-serif", family: "PT Serif", category: "serif", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/pt-serif.svg", google: "PT Serif", premium: true },
  { id: "abril-fatface", family: "Abril Fatface", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/abril-fatface.svg", google: "Abril Fatface", premium: true },
  { id: "yeseva-one", family: "Yeseva One", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/yeseva-one.svg", google: "Yeseva One", premium: true },
  { id: "tenor-sans", family: "Tenor Sans", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/tenor-sans.svg", google: "Tenor Sans", premium: true },
  { id: "poiret-one", family: "Poiret One", category: "luxury", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/poiret-one.svg", google: "Poiret One", premium: true },
  { id: "bebas-neue", family: "Bebas Neue", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bebas-neue.svg", google: "Bebas Neue", premium: true },
  { id: "anton", family: "Anton", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/anton.svg", google: "Anton", premium: true },
  { id: "oswald", family: "Oswald", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/oswald.svg", google: "Oswald", premium: true },
  { id: "archivo-black", family: "Archivo Black", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/archivo-black.svg", google: "Archivo Black", premium: true },
  { id: "league-spartan", family: "League Spartan", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/league-spartan.svg", google: "League Spartan", premium: true },
  { id: "teko", family: "Teko", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/teko.svg", google: "Teko", premium: true },
  { id: "fjalla-one", family: "Fjalla One", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/fjalla-one.svg", google: "Fjalla One", premium: true },
  { id: "alfa-slab-one", family: "Alfa Slab One", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/alfa-slab-one.svg", google: "Alfa Slab One", premium: true },
  { id: "black-ops-one", family: "Black Ops One", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/black-ops-one.svg", google: "Black Ops One", premium: true },
  { id: "bungee", family: "Bungee", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bungee.svg", google: "Bungee", premium: true },
  { id: "bungee-shade", family: "Bungee Shade", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bungee-shade.svg", google: "Bungee Shade", premium: true },
  { id: "bungee-inline", family: "Bungee Inline", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bungee-inline.svg", google: "Bungee Inline", premium: true },
  { id: "righteous", family: "Righteous", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/righteous.svg", google: "Righteous", premium: true },
  { id: "monoton", family: "Monoton", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/monoton.svg", google: "Monoton", premium: true },
  { id: "press-start-2p", family: "Press Start 2P", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/press-start-2p.svg", google: "Press Start 2P", premium: true },
  { id: "luckiest-guy", family: "Luckiest Guy", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/luckiest-guy.svg", google: "Luckiest Guy", premium: true },
  { id: "titan-one", family: "Titan One", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/titan-one.svg", google: "Titan One", premium: true },
  { id: "lilita-one", family: "Lilita One", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/lilita-one.svg", google: "Lilita One", premium: true },
  { id: "changa-one", family: "Changa One", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/changa-one.svg", google: "Changa One", premium: true },
  { id: "bowlby-one-sc", family: "Bowlby One SC", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bowlby-one-sc.svg", google: "Bowlby One SC", premium: true },
  { id: "graduate", family: "Graduate", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/graduate.svg", google: "Graduate", premium: true },
  { id: "staatliches", family: "Staatliches", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/staatliches.svg", google: "Staatliches", premium: true },
  { id: "syncopate", family: "Syncopate", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/syncopate.svg", google: "Syncopate", premium: true },
  { id: "major-mono-display", family: "Major Mono Display", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/major-mono-display.svg", google: "Major Mono Display", premium: true },
  { id: "orbitron", family: "Orbitron", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/orbitron.svg", google: "Orbitron", premium: true },
  { id: "russo-one", family: "Russo One", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/russo-one.svg", google: "Russo One", premium: true },
  { id: "audiowide", family: "Audiowide", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/audiowide.svg", google: "Audiowide", premium: true },
  { id: "michroma", family: "Michroma", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/michroma.svg", google: "Michroma", premium: true },
  { id: "rajdhani", family: "Rajdhani", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rajdhani.svg", google: "Rajdhani", premium: true },
  { id: "quantico", family: "Quantico", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/quantico.svg", google: "Quantico", premium: true },
  { id: "saira-condensed", family: "Saira Condensed", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/saira-condensed.svg", google: "Saira Condensed", premium: true },
  { id: "saira-extra-condensed", family: "Saira Extra Condensed", category: "sporty", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/saira-extra-condensed.svg", google: "Saira Extra Condensed", premium: true },
  { id: "six-caps", family: "Six Caps", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/six-caps.svg", google: "Six Caps", premium: true },
  { id: "big-shoulders-display", family: "Big Shoulders Display", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/big-shoulders-display.svg", google: "Big Shoulders Display", premium: true },
  { id: "big-shoulders-inline-display", family: "Big Shoulders Inline Display", category: "display", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/big-shoulders-inline-display.svg", google: "Big Shoulders Inline Display", premium: true },
  { id: "great-vibes", family: "Great Vibes", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/great-vibes.svg", google: "Great Vibes", premium: true },
  { id: "allura", family: "Allura", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/allura.svg", google: "Allura", premium: true },
  { id: "alex-brush", family: "Alex Brush", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/alex-brush.svg", google: "Alex Brush", premium: true },
  { id: "parisienne", family: "Parisienne", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/parisienne.svg", google: "Parisienne", premium: true },
  { id: "qwigley", family: "Qwigley", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/qwigley.svg", google: "Qwigley", premium: true },
  { id: "sacramento", family: "Sacramento", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/sacramento.svg", google: "Sacramento", premium: true },
  { id: "dancing-script", family: "Dancing Script", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/dancing-script.svg", google: "Dancing Script", premium: true },
  { id: "petit-formal-script", family: "Petit Formal Script", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/petit-formal-script.svg", google: "Petit Formal Script", premium: true },
  { id: "pinyon-script", family: "Pinyon Script", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/pinyon-script.svg", google: "Pinyon Script", premium: true },
  { id: "tangerine", family: "Tangerine", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/tangerine.svg", google: "Tangerine", premium: true },
  { id: "cormorant-upright", family: "Cormorant Upright", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cormorant-upright.svg", google: "Cormorant Upright", premium: true },
  { id: "kaushan-script", family: "Kaushan Script", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/kaushan-script.svg", google: "Kaushan Script", premium: true },
  { id: "yellowtail", family: "Yellowtail", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/yellowtail.svg", google: "Yellowtail", premium: true },
  { id: "courgette", family: "Courgette", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/courgette.svg", google: "Courgette", premium: true },
  { id: "satisfy", family: "Satisfy", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/satisfy.svg", google: "Satisfy", premium: true },
  { id: "lobster", family: "Lobster", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/lobster.svg", google: "Lobster", premium: true },
  { id: "lobster-two", family: "Lobster Two", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/lobster-two.svg", google: "Lobster Two", premium: true },
  { id: "pacifico", family: "Pacifico", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/pacifico.svg", google: "Pacifico", premium: true },
  { id: "playball", family: "Playball", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/playball.svg", google: "Playball", premium: true },
  { id: "cookie", family: "Cookie", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cookie.svg", google: "Cookie", premium: true },
  { id: "caveat", family: "Caveat", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/caveat.svg", google: "Caveat", premium: true },
  { id: "kalam", family: "Kalam", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/kalam.svg", google: "Kalam", premium: true },
  { id: "patrick-hand", family: "Patrick Hand", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/patrick-hand.svg", google: "Patrick Hand", premium: true },
  { id: "permanent-marker", family: "Permanent Marker", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/permanent-marker.svg", google: "Permanent Marker", premium: true },
  { id: "shadows-into-light", family: "Shadows Into Light", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/shadows-into-light.svg", google: "Shadows Into Light", premium: true },
  { id: "gloria-hallelujah", family: "Gloria Hallelujah", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/gloria-hallelujah.svg", google: "Gloria Hallelujah", premium: true },
  { id: "architects-daughter", family: "Architects Daughter", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/architects-daughter.svg", google: "Architects Daughter", premium: true },
  { id: "reenie-beanie", family: "Reenie Beanie", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/reenie-beanie.svg", google: "Reenie Beanie", premium: true },
  { id: "homemade-apple", family: "Homemade Apple", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/homemade-apple.svg", google: "Homemade Apple", premium: true },
  { id: "rock-salt", family: "Rock Salt", category: "handwritten", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rock-salt.svg", google: "Rock Salt", premium: true },
  { id: "rubik-spray-paint", family: "Rubik Spray Paint", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-spray-paint.svg", google: "Rubik Spray Paint", premium: true },
  { id: "rubik-dirt", family: "Rubik Dirt", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-dirt.svg", google: "Rubik Dirt", premium: true },
  { id: "rubik-glitch", family: "Rubik Glitch", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-glitch.svg", google: "Rubik Glitch", premium: true },
  { id: "rubik-microbe", family: "Rubik Microbe", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-microbe.svg", google: "Rubik Microbe", premium: true },
  { id: "rubik-burned", family: "Rubik Burned", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-burned.svg", google: "Rubik Burned", premium: true },
  { id: "rubik-beastly", family: "Rubik Beastly", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-beastly.svg", google: "Rubik Beastly", premium: true },
  { id: "rubik-moonrocks", family: "Rubik Moonrocks", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-moonrocks.svg", google: "Rubik Moonrocks", premium: true },
  { id: "rubik-puddles", family: "Rubik Puddles", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-puddles.svg", google: "Rubik Puddles", premium: true },
  { id: "rubik-vinyl", family: "Rubik Vinyl", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rubik-vinyl.svg", google: "Rubik Vinyl", premium: true },
  { id: "bungee-outline", family: "Bungee Outline", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bungee-outline.svg", google: "Bungee Outline", premium: true },
  { id: "knewave", family: "Knewave", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/knewave.svg", google: "Knewave", premium: true },
  { id: "frijole", family: "Frijole", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/frijole.svg", google: "Frijole", premium: true },
  { id: "nosifer", family: "Nosifer", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/nosifer.svg", google: "Nosifer", premium: true },
  { id: "creepster", family: "Creepster", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/creepster.svg", google: "Creepster", premium: true },
  { id: "metal-mania", family: "Metal Mania", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/metal-mania.svg", google: "Metal Mania", premium: true },
  { id: "new-rocker", family: "New Rocker", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/new-rocker.svg", google: "New Rocker", premium: true },
  { id: "pirata-one", family: "Pirata One", category: "streetwear", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/pirata-one.svg", google: "Pirata One", premium: true },
  { id: "limelight", family: "Limelight", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/limelight.svg", google: "Limelight", premium: true },
  { id: "rye", family: "Rye", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rye.svg", google: "Rye", premium: true },
  { id: "ultra", family: "Ultra", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/ultra.svg", google: "Ultra", premium: true },
  { id: "sancreek", family: "Sancreek", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/sancreek.svg", google: "Sancreek", premium: true },
  { id: "special-elite", family: "Special Elite", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/special-elite.svg", google: "Special Elite", premium: true },
  { id: "fascinate-inline", family: "Fascinate Inline", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/fascinate-inline.svg", google: "Fascinate Inline", premium: true },
  { id: "bangers", family: "Bangers", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bangers.svg", google: "Bangers", premium: true },
  { id: "ewert", family: "Ewert", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/ewert.svg", google: "Ewert", premium: true },
  { id: "flavors", family: "Flavors", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/flavors.svg", google: "Flavors", premium: true },
  { id: "honk", family: "Honk", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/honk.svg", google: "Honk", premium: true },
  { id: "modak", family: "Modak", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/modak.svg", google: "Modak", premium: true },
  { id: "rammetto-one", family: "Rammetto One", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/rammetto-one.svg", google: "Rammetto One", premium: true },
  { id: "smokum", family: "Smokum", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/smokum.svg", google: "Smokum", premium: true },
  { id: "londrina-solid", family: "Londrina Solid", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/londrina-solid.svg", google: "Londrina Solid", premium: true },
  { id: "londrina-shadow", family: "Londrina Shadow", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/londrina-shadow.svg", google: "Londrina Shadow", premium: true },
  { id: "londrina-sketch", family: "Londrina Sketch", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/londrina-sketch.svg", google: "Londrina Sketch", premium: true },
  { id: "fugaz-one", family: "Fugaz One", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/fugaz-one.svg", google: "Fugaz One", premium: true },
  { id: "shrikhand", family: "Shrikhand", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/shrikhand.svg", google: "Shrikhand", premium: true },
  { id: "oleo-script", family: "Oleo Script", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/oleo-script.svg", google: "Oleo Script", premium: true },
  { id: "oleo-script-swash-caps", family: "Oleo Script Swash Caps", category: "retro", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/oleo-script-swash-caps.svg", google: "Oleo Script Swash Caps", premium: true },
  { id: "fredoka", family: "Fredoka", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/fredoka.svg", google: "Fredoka", premium: true },
  { id: "baloo-2", family: "Baloo 2", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/baloo-2.svg", google: "Baloo 2", premium: true },
  { id: "bubblegum-sans", family: "Bubblegum Sans", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/bubblegum-sans.svg", google: "Bubblegum Sans", premium: true },
  { id: "chewy", family: "Chewy", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/chewy.svg", google: "Chewy", premium: true },
  { id: "cherry-bomb-one", family: "Cherry Bomb One", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/cherry-bomb-one.svg", google: "Cherry Bomb One", premium: true },
  { id: "dynapuff", family: "DynaPuff", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/dynapuff.svg", google: "DynaPuff", premium: true },
  { id: "gaegu", family: "Gaegu", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/gaegu.svg", google: "Gaegu", premium: true },
  { id: "gochi-hand", family: "Gochi Hand", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/gochi-hand.svg", google: "Gochi Hand", premium: true },
  { id: "happy-monkey", family: "Happy Monkey", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/happy-monkey.svg", google: "Happy Monkey", premium: true },
  { id: "jua", family: "Jua", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/jua.svg", google: "Jua", premium: true },
  { id: "mochiy-pop-one", family: "Mochiy Pop One", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/mochiy-pop-one.svg", google: "Mochiy Pop One", premium: true },
  { id: "nerko-one", family: "Nerko One", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/nerko-one.svg", google: "Nerko One", premium: true },
  { id: "schoolbell", family: "Schoolbell", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/schoolbell.svg", google: "Schoolbell", premium: true },
  { id: "sniglet", family: "Sniglet", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/sniglet.svg", google: "Sniglet", premium: true },
  { id: "comic-neue", family: "Comic Neue", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/comic-neue.svg", google: "Comic Neue", premium: true },
  { id: "atma", family: "Atma", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/atma.svg", google: "Atma", premium: true },
  { id: "mali", family: "Mali", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/mali.svg", google: "Mali", premium: true },
  { id: "short-stack", family: "Short Stack", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/short-stack.svg", google: "Short Stack", premium: true },
  { id: "coming-soon", family: "Coming Soon", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/coming-soon.svg", google: "Coming Soon", premium: true },
  { id: "love-ya-like-a-sister", family: "Love Ya Like A Sister", category: "kids", preview: PREMIUM_PREVIEW, previewSvg: "/font-previews/love-ya-like-a-sister.svg", google: "Love Ya Like A Sister", premium: true },
];

export const FONTS = FONT_ITEMS.map((font) => font.family);
export const FONT_OPTIONS = FONTS;

const LOADED_EDITOR_FONTS = new Set<string>();
const LOADING_EDITOR_FONTS = new Map<string, Promise<void>>();

function normalizeFamily(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getFontsByCategory(category: FontCategory | "all") {
  return category === "all" ? FONT_ITEMS : FONT_ITEMS.filter((font) => font.category === category);
}

export function getFontByFamily(family?: string) {
  if (!family) return undefined;
  const normalized = normalizeFamily(family).toLowerCase();
  return FONT_ITEMS.find((font) => font.family.toLowerCase() === normalized);
}

export function isValidEditorFontFamily(family?: string) {
  return Boolean(getFontByFamily(family));
}

export function getEditorFontFamily(family?: string, fallback = "Inter") {
  const font = getFontByFamily(family) ?? getFontByFamily(fallback) ?? FONT_ITEMS[0];
  return `"${font.family}", sans-serif`;
}

const SINGLE_WEIGHT_FONTS = new Set([
  "Abril Fatface",
  "Alex Brush",
  "Alfa Slab One",
  "Allura",
  "Anton",
  "Architects Daughter",
  "Archivo Black",
  "Audiowide",
  "Bangers",
  "Bebas Neue",
  "Black Ops One",
  "Bowlby One SC",
  "Bungee",
  "Bungee Inline",
  "Bungee Outline",
  "Bungee Shade",
  "Cookie",
  "Courgette",
  "Creepster",
  "DM Serif Display",
  "Fascinate Inline",
  "Fjalla One",
  "Flavors",
  "Frijole",
  "Fugaz One",
  "Gloock",
  "Great Vibes",
  "Homemade Apple",
  "Knewave",
  "Limelight",
  "Lobster",
  "Luckiest Guy",
  "Major Mono Display",
  "Metal Mania",
  "Michroma",
  "Modak",
  "Monoton",
  "New Rocker",
  "Nosifer",
  "Pacifico",
  "Parisienne",
  "Permanent Marker",
  "Pirata One",
  "Playball",
  "Poiret One",
  "Press Start 2P",
  "Prata",
  "Rammetto One",
  "Righteous",
  "Rock Salt",
  "Rubik Beastly",
  "Rubik Burned",
  "Rubik Dirt",
  "Rubik Glitch",
  "Rubik Microbe",
  "Rubik Moonrocks",
  "Rubik Puddles",
  "Rubik Spray Paint",
  "Rubik Vinyl",
  "Rye",
  "Sacramento",
  "Sancreek",
  "Satisfy",
  "Shrikhand",
  "Smokum",
  "Special Elite",
  "Staatliches",
  "Titan One",
  "Ultra",
  "Yeseva One",
]);

const FONT_WEIGHT_OVERRIDES: Record<string, number[]> = {
  Inter: [400, 500, 600, 700, 800, 900],
  Geist: [400, 500, 600, 700, 800, 900],
  Manrope: [400, 500, 600, 700, 800],
  Sora: [400, 500, 600, 700, 800],
  Onest: [400, 500, 600, 700, 800],
  Outfit: [400, 500, 600, 700, 800, 900],
  Urbanist: [400, 500, 600, 700, 800, 900],
  "Plus Jakarta Sans": [400, 500, 600, 700, 800],
  "DM Sans": [400, 500, 600, 700, 800, 900],
  Figtree: [400, 500, 600, 700, 800, 900],
  "Public Sans": [400, 500, 600, 700, 800, 900],
  "Instrument Sans": [400, 500, 600, 700],
  "Space Grotesk": [400, 500, 600, 700],
  "IBM Plex Sans": [400, 500, 600, 700],
  "IBM Plex Sans Condensed": [400, 500, 600, 700],
  "Work Sans": [400, 500, 600, 700, 800, 900],
  Archivo: [400, 500, 600, 700, 800, 900],
  "Archivo Narrow": [400, 500, 600, 700],
  Barlow: [400, 500, 600, 700, 800, 900],
  "Barlow Condensed": [400, 500, 600, 700, 800, 900],
  Karla: [400, 500, 600, 700, 800],
  Lexend: [400, 500, 600, 700, 800, 900],
  Rubik: [400, 500, 600, 700, 800, 900],
  Raleway: [400, 500, 600, 700, 800, 900],
  Montserrat: [400, 500, 600, 700, 800, 900],
  "Montserrat Alternates": [400, 500, 600, 700, 800, 900],
  Poppins: [400, 500, 600, 700, 800, 900],
  "Nunito Sans": [400, 500, 600, 700, 800, 900],
  Mulish: [400, 500, 600, 700, 800, 900],
  Cabin: [400, 500, 600, 700],
  "Fira Sans": [400, 500, 600, 700, 800, 900],
  "Source Sans 3": [400, 500, 600, 700, 800, 900],
  "Noto Sans": [400, 500, 600, 700, 800, 900],
  "Hanken Grotesk": [400, 500, 600, 700, 800, 900],
  "Albert Sans": [400, 500, 600, 700, 800, 900],
  "Red Hat Display": [400, 500, 600, 700, 800, 900],
  "Red Hat Text": [400, 500, 600, 700],
  Epilogue: [400, 500, 600, 700, 800, 900],
  Syne: [400, 500, 600, 700, 800],
  Prompt: [400, 500, 600, 700, 800, 900],
  Kanit: [400, 500, 600, 700, 800, 900],
  "Josefin Sans": [400, 500, 600, 700],
  Quicksand: [400, 500, 600, 700],
  "Alegreya Sans": [400, 500, 600, 700, 800, 900],
  "Playfair Display": [400, 500, 600, 700, 800, 900],
  "Cormorant Garamond": [400, 500, 600, 700],
  "Cormorant SC": [400, 500, 600, 700],
  "Cormorant Infant": [400, 500, 600, 700],
  "Bodoni Moda": [400, 500, 600, 700, 800, 900],
  Fraunces: [400, 500, 600, 700, 800, 900],
  Cinzel: [400, 500, 600, 700, 800, 900],
  Lora: [400, 500, 600, 700],
  "EB Garamond": [400, 500, 600, 700, 800],
  "Crimson Text": [400, 600, 700],
  "Source Serif 4": [400, 500, 600, 700, 800, 900],
  Newsreader: [400, 500, 600, 700, 800],
  Spectral: [400, 500, 600, 700, 800],
  Alegreya: [400, 500, 600, 700, 800, 900],
  Cardo: [400, 700],
  "Noto Serif": [400, 500, 600, 700, 800, 900],
  "Noto Serif Display": [400, 500, 600, 700, 800, 900],
  Bitter: [400, 500, 600, 700, 800, 900],
  Domine: [400, 500, 600, 700],
  Vollkorn: [400, 500, 600, 700, 800, 900],
  Arvo: [400, 700],
  "Zilla Slab": [400, 500, 600, 700],
  "Roboto Slab": [400, 500, 600, 700, 800, 900],
  Oswald: [400, 500, 600, 700],
  "League Spartan": [400, 500, 600, 700, 800, 900],
  Teko: [400, 500, 600, 700],
  Orbitron: [400, 500, 600, 700, 800, 900],
  Rajdhani: [400, 500, 600, 700],
  Quantico: [400, 700],
  "Saira Condensed": [400, 500, 600, 700, 800, 900],
  "Saira Extra Condensed": [400, 500, 600, 700, 800, 900],
  "Big Shoulders Display": [400, 500, 600, 700, 800, 900],
  "Big Shoulders Inline Display": [400, 500, 600, 700, 800, 900],
  "Dancing Script": [400, 500, 600, 700],
  Caveat: [400, 500, 600, 700],
  Kalam: [400, 700],
  Fredoka: [400, 500, 600, 700],
  "Baloo 2": [400, 500, 600, 700, 800],
};

function getFontWeights(font: FontItem) {
  const family = font.google || font.family;

  if (FONT_WEIGHT_OVERRIDES[family]) {
    return FONT_WEIGHT_OVERRIDES[family];
  }

  if (SINGLE_WEIGHT_FONTS.has(family)) {
    return [400];
  }

  return null;
}

export function getGoogleFontHref(font: FontItem) {
  const family = encodeURIComponent(font.google || font.family).replace(/%20/g, "+");
  const weights = getFontWeights(font);

  if (!weights?.length) {
    return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  }

  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(";")}&display=swap`;
}

function nextPaint() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

async function waitForFontPaint(family: string) {
  if (typeof document === "undefined") return;

  try {
    await Promise.all([
      document.fonts?.load(`400 24px "${family}"`) ?? Promise.resolve(),
      document.fonts?.load(`700 24px "${family}"`) ?? Promise.resolve(),
      document.fonts?.load(`900 24px "${family}"`) ?? Promise.resolve(),
    ]);
    await (document.fonts?.ready ?? Promise.resolve());
  } catch {
    // Keep the UI usable if a font provider request fails.
  }

  await nextPaint();
}

function ensureGoogleFontsPreconnect() {
  if (typeof document === "undefined") return;

  if (!document.getElementById("editor-fonts-preconnect-gstatic")) {
    const gstatic = document.createElement("link");
    gstatic.id = "editor-fonts-preconnect-gstatic";
    gstatic.rel = "preconnect";
    gstatic.href = "https://fonts.gstatic.com";
    gstatic.crossOrigin = "anonymous";
    document.head.appendChild(gstatic);
  }

  if (!document.getElementById("editor-fonts-preconnect-googleapis")) {
    const googleapis = document.createElement("link");
    googleapis.id = "editor-fonts-preconnect-googleapis";
    googleapis.rel = "preconnect";
    googleapis.href = "https://fonts.googleapis.com";
    document.head.appendChild(googleapis);
  }
}

export function loadEditorFont(fontOrFamily: FontItem | string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  ensureGoogleFontsPreconnect();

  const font = typeof fontOrFamily === "string" ? getFontByFamily(fontOrFamily) : fontOrFamily;
  if (!font?.google) return Promise.resolve();

  const id = `editor-font-${font.id}`;
  const existingPromise = LOADING_EDITOR_FONTS.get(id);
  if (existingPromise) return existingPromise;

  const existingLink = document.getElementById(id) as HTMLLinkElement | null;

  const promise = new Promise<void>((resolve) => {
    const finish = () => {
      LOADED_EDITOR_FONTS.add(id);
      void waitForFontPaint(font.family).finally(resolve);
    };

    if (LOADED_EDITOR_FONTS.has(id) || existingLink?.sheet) {
      finish();
      return;
    }

    if (existingLink) {
      existingLink.addEventListener("load", finish, { once: true });
      existingLink.addEventListener("error", finish, { once: true });
      void waitForFontPaint(font.family).finally(finish);
      return;
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = getGoogleFontHref(font);
    link.onload = finish;
    link.onerror = finish;
    document.head.appendChild(link);
  });

  LOADING_EDITOR_FONTS.set(id, promise);
  return promise;
}

export function loadVisibleEditorFonts(fontFamilies: string[], max = 12): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const uniqueFamilies = Array.from(
    new Set(fontFamilies.filter((family) => isValidEditorFontFamily(family))),
  ).slice(0, max);

  // Keep this intentionally small. The font picker uses static SVG previews,
  // so real font files are only needed when a user applies a font to the canvas.
  return Promise.all(uniqueFamilies.map((family) => loadEditorFont(family))).then(() => undefined);
}
