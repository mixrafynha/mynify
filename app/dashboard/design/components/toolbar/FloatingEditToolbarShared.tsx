"use client";

import { memo, useCallback, useEffect, useState } from "react";
import type React from "react";
import { Minus, Plus } from "lucide-react";

export type FloatingEditToolbarProps = {
  selectedElements: any[];
  safeArea: { width: number; height: number };
  updateElement: (id: string, patch: any) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  clearSelection?: () => void;
};

export function MiniStepper({
  value,
  decrease,
  increase,
}: {
  value: string;
  decrease: () => void;
  increase: () => void;
}) {
  return (
    <div className="flex h-10 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e1d]">
      <button
        type="button"
        onClick={decrease}
        className="flex h-full w-9 items-center justify-center text-white/70 hover:bg-white/10"
      >
        <Minus size={15} />
      </button>
      <div className="min-w-14 px-2 text-center text-sm font-black text-white/86">
        {value}
      </div>
      <button
        type="button"
        onClick={increase}
        className="flex h-full w-9 items-center justify-center text-white/70 hover:bg-white/10"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

const MOBILE_COLOR_PRESETS = [
  "#ffffff",
  "#000000",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#6366f1",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#94a3b8",
];

function normalizeColorInput(value: string) {
  const next = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(next)) return next.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(next)) return `#${next.toLowerCase()}`;
  return null;
}

export function ColorChip({
  value,
  onChange,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const safeValue = normalizeColorInput(value) || "#ffffff";
  const [draft, setDraft] = useState(safeValue);

  useEffect(() => {
    setDraft(safeValue);
  }, [safeValue]);

  const commitColor = useCallback(
    (next: string, close = false) => {
      const normalized = normalizeColorInput(next);
      if (!normalized) {
        setDraft(next);
        return;
      }
      setDraft(normalized);
      onChange(normalized);
      if (close) setOpen(false);
    },
    [onChange],
  );

  return (
    <div className="relative shrink-0" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] transition active:scale-95 md:h-9 md:w-9 md:rounded-2xl"
        title={title}
        aria-label={title}
      >
        <span
          className="h-4 w-4 rounded-md border border-white/20 md:h-5 md:w-5 md:rounded-lg"
          style={{ background: safeValue }}
        />
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[120] mx-auto w-[min(280px,calc(100vw-24px))] rounded-2xl border border-violet-300/20 bg-[#080815]/98 p-3 shadow-[0_22px_70px_rgba(0,0,0,0.58)] backdrop-blur-xl md:absolute md:inset-auto md:right-0 md:top-11 md:mx-0 md:w-[260px]">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <label className="relative flex h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                <input
                  type="color"
                  value={safeValue}
                  onChange={(e) => commitColor(e.target.value)}
                  className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer border-0 bg-transparent p-0"
                  aria-label={`${title} custom color`}
                />
              </label>
              <input
                value={draft}
                onChange={(e) => commitColor(e.target.value)}
                onBlur={() => {
                  const normalized = normalizeColorInput(draft);
                  if (normalized) commitColor(normalized);
                  else setDraft(safeValue);
                }}
                className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-3 text-sm font-black uppercase tracking-[0.04em] text-white outline-none transition focus:border-violet-300/55 focus:bg-white/[0.08]"
                spellCheck={false}
                inputMode="text"
                aria-label={`${title} hex color`}
              />
            </div>

            <div className="grid grid-cols-6 gap-2">
              {MOBILE_COLOR_PRESETS.map((color) => {
                const selected = color.toLowerCase() === safeValue.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`${title} ${color}`}
                    onClick={() => commitColor(color, true)}
                    className={`h-8 w-8 rounded-xl border transition active:scale-95 ${
                      selected ? "border-white ring-2 ring-violet-300/80" : "border-white/15"
                    }`}
                    style={{ background: color }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
      <ColorChip value={value} onChange={onChange} title={label} />
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const display =
    suffix === "" && max === 1
      ? `${Math.round(value * 100)}%`
      : `${Number(value).toFixed(step < 1 ? 2 : 0)}${suffix}`;

  return (
    <div className="grid gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/42">
          {label}
        </span>
        <span className="text-[11px] font-black text-white/76">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-400"
      />
    </div>
  );
}

export function MobileNumberStepper({
  value,
  decrease,
  increase,
}: {
  value: number;
  decrease: () => void;
  increase: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
      <button
        type="button"
        onClick={decrease}
        className="flex h-full w-9 items-center justify-center active:bg-white/10"
      >
        <Minus size={15} />
      </button>
      <div className="min-w-12 px-2 text-center text-sm font-black text-white">
        {value}
      </div>
      <button
        type="button"
        onClick={increase}
        className="flex h-full w-9 items-center justify-center active:bg-white/10"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

export function MobileIconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 min-w-[54px] shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-white/80 active:bg-white/10 disabled:opacity-35"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export function IconButton({
  children,
  label,
  active,
  danger,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 min-w-0 items-center justify-center rounded-2xl border px-2 text-xs font-black transition active:scale-[0.97] disabled:opacity-35 ${
        danger
          ? "border-rose-400/25 bg-rose-500/12 text-rose-200 hover:bg-rose-500/18"
          : active
            ? "border-violet-300/40 bg-violet-500/20 text-violet-100"
            : "border-white/10 bg-white/[0.055] text-white/76 hover:bg-white/[0.1]"
      }`}
    >
      {children}
    </button>
  );
}

export default memo(function FloatingEditToolbarSharedMarker() {
  return null;
});
