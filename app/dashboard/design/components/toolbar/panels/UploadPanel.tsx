"use client";

import { Image, UploadCloud, ShieldCheck } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { PRINT_IMAGE_LIMITS, bytesToMb, validatePrintImage } from "../data";

type UploadPanelProps = {
  onUpload?: (file: File) => void;
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function UploadPanel({ onUpload }: UploadPanelProps) {
  const [status, setStatus] = useState<string>("PNG, JPG ou WEBP • alta resolução • até 25MB");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ALLOWED_TYPES.includes(file.type) || /\.(png|jpg|jpeg|webp)$/i.test(file.name);
    if (!isValidType) {
      setStatus("Formato inválido. Usa PNG, JPG ou WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > PRINT_IMAGE_LIMITS.maxBytes) {
      setStatus(`Imagem demasiado pesada. Máximo ${bytesToMb(PRINT_IMAGE_LIMITS.maxBytes)}MB.`);
      e.target.value = "";
      return;
    }

    if (typeof onUpload !== "function") {
      e.target.value = "";
      return;
    }

    try {
      const quality = await validatePrintImage(file);
      setStatus(quality.message);

      if (!quality.ok) {
        e.target.value = "";
        return;
      }

      onUpload(file);
    } catch {
      setStatus("Não foi possível validar esta imagem. Tenta outro ficheiro HD.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3 pb-4 text-slate-950">
      <label className="group relative flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-100 px-5 text-center shadow-none ring-1 ring-slate-200 transition active:scale-[0.985]">
        <div className="hidden" />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-none ring-1 ring-slate-200 transition group-active:scale-95">
          <UploadCloud size={32} />
        </div>

        <div className="mt-3">
          <div className="text-base font-black leading-none tracking-[-0.03em]">Upload print-ready</div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
            <Image size={14} /> Alta DPI sem compressão agressiva
          </div>
        </div>

        <input type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
      </label>

      <div className="rounded-2xl bg-slate-100 p-3 ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">Controlo de qualidade automático</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{status}</p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Recomendado: lado menor 2400px+ para manter aspeto profissional em produtos grandes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
