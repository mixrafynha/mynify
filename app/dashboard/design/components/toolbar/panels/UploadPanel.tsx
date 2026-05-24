"use client";

import { Image, UploadCloud } from "lucide-react";
import { ChangeEvent } from "react";

type UploadPanelProps = {
  onUpload?: (file: File) => void;
};

export default function UploadPanel({ onUpload }: UploadPanelProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (typeof onUpload !== "function") {
      console.warn("UploadPanel: onUpload não foi passado.");
      e.target.value = "";
      return;
    }

    onUpload(file);
    e.target.value = "";
  };

  return (
    <label className="group flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[30px] border-2 border-dashed border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-5 text-center font-black text-violet-700 shadow-[0_18px_45px_rgba(124,58,237,0.12)] transition active:scale-[0.98]">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 text-white shadow-[0_14px_35px_rgba(124,58,237,0.35)] transition group-active:scale-95">
        <UploadCloud size={34} />
      </div>

      <div>
        <div className="text-lg leading-none">Upload image</div>

        <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-violet-500/80">
          <Image size={14} />
          PNG, JPG ou WEBP • máx. 2MB
        </div>
      </div>

      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  );
}