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
    <div className="space-y-4 pb-6 text-white">
      <label className="group relative flex min-h-[190px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_25%_0%,rgba(34,211,238,0.26),transparent_34%),radial-gradient(circle_at_75%_100%,rgba(168,85,247,0.28),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.035))] px-5 text-center shadow-[0_22px_60px_rgba(0,0,0,0.28)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-cyan-300/35 active:scale-[0.985]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />

        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-slate-950 shadow-[0_18px_42px_rgba(34,211,238,0.22)] transition group-active:scale-95">
          <UploadCloud size={32} />
        </div>

        <div className="mt-4">
          <div className="text-lg font-black leading-none tracking-[-0.04em]">Upload print-ready</div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
            <Image size={14} /> Alta DPI sem compressão agressiva
          </div>
        </div>

        <input type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
      </label>

      <div className="rounded-[26px] bg-white/[0.045] p-4 ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-black">Controlo de qualidade automático</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-400">{status}</p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">Recomendado: lado menor 2400px+ para manter aspeto profissional em produtos grandes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
