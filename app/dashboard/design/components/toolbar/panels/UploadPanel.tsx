"use client";

import { Image } from "lucide-react";

type UploadPanelProps = {
  onUploadClick?: () => void;
};

export default function UploadPanel({ onUploadClick }: UploadPanelProps) {
  return (
    <button
      type="button"
      onClick={onUploadClick}
      className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50 font-black text-violet-700 active:scale-[0.98]"
    >
      <Image size={28} />
      Upload image
      <span className="text-xs font-medium opacity-70">PNG, JPG or WEBP</span>
    </button>
  );
}