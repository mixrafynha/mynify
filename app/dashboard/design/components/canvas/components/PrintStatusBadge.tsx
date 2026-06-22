"use client";

import { memo } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { PrintDiagnostics } from "../engine/printDiagnostics";

function tone(severity: PrintDiagnostics["severity"]) {
  if (severity === "ready") return "border-emerald-300/25 bg-emerald-400/12 text-emerald-100";
  if (severity === "error") return "border-rose-300/30 bg-rose-500/15 text-rose-100";
  return "border-amber-300/30 bg-amber-400/12 text-amber-100";
}

function Icon({ severity }: { severity: PrintDiagnostics["severity"] }) {
  if (severity === "ready") return <CheckCircle2 size={17} />;
  if (severity === "error") return <ShieldAlert size={17} />;
  if (severity === "warning") return <AlertTriangle size={17} />;
  return <Info size={17} />;
}

function PrintStatusBadge({ diagnostics }: { diagnostics: PrintDiagnostics }) {
  const firstWarning = diagnostics.warnings[0];

  return (
    <aside className="pointer-events-auto fixed inset-x-3 bottom-[82px] z-50 md:absolute md:bottom-auto md:left-auto md:right-4 md:top-4 md:w-[320px]">
      <div className={`overflow-hidden rounded-3xl border shadow-[0_18px_60px_rgba(0,0,0,.38)] backdrop-blur-2xl ${tone(diagnostics.severity)}`}>
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Icon severity={diagnostics.severity} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black tracking-[-.02em]">{diagnostics.status}</p>
              <span className="rounded-full bg-black/20 px-2 py-1 text-[11px] font-black">{diagnostics.score}%</span>
            </div>
            <p className="mt-1 truncate text-xs font-medium opacity-80">
              {firstWarning ? firstWarning.message : "Design is ready for production export."}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] font-bold uppercase tracking-[.08em] opacity-80">
              <span>DPI {diagnostics.minDpi ?? "—"}</span>
              <span>{diagnostics.layerCount} layers</span>
              <span>{diagnostics.resolution}</span>
            </div>
          </div>
        </div>

        {diagnostics.warnings.length > 0 && (
          <div className="border-t border-white/10 px-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {diagnostics.warnings.slice(0, 4).map((warning) => (
                <span key={warning.id} className="rounded-full bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[.06em]">
                  {warning.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default memo(PrintStatusBadge);
