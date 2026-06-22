"use client";

import { Image, UploadCloud, ShieldCheck } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { PRINT_IMAGE_LIMITS, bytesToMb, validatePrintImage } from "../data";

type UploadPanelProps = {
  onUpload?: (file: File) => void;
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export default function UploadPanel({ onUpload }: UploadPanelProps) {
  const [status, setStatus] = useState<string>("PNG, JPG, WEBP ou SVG • transparência preservada • até 25MB");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ALLOWED_TYPES.includes(file.type) || /\.(png|jpg|jpeg|webp|svg)$/i.test(file.name);
    if (!isValidType) {
      setStatus("Formato inválido. Usa PNG, JPG, WEBP ou SVG.");
      e.target.value = "";
      return;
    }

    if (file.size > PRINT_IMAGE_LIMITS.maxFileSize) {
      setStatus(`Imagem demasiado pesada. Máximo ${bytesToMb(PRINT_IMAGE_LIMITS.maxFileSize)}MB.`);
      e.target.value = "";
      return;
    }

    if (typeof onUpload !== "function") {
      console.warn("UploadPanel: onUpload não foi passado.");
      e.target.value = "";
      return;
    }

    try {
      if (/\.svg$/i.test(file.name) || file.type === "image/svg+xml") {
        setStatus("SVG aceite como vetor: DPI Excellent e transparência preservada.");
        onUpload(file);
        return;
      }

      const quality: any = await validatePrintImage(file);
      const dpi = Number(quality.effectiveDpi || quality.dpi || quality.metadataDpi || 0);
      const under400 = dpi > 0 && dpi < 400;
      setStatus(under400 ? `${quality.message} • precisa de 400 DPI+ para print final.` : quality.message);

      if (!quality.ok || under400) {
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
    <div className="space-y-3 pb-4 text-slate-900">
      <label className="group relative flex min-h-[132px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center transition active:scale-[0.99]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900 ring-1 ring-slate-200 transition group-active:scale-95">
          <UploadCloud size={23} />
        </div>

        <div className="mt-3">
          <div className="text-sm font-black leading-none tracking-[-0.04em]">Upload print-ready</div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Image size={14} /> Alta DPI sem compressão agressiva
          </div>
        </div>

        <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFileChange} />
      </label>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-black">Controlo de qualidade automático</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{status}</p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Obrigatório: 400 DPI+ ou SVG/vetor. PNG/WebP transparentes mantêm alpha sem fundo branco.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
