"use client";

import { memo } from "react";
import { AlertTriangle, CheckCircle2, Shirt } from "lucide-react";
import type { PreviewSide, PreviewSideData } from "./types/preview";

function Thumb({
  data,
  active,
  onClick,
}: {
  data: PreviewSideData;
  active: boolean;
  onClick: () => void;
}) {
  const ok = data.validation.status === "ready";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border p-2 text-left transition active:scale-[.98] ${
        active
          ? "border-cyan-300/50 bg-cyan-300/12 shadow-[0_18px_40px_rgba(34,211,238,.12)]"
          : "border-white/10 bg-white/[.04] hover:bg-white/[.07]"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black/30">
        {data.mockupUrl ? (
          <img
            src={data.mockupUrl}
            alt={data.side}
            className="h-full w-full object-contain opacity-95 transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <Shirt size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <div>
          <span className="text-sm font-black capitalize text-white">{data.side}</span>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/34">
            {data.elements.length} layers
          </p>
        </div>
        <span className={ok ? "text-emerald-300" : "text-amber-300"}>
          {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        </span>
      </div>
    </button>
  );
}

function PreviewSides({
  front,
  back,
  activeSide,
  setActiveSide,
}: {
  front: PreviewSideData;
  back: PreviewSideData;
  activeSide: PreviewSide;
  setActiveSide: (side: PreviewSide) => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-2.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-white">Product sides</h3>
        <span className="text-[10px] font-black uppercase tracking-[.16em] text-white/34">
          instant switch
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Thumb data={front} active={activeSide === "front"} onClick={() => setActiveSide("front")} />
        <Thumb data={back} active={activeSide === "back"} onClick={() => setActiveSide("back")} />
      </div>
    </section>
  );
}

export default memo(PreviewSides);
