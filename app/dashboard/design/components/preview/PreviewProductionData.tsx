"use client";

import { memo } from "react";
import { Gauge, Layers3, Maximize2, Ruler } from "lucide-react";
import type { PreviewSideData } from "./types/preview";

function Card({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[.07] text-cyan-100">{icon}</div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/38">{label}</p><p className="mt-1 text-lg font-black tracking-[-.04em] text-white">{value}</p>{hint && <p className="mt-1 text-xs font-semibold text-white/40">{hint}</p>}</div>;
}

function PreviewProductionData({ data }: { data: PreviewSideData }) {
  const dpi = data.validation.dpi ? `${data.validation.dpi} DPI` : "Vector / Text";
  return (
    <section className="grid grid-cols-2 gap-2">
      <Card icon={<Ruler size={17} />} label="Print Size" value={`${data.printSize.widthMm} × ${data.printSize.heightMm} mm`} />
      <Card icon={<Maximize2 size={17} />} label="Export Resolution" value={`${data.exportResolution.width} × ${data.exportResolution.height} px`} />
      <Card icon={<Gauge size={17} />} label="Current DPI" value={dpi} hint="Calculated from original pixels vs printed size" />
      <Card icon={<Layers3 size={17} />} label="Layers" value={`${data.elements.length} Layers`} />
    </section>
  );
}

export default memo(PreviewProductionData);
