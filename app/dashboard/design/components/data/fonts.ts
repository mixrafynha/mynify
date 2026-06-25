export type FontCategory = "sans" | "serif" | "display" | "handwritten" | "luxury" | "sporty" | "streetwear" | "kids" | "minimalist" | "retro";

export type FontItem = { id: string; family: string; category: FontCategory; preview: string; google?: string; premium?: boolean; };

export const FONT_CATEGORIES: FontCategory[] = ["sans","serif","display","handwritten","luxury","sporty","streetwear","kids","minimalist","retro"];

export const FONT_ITEMS: FontItem[] = [
  {
    "id": "inter",
    "family": "Inter",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Inter"
  },
  {
    "id": "roboto",
    "family": "Roboto",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Roboto"
  },
  {
    "id": "open-sans",
    "family": "Open Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Open+Sans"
  },
  {
    "id": "lato",
    "family": "Lato",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Lato"
  },
  {
    "id": "montserrat",
    "family": "Montserrat",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Montserrat"
  },
  {
    "id": "poppins",
    "family": "Poppins",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Poppins"
  },
  {
    "id": "source-sans-3",
    "family": "Source Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Source+Sans+3"
  },
  {
    "id": "noto-sans",
    "family": "Noto Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Noto+Sans"
  },
  {
    "id": "nunito",
    "family": "Nunito",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Nunito"
  },
  {
    "id": "raleway",
    "family": "Raleway",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Raleway"
  },
  {
    "id": "ubuntu",
    "family": "Ubuntu",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Ubuntu"
  },
  {
    "id": "rubik",
    "family": "Rubik",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Rubik"
  },
  {
    "id": "work-sans",
    "family": "Work Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Work+Sans"
  },
  {
    "id": "dm-sans",
    "family": "DM Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "DM+Sans"
  },
  {
    "id": "manrope",
    "family": "Manrope",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Manrope"
  },
  {
    "id": "urbanist",
    "family": "Urbanist",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Urbanist"
  },
  {
    "id": "plus-jakarta-sans",
    "family": "Plus Jakarta Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Plus+Jakarta+Sans"
  },
  {
    "id": "sora",
    "family": "Sora",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Sora"
  },
  {
    "id": "public-sans",
    "family": "Public Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Public+Sans"
  },
  {
    "id": "mulish",
    "family": "Mulish",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Mulish"
  },
  {
    "id": "assistant",
    "family": "Assistant",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Assistant"
  },
  {
    "id": "heebo",
    "family": "Heebo",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Heebo"
  },
  {
    "id": "cabin",
    "family": "Cabin",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Cabin"
  },
  {
    "id": "kanit",
    "family": "Kanit",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Kanit"
  },
  {
    "id": "prompt",
    "family": "Prompt",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Prompt"
  },
  {
    "id": "josefin-sans",
    "family": "Josefin Sans",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Josefin+Sans"
  },
  {
    "id": "quicksand",
    "family": "Quicksand",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Quicksand"
  },
  {
    "id": "outfit",
    "family": "Outfit",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Outfit"
  },
  {
    "id": "archivo",
    "family": "Archivo",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Archivo"
  },
  {
    "id": "barlow",
    "family": "Barlow",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Barlow"
  },
  {
    "id": "maven-pro",
    "family": "Maven Pro",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Maven+Pro"
  },
  {
    "id": "hind",
    "family": "Hind",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Hind"
  },
  {
    "id": "karla",
    "family": "Karla",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Karla"
  },
  {
    "id": "lexend",
    "family": "Lexend",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Lexend"
  },
  {
    "id": "figtree",
    "family": "Figtree",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Figtree"
  },
  {
    "id": "onest",
    "family": "Onest",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Onest"
  },
  {
    "id": "geist",
    "family": "Geist",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Geist"
  },
  {
    "id": "avenir",
    "family": "Avenir",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Avenir"
  },
  {
    "id": "futura",
    "family": "Futura",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Futura"
  },
  {
    "id": "helvetica",
    "family": "Helvetica",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Helvetica"
  },
  {
    "id": "verdana",
    "family": "Verdana",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Verdana"
  },
  {
    "id": "tahoma",
    "family": "Tahoma",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Tahoma"
  },
  {
    "id": "trebuchet-ms",
    "family": "Trebuchet MS",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Trebuchet+MS"
  },
  {
    "id": "merriweather",
    "family": "Merriweather",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Merriweather"
  },
  {
    "id": "playfair-display",
    "family": "Playfair Display",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Playfair+Display"
  },
  {
    "id": "cormorant-garamond",
    "family": "Cormorant Garamond",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Cormorant+Garamond"
  },
  {
    "id": "libre-baskerville",
    "family": "Libre Baskerville",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Libre+Baskerville"
  },
  {
    "id": "lora",
    "family": "Lora",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Lora"
  },
  {
    "id": "crimson-text",
    "family": "Crimson Text",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Crimson+Text"
  },
  {
    "id": "eb-garamond",
    "family": "EB Garamond",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "EB+Garamond"
  },
  {
    "id": "source-serif-4",
    "family": "Source Serif 4",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Source+Serif+4"
  },
  {
    "id": "noto-serif",
    "family": "Noto Serif",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Noto+Serif"
  },
  {
    "id": "pt-serif",
    "family": "PT Serif",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "PT+Serif"
  },
  {
    "id": "dm-serif-display",
    "family": "DM Serif Display",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "DM+Serif+Display"
  },
  {
    "id": "prata",
    "family": "Prata",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Prata"
  },
  {
    "id": "cinzel",
    "family": "Cinzel",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Cinzel"
  },
  {
    "id": "bodoni-moda",
    "family": "Bodoni Moda",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Bodoni+Moda"
  },
  {
    "id": "cardo",
    "family": "Cardo",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Cardo"
  },
  {
    "id": "fraunces",
    "family": "Fraunces",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Fraunces"
  },
  {
    "id": "spectral",
    "family": "Spectral",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Spectral"
  },
  {
    "id": "vollkorn",
    "family": "Vollkorn",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Vollkorn"
  },
  {
    "id": "alegreya",
    "family": "Alegreya",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Alegreya"
  },
  {
    "id": "arvo",
    "family": "Arvo",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Arvo"
  },
  {
    "id": "zilla-slab",
    "family": "Zilla Slab",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Zilla+Slab"
  },
  {
    "id": "roboto-slab",
    "family": "Roboto Slab",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Roboto+Slab"
  },
  {
    "id": "bitter",
    "family": "Bitter",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Bitter"
  },
  {
    "id": "domine",
    "family": "Domine",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Domine"
  },
  {
    "id": "newsreader",
    "family": "Newsreader",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Newsreader"
  },
  {
    "id": "abril-fatface",
    "family": "Abril Fatface",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Abril+Fatface"
  },
  {
    "id": "yeseva-one",
    "family": "Yeseva One",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Yeseva+One"
  },
  {
    "id": "italiana",
    "family": "Italiana",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Italiana"
  },
  {
    "id": "marcellus",
    "family": "Marcellus",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Marcellus"
  },
  {
    "id": "gloock",
    "family": "Gloock",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Gloock"
  },
  {
    "id": "bebas-neue",
    "family": "Bebas Neue",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bebas+Neue"
  },
  {
    "id": "anton",
    "family": "Anton",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Anton"
  },
  {
    "id": "oswald",
    "family": "Oswald",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Oswald"
  },
  {
    "id": "impact",
    "family": "Impact",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Impact"
  },
  {
    "id": "archivo-black",
    "family": "Archivo Black",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Archivo+Black"
  },
  {
    "id": "league-spartan",
    "family": "League Spartan",
    "category": "display",
    "preview": "Aa Preview",
    "google": "League+Spartan"
  },
  {
    "id": "barlow-condensed",
    "family": "Barlow Condensed",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Barlow+Condensed"
  },
  {
    "id": "teko",
    "family": "Teko",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Teko"
  },
  {
    "id": "fjalla-one",
    "family": "Fjalla One",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Fjalla+One"
  },
  {
    "id": "alfa-slab-one",
    "family": "Alfa Slab One",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Alfa+Slab+One"
  },
  {
    "id": "black-ops-one",
    "family": "Black Ops One",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Black+Ops+One"
  },
  {
    "id": "bungee",
    "family": "Bungee",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bungee"
  },
  {
    "id": "bungee-shade",
    "family": "Bungee Shade",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bungee+Shade"
  },
  {
    "id": "righteous",
    "family": "Righteous",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Righteous"
  },
  {
    "id": "monoton",
    "family": "Monoton",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Monoton"
  },
  {
    "id": "press-start-2p",
    "family": "Press Start 2P",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Press+Start+2P"
  },
  {
    "id": "luckiest-guy",
    "family": "Luckiest Guy",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Luckiest+Guy"
  },
  {
    "id": "fredoka",
    "family": "Fredoka",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Fredoka"
  },
  {
    "id": "baloo-2",
    "family": "Baloo 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Baloo+2"
  },
  {
    "id": "titan-one",
    "family": "Titan One",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Titan+One"
  },
  {
    "id": "lilita-one",
    "family": "Lilita One",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Lilita+One"
  },
  {
    "id": "changa-one",
    "family": "Changa One",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Changa+One"
  },
  {
    "id": "bowlby-one-sc",
    "family": "Bowlby One SC",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bowlby+One+SC"
  },
  {
    "id": "graduate",
    "family": "Graduate",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Graduate"
  },
  {
    "id": "staatliches",
    "family": "Staatliches",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Staatliches"
  },
  {
    "id": "syncopate",
    "family": "Syncopate",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Syncopate"
  },
  {
    "id": "major-mono-display",
    "family": "Major Mono Display",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Major+Mono+Display"
  },
  {
    "id": "pacifico",
    "family": "Pacifico",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Pacifico"
  },
  {
    "id": "lobster",
    "family": "Lobster",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Lobster"
  },
  {
    "id": "dancing-script",
    "family": "Dancing Script",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Dancing+Script"
  },
  {
    "id": "great-vibes",
    "family": "Great Vibes",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Great+Vibes"
  },
  {
    "id": "satisfy",
    "family": "Satisfy",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Satisfy"
  },
  {
    "id": "sacramento",
    "family": "Sacramento",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Sacramento"
  },
  {
    "id": "parisienne",
    "family": "Parisienne",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Parisienne"
  },
  {
    "id": "kaushan-script",
    "family": "Kaushan Script",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Kaushan+Script"
  },
  {
    "id": "yellowtail",
    "family": "Yellowtail",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Yellowtail"
  },
  {
    "id": "courgette",
    "family": "Courgette",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Courgette"
  },
  {
    "id": "amatic-sc",
    "family": "Amatic SC",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Amatic+SC"
  },
  {
    "id": "caveat",
    "family": "Caveat",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Caveat"
  },
  {
    "id": "indie-flower",
    "family": "Indie Flower",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Indie+Flower"
  },
  {
    "id": "shadows-into-light",
    "family": "Shadows Into Light",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Shadows+Into+Light"
  },
  {
    "id": "permanent-marker",
    "family": "Permanent Marker",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Permanent+Marker"
  },
  {
    "id": "patrick-hand",
    "family": "Patrick Hand",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Patrick+Hand"
  },
  {
    "id": "kalam",
    "family": "Kalam",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Kalam"
  },
  {
    "id": "gloria-hallelujah",
    "family": "Gloria Hallelujah",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Gloria+Hallelujah"
  },
  {
    "id": "gochi-hand",
    "family": "Gochi Hand",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Gochi+Hand"
  },
  {
    "id": "just-another-hand",
    "family": "Just Another Hand",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Just+Another+Hand"
  },
  {
    "id": "reenie-beanie",
    "family": "Reenie Beanie",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Reenie+Beanie"
  },
  {
    "id": "homemade-apple",
    "family": "Homemade Apple",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Homemade+Apple"
  },
  {
    "id": "rock-salt",
    "family": "Rock Salt",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Rock+Salt"
  },
  {
    "id": "architects-daughter",
    "family": "Architects Daughter",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Architects+Daughter"
  },
  {
    "id": "cinzel",
    "family": "Cinzel",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Cinzel"
  },
  {
    "id": "cormorant-sc",
    "family": "Cormorant SC",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Cormorant+SC"
  },
  {
    "id": "bodoni-72",
    "family": "Bodoni 72",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Bodoni+72"
  },
  {
    "id": "didot",
    "family": "Didot",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Didot"
  },
  {
    "id": "garamond",
    "family": "Garamond",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Garamond"
  },
  {
    "id": "optima",
    "family": "Optima",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Optima"
  },
  {
    "id": "palatino",
    "family": "Palatino",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Palatino"
  },
  {
    "id": "trajan-pro",
    "family": "Trajan Pro",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Trajan+Pro"
  },
  {
    "id": "bellefair",
    "family": "Bellefair",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Bellefair"
  },
  {
    "id": "balthazar",
    "family": "Balthazar",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Balthazar"
  },
  {
    "id": "forum",
    "family": "Forum",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Forum"
  },
  {
    "id": "julius-sans-one",
    "family": "Julius Sans One",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Julius+Sans+One"
  },
  {
    "id": "josefin-slab",
    "family": "Josefin Slab",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Josefin+Slab"
  },
  {
    "id": "sorts-mill-goudy",
    "family": "Sorts Mill Goudy",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Sorts+Mill+Goudy"
  },
  {
    "id": "unna",
    "family": "Unna",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Unna"
  },
  {
    "id": "vidaloka",
    "family": "Vidaloka",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Vidaloka"
  },
  {
    "id": "cormorant-infant",
    "family": "Cormorant Infant",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Cormorant+Infant"
  },
  {
    "id": "tenor-sans",
    "family": "Tenor Sans",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Tenor+Sans"
  },
  {
    "id": "poiret-one",
    "family": "Poiret One",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Poiret+One"
  },
  {
    "id": "montserrat-alternates",
    "family": "Montserrat Alternates",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Montserrat+Alternates"
  },
  {
    "id": "varsity",
    "family": "Varsity",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Varsity"
  },
  {
    "id": "team-college",
    "family": "Team College",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Team+College"
  },
  {
    "id": "sport-jersey",
    "family": "Sport Jersey",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Sport+Jersey"
  },
  {
    "id": "winner",
    "family": "Winner",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Winner"
  },
  {
    "id": "athletic-block",
    "family": "Athletic Block",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Athletic+Block"
  },
  {
    "id": "champion",
    "family": "Champion",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Champion"
  },
  {
    "id": "racer",
    "family": "Racer",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Racer"
  },
  {
    "id": "speedster",
    "family": "Speedster",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Speedster"
  },
  {
    "id": "knockout",
    "family": "Knockout",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Knockout"
  },
  {
    "id": "bebas-neue",
    "family": "Bebas Neue",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Bebas+Neue"
  },
  {
    "id": "oswald",
    "family": "Oswald",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Oswald"
  },
  {
    "id": "stencil",
    "family": "Stencil",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Stencil"
  },
  {
    "id": "black-ops-one",
    "family": "Black Ops One",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Black+Ops+One"
  },
  {
    "id": "graduate",
    "family": "Graduate",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Graduate"
  },
  {
    "id": "teko",
    "family": "Teko",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Teko"
  },
  {
    "id": "anton",
    "family": "Anton",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Anton"
  },
  {
    "id": "street-urban",
    "family": "Street Urban",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Street+Urban"
  },
  {
    "id": "graffiti-drip",
    "family": "Graffiti Drip",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Graffiti+Drip"
  },
  {
    "id": "hustle",
    "family": "Hustle",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Hustle"
  },
  {
    "id": "brooklyn",
    "family": "Brooklyn",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Brooklyn"
  },
  {
    "id": "bronx",
    "family": "Bronx",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Bronx"
  },
  {
    "id": "tagger",
    "family": "Tagger",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Tagger"
  },
  {
    "id": "marker",
    "family": "Marker",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Marker"
  },
  {
    "id": "permanent-marker",
    "family": "Permanent Marker",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Permanent+Marker"
  },
  {
    "id": "bungee-shade",
    "family": "Bungee Shade",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Bungee+Shade"
  },
  {
    "id": "rubik-spray",
    "family": "Rubik Spray",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Rubik+Spray"
  },
  {
    "id": "paint-bold",
    "family": "Paint Bold",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Paint+Bold"
  },
  {
    "id": "riot",
    "family": "Riot",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Riot"
  },
  {
    "id": "destroy",
    "family": "Destroy",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Destroy"
  },
  {
    "id": "grunge-poster",
    "family": "Grunge Poster",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Grunge+Poster"
  },
  {
    "id": "gothic-west-coast",
    "family": "Gothic West Coast",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Gothic+West+Coast"
  },
  {
    "id": "east-side",
    "family": "East Side",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "East+Side"
  },
  {
    "id": "comic-neue",
    "family": "Comic Neue",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Comic+Neue"
  },
  {
    "id": "fredoka",
    "family": "Fredoka",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Fredoka"
  },
  {
    "id": "bubblegum-sans",
    "family": "Bubblegum Sans",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Bubblegum+Sans"
  },
  {
    "id": "baloo-2",
    "family": "Baloo 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Baloo+2"
  },
  {
    "id": "chewy",
    "family": "Chewy",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Chewy"
  },
  {
    "id": "cherry-bomb-one",
    "family": "Cherry Bomb One",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Cherry+Bomb+One"
  },
  {
    "id": "dynapuff",
    "family": "DynaPuff",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "DynaPuff"
  },
  {
    "id": "gaegu",
    "family": "Gaegu",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Gaegu"
  },
  {
    "id": "gochi-hand",
    "family": "Gochi Hand",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Gochi+Hand"
  },
  {
    "id": "happy-monkey",
    "family": "Happy Monkey",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Happy+Monkey"
  },
  {
    "id": "jua",
    "family": "Jua",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Jua"
  },
  {
    "id": "knewave",
    "family": "Knewave",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Knewave"
  },
  {
    "id": "londrina-solid",
    "family": "Londrina Solid",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Londrina+Solid"
  },
  {
    "id": "mochiy-pop-one",
    "family": "Mochiy Pop One",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Mochiy+Pop+One"
  },
  {
    "id": "nerko-one",
    "family": "Nerko One",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Nerko+One"
  },
  {
    "id": "patrick-hand",
    "family": "Patrick Hand",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Patrick+Hand"
  },
  {
    "id": "schoolbell",
    "family": "Schoolbell",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Schoolbell"
  },
  {
    "id": "sniglet",
    "family": "Sniglet",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Sniglet"
  },
  {
    "id": "minimalist-clean",
    "family": "Minimalist Clean",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Minimalist+Clean"
  },
  {
    "id": "studio-modern",
    "family": "Studio Modern",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Studio+Modern"
  },
  {
    "id": "grotesk",
    "family": "Grotesk",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Grotesk"
  },
  {
    "id": "neue-haas-unica",
    "family": "Neue Haas Unica",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Neue+Haas+Unica"
  },
  {
    "id": "simple-sans",
    "family": "Simple Sans",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Simple+Sans"
  },
  {
    "id": "light-sans",
    "family": "Light Sans",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Light+Sans"
  },
  {
    "id": "thin-geo",
    "family": "Thin Geo",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Thin+Geo"
  },
  {
    "id": "humanist",
    "family": "Humanist",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Humanist"
  },
  {
    "id": "rational-pure",
    "family": "Rational Pure",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Rational+Pure"
  },
  {
    "id": "lineal",
    "family": "Lineal",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Lineal"
  },
  {
    "id": "inter",
    "family": "Inter",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Inter"
  },
  {
    "id": "dm-sans",
    "family": "DM Sans",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "DM+Sans"
  },
  {
    "id": "manrope",
    "family": "Manrope",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Manrope"
  },
  {
    "id": "urbanist",
    "family": "Urbanist",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Urbanist"
  },
  {
    "id": "sora",
    "family": "Sora",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Sora"
  },
  {
    "id": "onest",
    "family": "Onest",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Onest"
  },
  {
    "id": "geist",
    "family": "Geist",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Geist"
  },
  {
    "id": "cooper-black",
    "family": "Cooper Black",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Cooper+Black"
  },
  {
    "id": "lobster-two",
    "family": "Lobster Two",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Lobster+Two"
  },
  {
    "id": "fascinate-inline",
    "family": "Fascinate Inline",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Fascinate+Inline"
  },
  {
    "id": "monoton",
    "family": "Monoton",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Monoton"
  },
  {
    "id": "righteous",
    "family": "Righteous",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Righteous"
  },
  {
    "id": "rye",
    "family": "Rye",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Rye"
  },
  {
    "id": "sancreek",
    "family": "Sancreek",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Sancreek"
  },
  {
    "id": "ultra",
    "family": "Ultra",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Ultra"
  },
  {
    "id": "limelight",
    "family": "Limelight",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Limelight"
  },
  {
    "id": "bangers",
    "family": "Bangers",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Bangers"
  },
  {
    "id": "bungee-inline",
    "family": "Bungee Inline",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Bungee+Inline"
  },
  {
    "id": "ewert",
    "family": "Ewert",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Ewert"
  },
  {
    "id": "flavors",
    "family": "Flavors",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Flavors"
  },
  {
    "id": "frijole",
    "family": "Frijole",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Frijole"
  },
  {
    "id": "honk",
    "family": "Honk",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Honk"
  },
  {
    "id": "modak",
    "family": "Modak",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Modak"
  },
  {
    "id": "playball",
    "family": "Playball",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Playball"
  },
  {
    "id": "rammetto-one",
    "family": "Rammetto One",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Rammetto+One"
  },
  {
    "id": "smokum",
    "family": "Smokum",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Smokum"
  },
  {
    "id": "special-elite",
    "family": "Special Elite",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Special+Elite"
  },
  {
    "id": "inter-2",
    "family": "Inter 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Inter"
  },
  {
    "id": "roboto-2",
    "family": "Roboto 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Roboto"
  },
  {
    "id": "open-sans-2",
    "family": "Open Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Open+Sans"
  },
  {
    "id": "lato-2",
    "family": "Lato 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Lato"
  },
  {
    "id": "montserrat-2",
    "family": "Montserrat 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Montserrat"
  },
  {
    "id": "poppins-2",
    "family": "Poppins 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Poppins"
  },
  {
    "id": "source-sans-3-2",
    "family": "Source Sans 3 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Source+Sans+3"
  },
  {
    "id": "noto-sans-2",
    "family": "Noto Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Noto+Sans"
  },
  {
    "id": "nunito-2",
    "family": "Nunito 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Nunito"
  },
  {
    "id": "raleway-2",
    "family": "Raleway 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Raleway"
  },
  {
    "id": "ubuntu-2",
    "family": "Ubuntu 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Ubuntu"
  },
  {
    "id": "rubik-2",
    "family": "Rubik 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Rubik"
  },
  {
    "id": "work-sans-2",
    "family": "Work Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Work+Sans"
  },
  {
    "id": "dm-sans-2",
    "family": "DM Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "DM+Sans"
  },
  {
    "id": "manrope-2",
    "family": "Manrope 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Manrope"
  },
  {
    "id": "urbanist-2",
    "family": "Urbanist 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Urbanist"
  },
  {
    "id": "plus-jakarta-sans-2",
    "family": "Plus Jakarta Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Plus+Jakarta+Sans"
  },
  {
    "id": "sora-2",
    "family": "Sora 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Sora"
  },
  {
    "id": "public-sans-2",
    "family": "Public Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Public+Sans"
  },
  {
    "id": "mulish-2",
    "family": "Mulish 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Mulish"
  },
  {
    "id": "assistant-2",
    "family": "Assistant 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Assistant"
  },
  {
    "id": "heebo-2",
    "family": "Heebo 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Heebo"
  },
  {
    "id": "cabin-2",
    "family": "Cabin 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Cabin"
  },
  {
    "id": "kanit-2",
    "family": "Kanit 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Kanit"
  },
  {
    "id": "prompt-2",
    "family": "Prompt 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Prompt"
  },
  {
    "id": "josefin-sans-2",
    "family": "Josefin Sans 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Josefin+Sans"
  },
  {
    "id": "quicksand-2",
    "family": "Quicksand 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Quicksand"
  },
  {
    "id": "outfit-2",
    "family": "Outfit 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Outfit"
  },
  {
    "id": "archivo-2",
    "family": "Archivo 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Archivo"
  },
  {
    "id": "barlow-2",
    "family": "Barlow 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Barlow"
  },
  {
    "id": "maven-pro-2",
    "family": "Maven Pro 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Maven+Pro"
  },
  {
    "id": "hind-2",
    "family": "Hind 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Hind"
  },
  {
    "id": "karla-2",
    "family": "Karla 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Karla"
  },
  {
    "id": "lexend-2",
    "family": "Lexend 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Lexend"
  },
  {
    "id": "figtree-2",
    "family": "Figtree 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Figtree"
  },
  {
    "id": "onest-2",
    "family": "Onest 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Onest"
  },
  {
    "id": "geist-2",
    "family": "Geist 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Geist"
  },
  {
    "id": "avenir-2",
    "family": "Avenir 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Avenir"
  },
  {
    "id": "futura-2",
    "family": "Futura 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Futura"
  },
  {
    "id": "helvetica-2",
    "family": "Helvetica 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Helvetica"
  },
  {
    "id": "verdana-2",
    "family": "Verdana 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Verdana"
  },
  {
    "id": "tahoma-2",
    "family": "Tahoma 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Tahoma"
  },
  {
    "id": "trebuchet-ms-2",
    "family": "Trebuchet MS 2",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Trebuchet+MS"
  },
  {
    "id": "merriweather-2",
    "family": "Merriweather 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Merriweather"
  },
  {
    "id": "playfair-display-2",
    "family": "Playfair Display 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Playfair+Display"
  },
  {
    "id": "cormorant-garamond-2",
    "family": "Cormorant Garamond 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Cormorant+Garamond"
  },
  {
    "id": "libre-baskerville-2",
    "family": "Libre Baskerville 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Libre+Baskerville"
  },
  {
    "id": "lora-2",
    "family": "Lora 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Lora"
  },
  {
    "id": "crimson-text-2",
    "family": "Crimson Text 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Crimson+Text"
  },
  {
    "id": "eb-garamond-2",
    "family": "EB Garamond 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "EB+Garamond"
  },
  {
    "id": "source-serif-4-2",
    "family": "Source Serif 4 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Source+Serif+4"
  },
  {
    "id": "noto-serif-2",
    "family": "Noto Serif 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Noto+Serif"
  },
  {
    "id": "pt-serif-2",
    "family": "PT Serif 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "PT+Serif"
  },
  {
    "id": "dm-serif-display-2",
    "family": "DM Serif Display 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "DM+Serif+Display"
  },
  {
    "id": "prata-2",
    "family": "Prata 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Prata"
  },
  {
    "id": "cinzel-2",
    "family": "Cinzel 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Cinzel"
  },
  {
    "id": "bodoni-moda-2",
    "family": "Bodoni Moda 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Bodoni+Moda"
  },
  {
    "id": "cardo-2",
    "family": "Cardo 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Cardo"
  },
  {
    "id": "fraunces-2",
    "family": "Fraunces 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Fraunces"
  },
  {
    "id": "spectral-2",
    "family": "Spectral 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Spectral"
  },
  {
    "id": "vollkorn-2",
    "family": "Vollkorn 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Vollkorn"
  },
  {
    "id": "alegreya-2",
    "family": "Alegreya 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Alegreya"
  },
  {
    "id": "arvo-2",
    "family": "Arvo 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Arvo"
  },
  {
    "id": "zilla-slab-2",
    "family": "Zilla Slab 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Zilla+Slab"
  },
  {
    "id": "roboto-slab-2",
    "family": "Roboto Slab 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Roboto+Slab"
  },
  {
    "id": "bitter-2",
    "family": "Bitter 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Bitter"
  },
  {
    "id": "domine-2",
    "family": "Domine 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Domine"
  },
  {
    "id": "newsreader-2",
    "family": "Newsreader 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Newsreader"
  },
  {
    "id": "abril-fatface-2",
    "family": "Abril Fatface 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Abril+Fatface"
  },
  {
    "id": "yeseva-one-2",
    "family": "Yeseva One 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Yeseva+One"
  },
  {
    "id": "italiana-2",
    "family": "Italiana 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Italiana"
  },
  {
    "id": "marcellus-2",
    "family": "Marcellus 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Marcellus"
  },
  {
    "id": "gloock-2",
    "family": "Gloock 2",
    "category": "serif",
    "preview": "Aa Preview",
    "google": "Gloock"
  },
  {
    "id": "bebas-neue-2",
    "family": "Bebas Neue 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bebas+Neue"
  },
  {
    "id": "anton-2",
    "family": "Anton 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Anton"
  },
  {
    "id": "oswald-2",
    "family": "Oswald 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Oswald"
  },
  {
    "id": "impact-2",
    "family": "Impact 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Impact"
  },
  {
    "id": "archivo-black-2",
    "family": "Archivo Black 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Archivo+Black"
  },
  {
    "id": "league-spartan-2",
    "family": "League Spartan 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "League+Spartan"
  },
  {
    "id": "barlow-condensed-2",
    "family": "Barlow Condensed 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Barlow+Condensed"
  },
  {
    "id": "teko-2",
    "family": "Teko 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Teko"
  },
  {
    "id": "fjalla-one-2",
    "family": "Fjalla One 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Fjalla+One"
  },
  {
    "id": "alfa-slab-one-2",
    "family": "Alfa Slab One 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Alfa+Slab+One"
  },
  {
    "id": "black-ops-one-2",
    "family": "Black Ops One 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Black+Ops+One"
  },
  {
    "id": "bungee-2",
    "family": "Bungee 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bungee"
  },
  {
    "id": "bungee-shade-2",
    "family": "Bungee Shade 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bungee+Shade"
  },
  {
    "id": "righteous-2",
    "family": "Righteous 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Righteous"
  },
  {
    "id": "monoton-2",
    "family": "Monoton 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Monoton"
  },
  {
    "id": "press-start-2p-2",
    "family": "Press Start 2P 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Press+Start+2P"
  },
  {
    "id": "luckiest-guy-2",
    "family": "Luckiest Guy 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Luckiest+Guy"
  },
  {
    "id": "fredoka-2",
    "family": "Fredoka 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Fredoka"
  },
  {
    "id": "baloo-2-2",
    "family": "Baloo 2 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Baloo+2"
  },
  {
    "id": "titan-one-2",
    "family": "Titan One 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Titan+One"
  },
  {
    "id": "lilita-one-2",
    "family": "Lilita One 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Lilita+One"
  },
  {
    "id": "changa-one-2",
    "family": "Changa One 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Changa+One"
  },
  {
    "id": "bowlby-one-sc-2",
    "family": "Bowlby One SC 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Bowlby+One+SC"
  },
  {
    "id": "graduate-2",
    "family": "Graduate 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Graduate"
  },
  {
    "id": "staatliches-2",
    "family": "Staatliches 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Staatliches"
  },
  {
    "id": "syncopate-2",
    "family": "Syncopate 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Syncopate"
  },
  {
    "id": "major-mono-display-2",
    "family": "Major Mono Display 2",
    "category": "display",
    "preview": "Aa Preview",
    "google": "Major+Mono+Display"
  },
  {
    "id": "pacifico-2",
    "family": "Pacifico 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Pacifico"
  },
  {
    "id": "lobster-2",
    "family": "Lobster 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Lobster"
  },
  {
    "id": "dancing-script-2",
    "family": "Dancing Script 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Dancing+Script"
  },
  {
    "id": "great-vibes-2",
    "family": "Great Vibes 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Great+Vibes"
  },
  {
    "id": "satisfy-2",
    "family": "Satisfy 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Satisfy"
  },
  {
    "id": "sacramento-2",
    "family": "Sacramento 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Sacramento"
  },
  {
    "id": "parisienne-2",
    "family": "Parisienne 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Parisienne"
  },
  {
    "id": "kaushan-script-2",
    "family": "Kaushan Script 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Kaushan+Script"
  },
  {
    "id": "yellowtail-2",
    "family": "Yellowtail 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Yellowtail"
  },
  {
    "id": "courgette-2",
    "family": "Courgette 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Courgette"
  },
  {
    "id": "amatic-sc-2",
    "family": "Amatic SC 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Amatic+SC"
  },
  {
    "id": "caveat-2",
    "family": "Caveat 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Caveat"
  },
  {
    "id": "indie-flower-2",
    "family": "Indie Flower 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Indie+Flower"
  },
  {
    "id": "shadows-into-light-2",
    "family": "Shadows Into Light 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Shadows+Into+Light"
  },
  {
    "id": "permanent-marker-2",
    "family": "Permanent Marker 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Permanent+Marker"
  },
  {
    "id": "patrick-hand-2",
    "family": "Patrick Hand 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Patrick+Hand"
  },
  {
    "id": "kalam-2",
    "family": "Kalam 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Kalam"
  },
  {
    "id": "gloria-hallelujah-2",
    "family": "Gloria Hallelujah 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Gloria+Hallelujah"
  },
  {
    "id": "gochi-hand-2",
    "family": "Gochi Hand 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Gochi+Hand"
  },
  {
    "id": "just-another-hand-2",
    "family": "Just Another Hand 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Just+Another+Hand"
  },
  {
    "id": "reenie-beanie-2",
    "family": "Reenie Beanie 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Reenie+Beanie"
  },
  {
    "id": "homemade-apple-2",
    "family": "Homemade Apple 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Homemade+Apple"
  },
  {
    "id": "rock-salt-2",
    "family": "Rock Salt 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Rock+Salt"
  },
  {
    "id": "architects-daughter-2",
    "family": "Architects Daughter 2",
    "category": "handwritten",
    "preview": "Aa Preview",
    "google": "Architects+Daughter"
  },
  {
    "id": "cinzel-2",
    "family": "Cinzel 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Cinzel"
  },
  {
    "id": "cormorant-sc-2",
    "family": "Cormorant SC 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Cormorant+SC"
  },
  {
    "id": "bodoni-72-2",
    "family": "Bodoni 72 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Bodoni+72"
  },
  {
    "id": "didot-2",
    "family": "Didot 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Didot"
  },
  {
    "id": "garamond-2",
    "family": "Garamond 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Garamond"
  },
  {
    "id": "optima-2",
    "family": "Optima 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Optima"
  },
  {
    "id": "palatino-2",
    "family": "Palatino 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Palatino"
  },
  {
    "id": "trajan-pro-2",
    "family": "Trajan Pro 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Trajan+Pro"
  },
  {
    "id": "bellefair-2",
    "family": "Bellefair 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Bellefair"
  },
  {
    "id": "balthazar-2",
    "family": "Balthazar 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Balthazar"
  },
  {
    "id": "forum-2",
    "family": "Forum 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Forum"
  },
  {
    "id": "julius-sans-one-2",
    "family": "Julius Sans One 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Julius+Sans+One"
  },
  {
    "id": "josefin-slab-2",
    "family": "Josefin Slab 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Josefin+Slab"
  },
  {
    "id": "sorts-mill-goudy-2",
    "family": "Sorts Mill Goudy 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Sorts+Mill+Goudy"
  },
  {
    "id": "unna-2",
    "family": "Unna 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Unna"
  },
  {
    "id": "vidaloka-2",
    "family": "Vidaloka 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Vidaloka"
  },
  {
    "id": "cormorant-infant-2",
    "family": "Cormorant Infant 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Cormorant+Infant"
  },
  {
    "id": "tenor-sans-2",
    "family": "Tenor Sans 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Tenor+Sans"
  },
  {
    "id": "poiret-one-2",
    "family": "Poiret One 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Poiret+One"
  },
  {
    "id": "montserrat-alternates-2",
    "family": "Montserrat Alternates 2",
    "category": "luxury",
    "preview": "Aa Preview",
    "google": "Montserrat+Alternates"
  },
  {
    "id": "varsity-2",
    "family": "Varsity 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Varsity"
  },
  {
    "id": "team-college-2",
    "family": "Team College 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Team+College"
  },
  {
    "id": "sport-jersey-2",
    "family": "Sport Jersey 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Sport+Jersey"
  },
  {
    "id": "winner-2",
    "family": "Winner 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Winner"
  },
  {
    "id": "athletic-block-2",
    "family": "Athletic Block 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Athletic+Block"
  },
  {
    "id": "champion-2",
    "family": "Champion 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Champion"
  },
  {
    "id": "racer-2",
    "family": "Racer 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Racer"
  },
  {
    "id": "speedster-2",
    "family": "Speedster 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Speedster"
  },
  {
    "id": "knockout-2",
    "family": "Knockout 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Knockout"
  },
  {
    "id": "bebas-neue-2",
    "family": "Bebas Neue 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Bebas+Neue"
  },
  {
    "id": "oswald-2",
    "family": "Oswald 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Oswald"
  },
  {
    "id": "stencil-2",
    "family": "Stencil 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Stencil"
  },
  {
    "id": "black-ops-one-2",
    "family": "Black Ops One 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Black+Ops+One"
  },
  {
    "id": "graduate-2",
    "family": "Graduate 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Graduate"
  },
  {
    "id": "teko-2",
    "family": "Teko 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Teko"
  },
  {
    "id": "anton-2",
    "family": "Anton 2",
    "category": "sporty",
    "preview": "Aa Preview",
    "google": "Anton"
  },
  {
    "id": "street-urban-2",
    "family": "Street Urban 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Street+Urban"
  },
  {
    "id": "graffiti-drip-2",
    "family": "Graffiti Drip 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Graffiti+Drip"
  },
  {
    "id": "hustle-2",
    "family": "Hustle 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Hustle"
  },
  {
    "id": "brooklyn-2",
    "family": "Brooklyn 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Brooklyn"
  },
  {
    "id": "bronx-2",
    "family": "Bronx 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Bronx"
  },
  {
    "id": "tagger-2",
    "family": "Tagger 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Tagger"
  },
  {
    "id": "marker-2",
    "family": "Marker 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Marker"
  },
  {
    "id": "permanent-marker-2",
    "family": "Permanent Marker 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Permanent+Marker"
  },
  {
    "id": "bungee-shade-2",
    "family": "Bungee Shade 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Bungee+Shade"
  },
  {
    "id": "rubik-spray-2",
    "family": "Rubik Spray 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Rubik+Spray"
  },
  {
    "id": "paint-bold-2",
    "family": "Paint Bold 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Paint+Bold"
  },
  {
    "id": "riot-2",
    "family": "Riot 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Riot"
  },
  {
    "id": "destroy-2",
    "family": "Destroy 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Destroy"
  },
  {
    "id": "grunge-poster-2",
    "family": "Grunge Poster 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Grunge+Poster"
  },
  {
    "id": "gothic-west-coast-2",
    "family": "Gothic West Coast 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "Gothic+West+Coast"
  },
  {
    "id": "east-side-2",
    "family": "East Side 2",
    "category": "streetwear",
    "preview": "Aa Preview",
    "google": "East+Side"
  },
  {
    "id": "comic-neue-2",
    "family": "Comic Neue 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Comic+Neue"
  },
  {
    "id": "fredoka-2",
    "family": "Fredoka 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Fredoka"
  },
  {
    "id": "bubblegum-sans-2",
    "family": "Bubblegum Sans 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Bubblegum+Sans"
  },
  {
    "id": "baloo-2-2",
    "family": "Baloo 2 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Baloo+2"
  },
  {
    "id": "chewy-2",
    "family": "Chewy 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Chewy"
  },
  {
    "id": "cherry-bomb-one-2",
    "family": "Cherry Bomb One 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Cherry+Bomb+One"
  },
  {
    "id": "dynapuff-2",
    "family": "DynaPuff 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "DynaPuff"
  },
  {
    "id": "gaegu-2",
    "family": "Gaegu 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Gaegu"
  },
  {
    "id": "gochi-hand-2",
    "family": "Gochi Hand 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Gochi+Hand"
  },
  {
    "id": "happy-monkey-2",
    "family": "Happy Monkey 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Happy+Monkey"
  },
  {
    "id": "jua-2",
    "family": "Jua 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Jua"
  },
  {
    "id": "knewave-2",
    "family": "Knewave 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Knewave"
  },
  {
    "id": "londrina-solid-2",
    "family": "Londrina Solid 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Londrina+Solid"
  },
  {
    "id": "mochiy-pop-one-2",
    "family": "Mochiy Pop One 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Mochiy+Pop+One"
  },
  {
    "id": "nerko-one-2",
    "family": "Nerko One 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Nerko+One"
  },
  {
    "id": "patrick-hand-2",
    "family": "Patrick Hand 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Patrick+Hand"
  },
  {
    "id": "schoolbell-2",
    "family": "Schoolbell 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Schoolbell"
  },
  {
    "id": "sniglet-2",
    "family": "Sniglet 2",
    "category": "kids",
    "preview": "Aa Preview",
    "google": "Sniglet"
  },
  {
    "id": "minimalist-clean-2",
    "family": "Minimalist Clean 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Minimalist+Clean"
  },
  {
    "id": "studio-modern-2",
    "family": "Studio Modern 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Studio+Modern"
  },
  {
    "id": "grotesk-2",
    "family": "Grotesk 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Grotesk"
  },
  {
    "id": "neue-haas-unica-2",
    "family": "Neue Haas Unica 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Neue+Haas+Unica"
  },
  {
    "id": "simple-sans-2",
    "family": "Simple Sans 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Simple+Sans"
  },
  {
    "id": "light-sans-2",
    "family": "Light Sans 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Light+Sans"
  },
  {
    "id": "thin-geo-2",
    "family": "Thin Geo 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Thin+Geo"
  },
  {
    "id": "humanist-2",
    "family": "Humanist 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Humanist"
  },
  {
    "id": "rational-pure-2",
    "family": "Rational Pure 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Rational+Pure"
  },
  {
    "id": "lineal-2",
    "family": "Lineal 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Lineal"
  },
  {
    "id": "inter-2",
    "family": "Inter 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Inter"
  },
  {
    "id": "dm-sans-2",
    "family": "DM Sans 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "DM+Sans"
  },
  {
    "id": "manrope-2",
    "family": "Manrope 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Manrope"
  },
  {
    "id": "urbanist-2",
    "family": "Urbanist 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Urbanist"
  },
  {
    "id": "sora-2",
    "family": "Sora 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Sora"
  },
  {
    "id": "onest-2",
    "family": "Onest 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Onest"
  },
  {
    "id": "geist-2",
    "family": "Geist 2",
    "category": "minimalist",
    "preview": "Aa Preview",
    "google": "Geist"
  },
  {
    "id": "cooper-black-2",
    "family": "Cooper Black 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Cooper+Black"
  },
  {
    "id": "lobster-two-2",
    "family": "Lobster Two 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Lobster+Two"
  },
  {
    "id": "fascinate-inline-2",
    "family": "Fascinate Inline 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Fascinate+Inline"
  },
  {
    "id": "monoton-2",
    "family": "Monoton 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Monoton"
  },
  {
    "id": "righteous-2",
    "family": "Righteous 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Righteous"
  },
  {
    "id": "rye-2",
    "family": "Rye 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Rye"
  },
  {
    "id": "sancreek-2",
    "family": "Sancreek 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Sancreek"
  },
  {
    "id": "ultra-2",
    "family": "Ultra 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Ultra"
  },
  {
    "id": "limelight-2",
    "family": "Limelight 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Limelight"
  },
  {
    "id": "bangers-2",
    "family": "Bangers 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Bangers"
  },
  {
    "id": "bungee-inline-2",
    "family": "Bungee Inline 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Bungee+Inline"
  },
  {
    "id": "ewert-2",
    "family": "Ewert 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Ewert"
  },
  {
    "id": "flavors-2",
    "family": "Flavors 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Flavors"
  },
  {
    "id": "frijole-2",
    "family": "Frijole 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Frijole"
  },
  {
    "id": "honk-2",
    "family": "Honk 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Honk"
  },
  {
    "id": "modak-2",
    "family": "Modak 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Modak"
  },
  {
    "id": "playball-2",
    "family": "Playball 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Playball"
  },
  {
    "id": "rammetto-one-2",
    "family": "Rammetto One 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Rammetto+One"
  },
  {
    "id": "smokum-2",
    "family": "Smokum 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Smokum"
  },
  {
    "id": "special-elite-2",
    "family": "Special Elite 2",
    "category": "retro",
    "preview": "Aa Preview",
    "google": "Special+Elite"
  },
  {
    "id": "inter-3",
    "family": "Inter 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Inter"
  },
  {
    "id": "roboto-3",
    "family": "Roboto 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Roboto"
  },
  {
    "id": "open-sans-3",
    "family": "Open Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Open+Sans"
  },
  {
    "id": "lato-3",
    "family": "Lato 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Lato"
  },
  {
    "id": "montserrat-3",
    "family": "Montserrat 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Montserrat"
  },
  {
    "id": "poppins-3",
    "family": "Poppins 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Poppins"
  },
  {
    "id": "source-sans-3-3",
    "family": "Source Sans 3 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Source+Sans+3"
  },
  {
    "id": "noto-sans-3",
    "family": "Noto Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Noto+Sans"
  },
  {
    "id": "nunito-3",
    "family": "Nunito 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Nunito"
  },
  {
    "id": "raleway-3",
    "family": "Raleway 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Raleway"
  },
  {
    "id": "ubuntu-3",
    "family": "Ubuntu 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Ubuntu"
  },
  {
    "id": "rubik-3",
    "family": "Rubik 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Rubik"
  },
  {
    "id": "work-sans-3",
    "family": "Work Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Work+Sans"
  },
  {
    "id": "dm-sans-3",
    "family": "DM Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "DM+Sans"
  },
  {
    "id": "manrope-3",
    "family": "Manrope 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Manrope"
  },
  {
    "id": "urbanist-3",
    "family": "Urbanist 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Urbanist"
  },
  {
    "id": "plus-jakarta-sans-3",
    "family": "Plus Jakarta Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Plus+Jakarta+Sans"
  },
  {
    "id": "sora-3",
    "family": "Sora 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Sora"
  },
  {
    "id": "public-sans-3",
    "family": "Public Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Public+Sans"
  },
  {
    "id": "mulish-3",
    "family": "Mulish 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Mulish"
  },
  {
    "id": "assistant-3",
    "family": "Assistant 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Assistant"
  },
  {
    "id": "heebo-3",
    "family": "Heebo 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Heebo"
  },
  {
    "id": "cabin-3",
    "family": "Cabin 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Cabin"
  },
  {
    "id": "kanit-3",
    "family": "Kanit 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Kanit"
  },
  {
    "id": "prompt-3",
    "family": "Prompt 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Prompt"
  },
  {
    "id": "josefin-sans-3",
    "family": "Josefin Sans 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Josefin+Sans"
  },
  {
    "id": "quicksand-3",
    "family": "Quicksand 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Quicksand"
  },
  {
    "id": "outfit-3",
    "family": "Outfit 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Outfit"
  },
  {
    "id": "archivo-3",
    "family": "Archivo 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Archivo"
  },
  {
    "id": "barlow-3",
    "family": "Barlow 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Barlow"
  },
  {
    "id": "maven-pro-3",
    "family": "Maven Pro 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Maven+Pro"
  },
  {
    "id": "hind-3",
    "family": "Hind 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Hind"
  },
  {
    "id": "karla-3",
    "family": "Karla 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Karla"
  },
  {
    "id": "lexend-3",
    "family": "Lexend 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Lexend"
  },
  {
    "id": "figtree-3",
    "family": "Figtree 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Figtree"
  },
  {
    "id": "onest-3",
    "family": "Onest 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Onest"
  },
  {
    "id": "geist-3",
    "family": "Geist 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Geist"
  },
  {
    "id": "avenir-3",
    "family": "Avenir 3",
    "category": "sans",
    "preview": "Aa Preview",
    "google": "Avenir"
  }
];

export const FONTS = Array.from(new Set(FONT_ITEMS.map((font) => font.family).filter(Boolean)));
export const FONT_OPTIONS = FONTS;

const LOADED_EDITOR_FONTS = new Set<string>();
let visibleFontQueue = new Set<string>();
let visibleFontScheduled = false;

function scheduleIdle(callback: () => void) {
  if (typeof window === "undefined") return;
  const win = window as any;
  if (typeof win.requestIdleCallback === "function") win.requestIdleCallback(callback, { timeout: 700 });
  else window.setTimeout(callback, 120);
}

export function getFontsByCategory(category: FontCategory | "all") {
  return category === "all" ? FONT_ITEMS : FONT_ITEMS.filter((font) => font.category === category);
}

export function getFontByFamily(family?: string) {
  return FONT_ITEMS.find((font) => font.family === family);
}

export function getGoogleFontHref(font: FontItem) {
  const family = encodeURIComponent(font.google || font.family).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;800;900&display=swap`;
}

export function loadEditorFont(fontOrFamily: FontItem | string) {
  if (typeof document === "undefined") return;
  const font = typeof fontOrFamily === "string" ? getFontByFamily(fontOrFamily) : fontOrFamily;
  if (!font?.google) return;
  const id = `editor-font-${font.id}`;
  if (LOADED_EDITOR_FONTS.has(id) || document.getElementById(id)) {
    LOADED_EDITOR_FONTS.add(id);
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = getGoogleFontHref(font);
  document.head.appendChild(link);
  LOADED_EDITOR_FONTS.add(id);
}

export function loadVisibleEditorFonts(fontFamilies: string[], max = 8) {
  if (typeof window === "undefined") return;
  fontFamilies.filter(Boolean).slice(0, max).forEach((family) => visibleFontQueue.add(family));
  if (visibleFontScheduled) return;
  visibleFontScheduled = true;
  scheduleIdle(() => {
    const next = Array.from(visibleFontQueue).slice(0, max);
    visibleFontQueue = new Set(Array.from(visibleFontQueue).slice(max));
    next.forEach((family) => loadEditorFont(family));
    visibleFontScheduled = false;
    if (visibleFontQueue.size) loadVisibleEditorFonts([], max);
  });
}
