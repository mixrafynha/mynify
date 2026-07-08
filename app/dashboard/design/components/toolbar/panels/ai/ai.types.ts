export type AiImageItem = {
  id?: string | null;
  generationId?: string | null;
  generation_id?: string | null;
  title?: string | null;
  prompt?: string | null;
  src?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  printUrl?: string | null;
  url?: string | null;
  r2Key?: string | null;
  storage_key?: string | null;
  originalImageUrl?: string | null;
  original_image_url?: string | null;
  width?: number | null;
  height?: number | null;
  dpi?: number | null;
  transparent?: boolean;
  saved?: boolean;
  qualityMode?: string;
};

export type AiCreditPack = {
  id: string;
  name: string;
  label: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceCents: number;
  currency: string;
  note: string;
  highlight: boolean;
  sortOrder: number;
};

export type UseAiImagesArgs = {
  createElement?: (data: any) => void;
};

export type BuyCreditsOptions = {
  packId: string;
  source?: "editor" | "credits_page";
};


export type CanvasImageElementInput = {
  type: "image";
  src: string;
  printUrl?: string;
  imageUrl?: string;
  url?: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
  width: number;
  height: number;
  meta?: Record<string, unknown>;
};
