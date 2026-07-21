
export interface ShapePreset {
    id?: string;
    category: string;
    label: string;
    
    // legado
    value: string;
    
    // novo sistema de assets (opcional)
    svg?: string;
    preview?: string;
    
    color?: string;
    fontFamily?: string;
    fontSize?: number;
}

export const SHAPE_CATEGORIES = ["Basic","Arrows","Banners","Badges","Speech","Geometric","Organic","Frames","Stars","Decorative"] as const;

export const SHAPES: ShapePreset[] = [
  {
    "id": "shape-1",
    "category": "Basic",
    "label": "Basic 1",
    "value": "●",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-2",
    "category": "Arrows",
    "label": "Arrows 2",
    "value": "■",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-3",
    "category": "Banners",
    "label": "Banners 3",
    "value": "▲",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-4",
    "category": "Badges",
    "label": "Badges 4",
    "value": "◆",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-5",
    "category": "Speech",
    "label": "Speech 5",
    "value": "▬",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-6",
    "category": "Geometric",
    "label": "Geometric 6",
    "value": "◎",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-7",
    "category": "Organic",
    "label": "Organic 7",
    "value": "★",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-8",
    "category": "Frames",
    "label": "Frames 8",
    "value": "✦",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-9",
    "category": "Stars",
    "label": "Stars 9",
    "value": "✧",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-10",
    "category": "Decorative",
    "label": "Decorative 10",
    "value": "✺",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-11",
    "category": "Basic",
    "label": "Basic 11",
    "value": "✹",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-12",
    "category": "Arrows",
    "label": "Arrows 12",
    "value": "♥",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-13",
    "category": "Banners",
    "label": "Banners 13",
    "value": "☾",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-14",
    "category": "Badges",
    "label": "Badges 14",
    "value": "☀",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-15",
    "category": "Speech",
    "label": "Speech 15",
    "value": "☁",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-16",
    "category": "Geometric",
    "label": "Geometric 16",
    "value": "✚",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-17",
    "category": "Organic",
    "label": "Organic 17",
    "value": "✓",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-18",
    "category": "Frames",
    "label": "Frames 18",
    "value": "×",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-19",
    "category": "Stars",
    "label": "Stars 19",
    "value": "+",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-20",
    "category": "Decorative",
    "label": "Decorative 20",
    "value": "01",
    "fontFamily": "Arial",
    "fontSize": 46,
    "color": "#111111"
  },
  {
    "id": "shape-21",
    "category": "Basic",
    "label": "Basic 21",
    "value": "➜",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-22",
    "category": "Arrows",
    "label": "Arrows 22",
    "value": "➤",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-23",
    "category": "Banners",
    "label": "Banners 23",
    "value": "↗",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-24",
    "category": "Badges",
    "label": "Badges 24",
    "value": "↘",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-25",
    "category": "Speech",
    "label": "Speech 25",
    "value": "↯",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-26",
    "category": "Geometric",
    "label": "Geometric 26",
    "value": "⇢",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-27",
    "category": "Organic",
    "label": "Organic 27",
    "value": "⬢",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-28",
    "category": "Frames",
    "label": "Frames 28",
    "value": "⬟",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-29",
    "category": "Stars",
    "label": "Stars 29",
    "value": "⬣",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-30",
    "category": "Decorative",
    "label": "Decorative 30",
    "value": "▰",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-31",
    "category": "Basic",
    "label": "Basic 31",
    "value": "▱",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-32",
    "category": "Arrows",
    "label": "Arrows 32",
    "value": "◖",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-33",
    "category": "Banners",
    "label": "Banners 33",
    "value": "◗",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-34",
    "category": "Badges",
    "label": "Badges 34",
    "value": "◍",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-35",
    "category": "Speech",
    "label": "Speech 35",
    "value": "◐",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-36",
    "category": "Geometric",
    "label": "Geometric 36",
    "value": "◒",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-37",
    "category": "Organic",
    "label": "Organic 37",
    "value": "◓",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-38",
    "category": "Frames",
    "label": "Frames 38",
    "value": "◔",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-39",
    "category": "Stars",
    "label": "Stars 39",
    "value": "◕",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-40",
    "category": "Decorative",
    "label": "Decorative 40",
    "value": "◭",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-41",
    "category": "Basic",
    "label": "Basic 41",
    "value": "◮",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-42",
    "category": "Arrows",
    "label": "Arrows 42",
    "value": "●",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-43",
    "category": "Banners",
    "label": "Banners 43",
    "value": "■",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-44",
    "category": "Badges",
    "label": "Badges 44",
    "value": "▲",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-45",
    "category": "Speech",
    "label": "Speech 45",
    "value": "◆",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-46",
    "category": "Geometric",
    "label": "Geometric 46",
    "value": "▬",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-47",
    "category": "Organic",
    "label": "Organic 47",
    "value": "◎",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-48",
    "category": "Frames",
    "label": "Frames 48",
    "value": "★",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-49",
    "category": "Stars",
    "label": "Stars 49",
    "value": "✦",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-50",
    "category": "Decorative",
    "label": "Decorative 50",
    "value": "✧",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-51",
    "category": "Basic",
    "label": "Basic 51",
    "value": "✺",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-52",
    "category": "Arrows",
    "label": "Arrows 52",
    "value": "✹",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-53",
    "category": "Banners",
    "label": "Banners 53",
    "value": "♥",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-54",
    "category": "Badges",
    "label": "Badges 54",
    "value": "☾",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-55",
    "category": "Speech",
    "label": "Speech 55",
    "value": "☀",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-56",
    "category": "Geometric",
    "label": "Geometric 56",
    "value": "☁",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-57",
    "category": "Organic",
    "label": "Organic 57",
    "value": "✚",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-58",
    "category": "Frames",
    "label": "Frames 58",
    "value": "✓",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-59",
    "category": "Stars",
    "label": "Stars 59",
    "value": "×",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-60",
    "category": "Decorative",
    "label": "Decorative 60",
    "value": "+",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-61",
    "category": "Basic",
    "label": "Basic 61",
    "value": "01",
    "fontFamily": "Arial",
    "fontSize": 46,
    "color": "#111111"
  },
  {
    "id": "shape-62",
    "category": "Arrows",
    "label": "Arrows 62",
    "value": "➜",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-63",
    "category": "Banners",
    "label": "Banners 63",
    "value": "➤",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-64",
    "category": "Badges",
    "label": "Badges 64",
    "value": "↗",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-65",
    "category": "Speech",
    "label": "Speech 65",
    "value": "↘",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-66",
    "category": "Geometric",
    "label": "Geometric 66",
    "value": "↯",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-67",
    "category": "Organic",
    "label": "Organic 67",
    "value": "⇢",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-68",
    "category": "Frames",
    "label": "Frames 68",
    "value": "⬢",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-69",
    "category": "Stars",
    "label": "Stars 69",
    "value": "⬟",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-70",
    "category": "Decorative",
    "label": "Decorative 70",
    "value": "⬣",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-71",
    "category": "Basic",
    "label": "Basic 71",
    "value": "▰",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-72",
    "category": "Arrows",
    "label": "Arrows 72",
    "value": "▱",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-73",
    "category": "Banners",
    "label": "Banners 73",
    "value": "◖",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-74",
    "category": "Badges",
    "label": "Badges 74",
    "value": "◗",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-75",
    "category": "Speech",
    "label": "Speech 75",
    "value": "◍",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-76",
    "category": "Geometric",
    "label": "Geometric 76",
    "value": "◐",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-77",
    "category": "Organic",
    "label": "Organic 77",
    "value": "◒",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-78",
    "category": "Frames",
    "label": "Frames 78",
    "value": "◓",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-79",
    "category": "Stars",
    "label": "Stars 79",
    "value": "◔",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-80",
    "category": "Decorative",
    "label": "Decorative 80",
    "value": "◕",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-81",
    "category": "Basic",
    "label": "Basic 81",
    "value": "◭",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-82",
    "category": "Arrows",
    "label": "Arrows 82",
    "value": "◮",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-83",
    "category": "Banners",
    "label": "Banners 83",
    "value": "●",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-84",
    "category": "Badges",
    "label": "Badges 84",
    "value": "■",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-85",
    "category": "Speech",
    "label": "Speech 85",
    "value": "▲",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-86",
    "category": "Geometric",
    "label": "Geometric 86",
    "value": "◆",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-87",
    "category": "Organic",
    "label": "Organic 87",
    "value": "▬",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-88",
    "category": "Frames",
    "label": "Frames 88",
    "value": "◎",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-89",
    "category": "Stars",
    "label": "Stars 89",
    "value": "★",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-90",
    "category": "Decorative",
    "label": "Decorative 90",
    "value": "✦",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-91",
    "category": "Basic",
    "label": "Basic 91",
    "value": "✧",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-92",
    "category": "Arrows",
    "label": "Arrows 92",
    "value": "✺",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-93",
    "category": "Banners",
    "label": "Banners 93",
    "value": "✹",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-94",
    "category": "Badges",
    "label": "Badges 94",
    "value": "♥",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-95",
    "category": "Speech",
    "label": "Speech 95",
    "value": "☾",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-96",
    "category": "Geometric",
    "label": "Geometric 96",
    "value": "☀",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-97",
    "category": "Organic",
    "label": "Organic 97",
    "value": "☁",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-98",
    "category": "Frames",
    "label": "Frames 98",
    "value": "✚",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-99",
    "category": "Stars",
    "label": "Stars 99",
    "value": "✓",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-100",
    "category": "Decorative",
    "label": "Decorative 100",
    "value": "×",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-101",
    "category": "Basic",
    "label": "Basic 101",
    "value": "+",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-102",
    "category": "Arrows",
    "label": "Arrows 102",
    "value": "01",
    "fontFamily": "Arial",
    "fontSize": 46,
    "color": "#111111"
  },
  {
    "id": "shape-103",
    "category": "Banners",
    "label": "Banners 103",
    "value": "➜",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-104",
    "category": "Badges",
    "label": "Badges 104",
    "value": "➤",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-105",
    "category": "Speech",
    "label": "Speech 105",
    "value": "↗",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-106",
    "category": "Geometric",
    "label": "Geometric 106",
    "value": "↘",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-107",
    "category": "Organic",
    "label": "Organic 107",
    "value": "↯",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-108",
    "category": "Frames",
    "label": "Frames 108",
    "value": "⇢",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-109",
    "category": "Stars",
    "label": "Stars 109",
    "value": "⬢",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-110",
    "category": "Decorative",
    "label": "Decorative 110",
    "value": "⬟",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-111",
    "category": "Basic",
    "label": "Basic 111",
    "value": "⬣",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-112",
    "category": "Arrows",
    "label": "Arrows 112",
    "value": "▰",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-113",
    "category": "Banners",
    "label": "Banners 113",
    "value": "▱",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-114",
    "category": "Badges",
    "label": "Badges 114",
    "value": "◖",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-115",
    "category": "Speech",
    "label": "Speech 115",
    "value": "◗",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-116",
    "category": "Geometric",
    "label": "Geometric 116",
    "value": "◍",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-117",
    "category": "Organic",
    "label": "Organic 117",
    "value": "◐",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-118",
    "category": "Frames",
    "label": "Frames 118",
    "value": "◒",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-119",
    "category": "Stars",
    "label": "Stars 119",
    "value": "◓",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  },
  {
    "id": "shape-120",
    "category": "Decorative",
    "label": "Decorative 120",
    "value": "◔",
    "fontFamily": "Arial",
    "fontSize": 64,
    "color": "#111111"
  }
];