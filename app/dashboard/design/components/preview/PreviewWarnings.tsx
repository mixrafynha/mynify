"use client";

import { memo } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { PreviewValidationResult } from "./types/preview";

function PreviewWarnings({ validation }: { validation: PreviewValidationResult }) {
  if (!validation.warnings.length) {
    return <section className="rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-4 text-emerald-100"><div className="flex items-center gap-2 text-sm font-black"><CheckCircle2 size={18} /> No production warnings</div><p className="mt-1 text-xs font-semibold text-emerald-100/60">This side is clean for preview and production export.</p></section>;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-white">Production Warnings</h3><span className="rounded-full bg-white/[.07] px-2 py-1 text-[11px] font-black text-white/60">{validation.warnings.length}</span></div>
      <div className="space-y-2">
        {validation.warnings.map((w) => {
          const Icon = w.severity === "danger" ? ShieldAlert : w.severity === "warning" ? AlertTriangle : Info;
          const cls = w.severity === "danger" ? "border-rose-300/15 bg-rose-500/10 text-rose-100" : w.severity === "warning" ? "border-amber-300/15 bg-amber-400/10 text-amber-100" : "border-cyan-300/15 bg-cyan-400/10 text-cyan-100";
          return <div key={w.id} className={`rounded-2xl border p-3 ${cls}`}><div className="flex gap-2"><Icon size={16} className="mt-0.5 shrink-0" /><div><p className="text-xs font-black">{w.title}</p><p className="mt-0.5 text-xs font-semibold opacity-70">{w.message}</p></div></div></div>;
        })}
      </div>
    </section>
  );
}

export default memo(PreviewWarnings);
