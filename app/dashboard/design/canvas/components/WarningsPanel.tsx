"use client";

import { memo, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Gauge, X } from "lucide-react";
import { calculateElementDPI } from "../engine/dpi";
import { getElementSize } from "../canvasMath";

interface WarningItem {
  id: string;
  type: string;
  severity: "warning" | "error";
  message: string;
  elementId: string;
  dpi?: number | null;
}

interface WarningsPanelProps {
  warnings: WarningItem[];
  warningCount: number;
  quality: "Excellent" | "Good" | "Poor";
  elements?: any[];
  safeArea?: { width: number; height: number };
  printSize?: { widthMm: number; heightMm: number };
}

function getProductionDpis(elements: any[], safeArea?: { width: number; height: number }, printSize?: { widthMm: number; heightMm: number }) {
  if (!safeArea?.width || !safeArea?.height || !printSize?.widthMm || !printSize?.heightMm) return [];

  return (Array.isArray(elements) ? elements : [])
    .filter((el) => el?.type === "image")
    .slice(0, 30)
    .map((el) => {
      const size = getElementSize(el);
      const naturalWidth = Number(el?.meta?.naturalWidth || el?.naturalWidth || 0);
      const naturalHeight = Number(el?.meta?.naturalHeight || el?.naturalHeight || 0);

      if (!naturalWidth || !naturalHeight || !size.width || !size.height) return null;

      return calculateElementDPI({
        naturalWidth,
        naturalHeight,
        elementWidth: size.width,
        elementHeight: size.height,
        printBoxWidth: safeArea.width,
        printBoxHeight: safeArea.height,
        printWidthMm: printSize.widthMm,
        printHeightMm: printSize.heightMm,
      });
    })
    .filter((dpi): dpi is NonNullable<typeof dpi> => !!dpi && typeof dpi.dpi === "number");
}

function getDpiStatus(dpi: number | null) {
  if (!dpi) return { label: "DPI —", detail: "No image", tone: "neutral" as const };
  if (dpi >= 250) return { label: `${dpi} DPI`, detail: "Production ready", tone: "ready" as const };
  if (dpi >= 150) return { label: `${dpi} DPI`, detail: "Good", tone: "good" as const };
  return { label: `${dpi} DPI`, detail: "Low quality", tone: "risk" as const };
}

function getStatus(quality: WarningsPanelProps["quality"], warningCount: number) {
  if (warningCount === 0) return { label: "Print Ready", short: "OK", tone: "ready" as const };
  if (quality === "Good") return { label: "Check warnings", short: String(warningCount), tone: "good" as const };
  return { label: "Production Risk", short: String(warningCount), tone: "risk" as const };
}

function toneClass(tone: "ready" | "good" | "risk" | "neutral") {
  if (tone === "ready") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (tone === "good") return "border-yellow-300/30 bg-yellow-300/12 text-yellow-100";
  if (tone === "risk") return "border-rose-400/30 bg-rose-500/12 text-rose-100";
  return "border-white/10 bg-white/[0.06] text-white/60";
}

function WarningsPanel({ warnings, warningCount, quality, elements = [], safeArea, printSize }: WarningsPanelProps) {
  const [open, setOpen] = useState(false);

  const dpiList = useMemo(() => getProductionDpis(elements, safeArea, printSize), [elements, safeArea, printSize]);
  const minDpi = useMemo(() => (dpiList.length ? Math.min(...dpiList.map((item) => Number(item.dpi || 0)).filter(Boolean)) : null), [dpiList]);

  const status = getStatus(quality, warningCount);
  const dpiStatus = getDpiStatus(minDpi);

  return (
    <>
      <div className="absolute right-3 top-3 z-[70] flex items-center gap-1.5 md:right-4 md:top-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[10px] font-black shadow-[0_6px_16px_rgba(0,0,0,0.20)] backdrop-blur-md transition hover:brightness-110 active:scale-95 md:h-7 md:px-2 ${toneClass(status.tone)}`}
          title="Open production warnings"
        >
          {warningCount === 0 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
          <span>{status.short}</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[10px] font-black shadow-[0_6px_16px_rgba(0,0,0,0.20)] backdrop-blur-md transition hover:brightness-110 active:scale-95 md:h-7 md:px-2 ${toneClass(dpiStatus.tone)}`}
          title="Open DPI details"
        >
          <Gauge size={12} />
          <span>{dpiStatus.label}</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] md:items-center md:p-4">
          <button className="absolute inset-0" aria-label="Close warnings" onClick={() => setOpen(false)} />
          <section className="relative w-full max-w-[520px] overflow-hidden rounded-t-[26px] border border-white/10 bg-[#080816]/96 text-white shadow-[0_28px_90px_rgba(0,0,0,0.58)] md:rounded-[26px]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />

            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200/70">Production check</p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">{status.label}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-white/70 active:scale-95">
                <X size={17} />
              </button>
            </header>

            <div className="grid grid-cols-2 gap-2 px-5 pt-4">
              <InfoCard label="DPI" value={dpiStatus.label} hint={dpiStatus.detail} />
              <InfoCard label="Warnings" value={String(warningCount)} hint={warningCount ? "Needs review" : "No risk"} />
              <InfoCard label="Print size" value={printSize ? `${printSize.widthMm}×${printSize.heightMm}mm` : "—"} hint="Real production area" />
              <InfoCard label="Status" value={status.label} hint={quality} />
            </div>

            <div className="max-h-[42dvh] overflow-y-auto px-5 py-4 md:max-h-[360px]">
              {warningCount === 0 ? (
                <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
                  Print Ready. DPI and print area are valid for production.
                </div>
              ) : (
                <div className="space-y-2">
                  {warnings.map((warning) => (
                    <div key={warning.id} className="rounded-[18px] border border-white/10 bg-white/[0.045] p-3">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <AlertTriangle size={15} className={warning.severity === "error" ? "text-rose-300" : "text-yellow-300"} />
                        {warning.type.replaceAll("_", " ")}
                      </div>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-white/58">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function InfoCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.045] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
      {hint && <p className="mt-0.5 truncate text-[10px] font-bold text-white/38">{hint}</p>}
    </div>
  );
}

export default memo(WarningsPanel);
