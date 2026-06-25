"use client";

import { memo, useMemo } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { getPrintDiagnostics } from "../canvas/engine/printDiagnostics";

type Props = {
  frontElements: any[];
  backElements: any[];
  frontSafeArea?: any;
  backSafeArea?: any;
  mockup?: React.ReactNode;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-white/8 py-2 text-sm"><span className="text-white/55">{label}</span><span className="font-bold text-white">{value}</span></div>;
}

function SideCard({ title, elements, safeArea }: { title: string; elements: any[]; safeArea?: any }) {
  const report = useMemo(() => getPrintDiagnostics(elements, safeArea || { x: 0, y: 0, width: 756, height: 756 }), [elements, safeArea]);
  const ready = report.severity !== "error";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[.045] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black tracking-[-.04em]">{title}</h3>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${ready ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-500/20 text-rose-100"}`}>
          {ready ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}{report.status}
        </span>
      </div>
      <div className="mt-3">
        <Row label="DPI" value={report.minDpi ?? "—"} />
        <Row label="Export Size" value={report.exportSize} />
        <Row label="Resolution" value={report.resolution} />
        <Row label="Layers" value={report.layerCount} />
        <Row label="Warnings" value={report.warningCount} />
      </div>
      {report.warnings.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{report.warnings.slice(0, 5).map((w) => <span key={w.id} className="rounded-full bg-black/25 px-2 py-1 text-[10px] font-black uppercase text-white/75">{w.label}</span>)}</div>}
    </section>
  );
}

function ProductionPreviewPanel({ frontElements, backElements, frontSafeArea, backSafeArea, mockup }: Props) {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-violet-400/15 bg-[#090a15]/95 p-4 text-white shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_360px]">
      <div className="min-h-[280px] overflow-hidden rounded-[1.5rem] bg-black/25 ring-1 ring-white/10">
        {mockup ?? <div className="flex h-full min-h-[280px] items-center justify-center text-sm font-bold text-white/45">Production Mockup</div>}
      </div>
      <div className="grid gap-3">
        <SideCard title="Front" elements={frontElements} safeArea={frontSafeArea} />
        <SideCard title="Back" elements={backElements} safeArea={backSafeArea} />
      </div>
    </div>
  );
}

export default memo(ProductionPreviewPanel);
