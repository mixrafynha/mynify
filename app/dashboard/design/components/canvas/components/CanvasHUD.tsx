"use client";

import { memo } from "react";
import { Layers, MousePointer2, ScanLine, ZoomIn } from "lucide-react";
import type { PrintDiagnostics } from "../engine/printDiagnostics";

function CanvasHUD({ zoom, diagnostics, selectedElement }: { zoom: number; diagnostics: PrintDiagnostics; selectedElement?: any | null }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-40 hidden max-w-[calc(100%-390px)] items-center gap-1.5 rounded-2xl border border-white/10 bg-[#070711]/70 px-2 py-1.5 text-[11px] font-bold text-white/80 shadow-[0_14px_42px_rgba(0,0,0,.32)] backdrop-blur-xl md:flex">
      <span className="inline-flex items-center gap-1 rounded-xl bg-white/[.07] px-2 py-1"><ZoomIn size={13} />{Math.round(zoom * 100)}%</span>
      <span className="inline-flex items-center gap-1 rounded-xl bg-white/[.07] px-2 py-1"><ScanLine size={13} />DPI {diagnostics.minDpi ?? "—"}</span>
      <span className="inline-flex items-center gap-1 rounded-xl bg-white/[.07] px-2 py-1">{diagnostics.resolution}</span>
      <span className="inline-flex items-center gap-1 rounded-xl bg-white/[.07] px-2 py-1"><Layers size={13} />{diagnostics.layerCount}</span>
      <span className="inline-flex items-center gap-1 rounded-xl bg-white/[.07] px-2 py-1"><MousePointer2 size={13} />{selectedElement?.type ?? "none"}</span>
      {diagnostics.warningCount > 0 && <span className="rounded-xl bg-rose-500/20 px-2 py-1 text-rose-100">{diagnostics.warningCount} warnings</span>}
    </div>
  );
}

export default memo(CanvasHUD);
