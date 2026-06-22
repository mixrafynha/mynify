"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  BringToFront,
  Copy,
  FlipHorizontal,
  Image as ImageIcon,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  SendToBack,
  SlidersHorizontal,
  Trash2,
  Type,
  Unlock,
  X,
} from "lucide-react";
import { FONT_ITEMS, loadEditorFont } from "../data";

type FloatingEditToolbarProps = {
  selectedElements: any[];
  safeArea: { width: number; height: number };
  updateElement: (id: string, patch: any) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  clearSelection?: () => void;
};

const MIN_TEXT_SIZE = 8;
const MAX_TEXT_SIZE = 220;
const MIN_ELEMENT_SIZE = 24;
const MAX_ELEMENT_SIZE = 2200;

function finite(value: any, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getElementLabel(el: any) {
  if (!el) return "Element";
  if (el.type === "text") return "Text";
  if (el.type === "image") return "Image";
  if (el.type === "shape") return "Shape";
  return "Element";
}

function getFontSize(el: any) {
  return finite(el?.meta?.fontSize ?? el?.fontSize, 40);
}

function getFontFamily(el: any) {
  return String(el?.meta?.fontFamily ?? el?.fontFamily ?? "Inter");
}

function getElementWidth(el: any) {
  return finite(el?.width ?? el?.naturalWidth, el?.type === "text" ? 260 : 220);
}

function getElementHeight(el: any) {
  return finite(el?.height ?? el?.naturalHeight, el?.type === "text" ? 80 : 220);
}

function stopEvent(e: React.PointerEvent | React.MouseEvent | React.TouchEvent) {
  e.stopPropagation();
}

function useMobilePanelOpen() {
  const readState = () => typeof document !== "undefined" && document.body.classList.contains("mynify-mobile-panel-open");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const sync = () => setPanelOpen(readState());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("mynify-mobile-panel-open-change", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("mynify-mobile-panel-open-change", sync);
    };
  }, []);

  return panelOpen;
}

function FloatingEditToolbar({
  selectedElements,
  safeArea,
  updateElement,
  deleteElements,
  duplicateElement,
  clearSelection,
}: FloatingEditToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const mobilePanelOpen = useMobilePanelOpen();

  const selected = selectedElements[0] ?? null;
  const selectedIds = useMemo(() => selectedElements.map((item) => item.id).filter(Boolean), [selectedElements]);

  const hasSelection = selectedElements.length > 0;
  const isMulti = selectedElements.length > 1;
  const isText = selected?.type === "text";
  const isImage = selected?.type === "image";
  const meta = selected?.meta ?? {};
  const locked = !!selected?.locked || !!meta.locked || !!meta.lock;
  const rotation = finite(meta.rotation, 0);
  const opacity = clamp(finite(meta.opacity, 1), 0.1, 1);
  const fontSize = getFontSize(selected);
  const fontFamily = getFontFamily(selected);
  const width = getElementWidth(selected);
  const height = getElementHeight(selected);

  useEffect(() => {
    if (isText) loadEditorFont(fontFamily);
  }, [fontFamily, isText]);

  const patchSelected = useCallback(
    (patch: any) => selectedIds.forEach((id) => updateElement(id, patch)),
    [selectedIds, updateElement]
  );

  const mergeMeta = useCallback(
    (patch: any) => {
      selectedIds.forEach((id) => {
        const current = selectedElements.find((item) => item.id === id);
        updateElement(id, { meta: { ...(current?.meta || {}), ...patch } });
      });
    },
    [selectedElements, selectedIds, updateElement]
  );

  const resizePrimary = useCallback(
    (amount: number) => {
      if (!selected || isMulti) return;

      if (isText) {
        updateElement(selected.id, { meta: { ...meta, fontSize: clamp(fontSize + amount, MIN_TEXT_SIZE, MAX_TEXT_SIZE) } });
        return;
      }

      const ratio = height > 0 ? width / height : 1;
      const nextWidth = clamp(width + amount, MIN_ELEMENT_SIZE, MAX_ELEMENT_SIZE);
      updateElement(selected.id, { width: nextWidth, height: Math.round(nextWidth / ratio) });
    },
    [fontSize, height, isMulti, isText, meta, selected, updateElement, width]
  );

  const alignPrimary = useCallback(
    (axis: "x" | "y") => {
      if (!selected || isMulti) return;
      if (axis === "x") updateElement(selected.id, { x: Math.round((finite(safeArea.width, width) - width) / 2) });
      else updateElement(selected.id, { y: Math.round((finite(safeArea.height, height) - height) / 2) });
    },
    [height, isMulti, safeArea.height, safeArea.width, selected, updateElement, width]
  );

  if (mobilePanelOpen) return null;
  if (!hasSelection) return null;

  return (
    <>
      <div
        onPointerDown={stopEvent}
        onMouseDown={stopEvent}
        onTouchStart={stopEvent}
        className="absolute left-1/2 top-3 z-[9999] hidden w-[min(calc(100vw-360px),980px)] -translate-x-1/2 select-none rounded-2xl border border-slate-200 bg-[#070817]/94 px-2.5 py-2 text-slate-950 shadow-[0_18px_70px_rgba(0,0,0,.42)] backdrop-blur-2xl md:block"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-8 min-w-[104px] items-center gap-2 rounded-xl bg-white/[0.045] px-2 ring-1 ring-slate-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/16 text-violet-200">
              {isMulti ? <Copy size={14} /> : isText ? <Type size={14} /> : isImage ? <ImageIcon size={14} /> : <SlidersHorizontal size={14} />}
            </span>
            <span className="truncate text-[11px] font-black text-slate-950/80">{isMulti ? `${selectedElements.length} items` : getElementLabel(selected)}</span>
          </div>

          {isText && !isMulti && (
            <>
              <FontPicker
                value={fontFamily}
                onChange={(family) => {
                  loadEditorFont(family);
                  mergeMeta({ fontFamily: family });
                }}
              />

              <MiniStepper value={`${Math.round(fontSize)}`} decrease={() => resizePrimary(-2)} increase={() => resizePrimary(2)} />

              <select
                value={meta.fontWeight || 700}
                onChange={(e) => mergeMeta({ fontWeight: Number(e.target.value) })}
                className="h-8 w-[72px] rounded-xl border border-slate-200 bg-[#0c0e1d] px-2 text-xs font-bold text-slate-950 outline-none focus:border-violet-300/50"
                title="Font weight"
              >
                {[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>

              <ColorChip value={meta.color || "#ffffff"} onChange={(value) => mergeMeta({ color: value })} title="Text color" />
            </>
          )}

          {!isText && !isMulti && (
            <>
              <MiniStepper value={`${Math.round(width)}px`} decrease={() => resizePrimary(-20)} increase={() => resizePrimary(20)} />
              {!isImage && <ColorChip value={meta.color || meta.fill || "#8b5cf6"} onChange={(value) => mergeMeta({ color: value, fill: value })} title="Fill color" />}
            </>
          )}

          {!isMulti && (
            <div className="flex items-center gap-1 rounded-xl bg-white/[0.035] p-0.5 ring-1 ring-slate-200">
              <IconButton label="Center X" onClick={() => alignPrimary("x")}><AlignCenterHorizontal size={14} /></IconButton>
              <IconButton label="Center Y" onClick={() => alignPrimary("y")}><AlignCenterVertical size={14} /></IconButton>
              <IconButton label="Flip" active={!!meta.flipX} onClick={() => mergeMeta({ flipX: !meta.flipX })}><FlipHorizontal size={14} /></IconButton>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-xl bg-white/[0.035] p-0.5 ring-1 ring-slate-200">
            <IconButton label="Send back" onClick={() => patchSelected({ zAction: "sendBackward" })}><SendToBack size={14} /></IconButton>
            <IconButton label="Bring front" onClick={() => patchSelected({ zAction: "bringForward" })}><BringToFront size={14} /></IconButton>
            <IconButton label="Duplicate" disabled={isMulti} onClick={() => selected?.id && duplicateElement(selected.id)}><Copy size={14} /></IconButton>
            <IconButton label={locked ? "Unlock" : "Lock"} onClick={() => patchSelected({ locked: !locked, meta: { ...meta, locked: !locked, lock: !locked } })}>{locked ? <Unlock size={14} /> : <Lock size={14} />}</IconButton>
          </div>

          <IconButton label="More settings" active={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}><SlidersHorizontal size={14} /></IconButton>
          <IconButton label="Delete" danger onClick={() => deleteElements(selectedIds)}><Trash2 size={14} /></IconButton>
        </div>

        {advancedOpen && !isMulti && (
          <div className="mt-2 grid gap-2 border-t border-slate-200 pt-2 lg:grid-cols-3">
            {isText ? (
              <>
                <Slider label="Letter" value={Number(meta.letterSpacing || 0)} min={-8} max={24} step={1} suffix="px" onChange={(value) => mergeMeta({ letterSpacing: value })} />
                <Slider label="Line" value={Number(meta.lineHeight || 1.16)} min={0.8} max={2.4} step={0.02} onChange={(value) => mergeMeta({ lineHeight: value })} />
                <Slider label="Stroke" value={Number(meta.strokeWidth || 0)} min={0} max={18} step={1} suffix="px" onChange={(value) => mergeMeta({ strokeWidth: value })} />
              </>
            ) : isImage ? (
              <>
                <Slider label="Bright" value={Number(meta.brightness ?? 100)} min={40} max={180} step={1} suffix="%" onChange={(value) => mergeMeta({ brightness: value })} />
                <Slider label="Contrast" value={Number(meta.contrast ?? 100)} min={40} max={180} step={1} suffix="%" onChange={(value) => mergeMeta({ contrast: value })} />
                <Slider label="Saturate" value={Number(meta.saturation ?? 100)} min={0} max={220} step={1} suffix="%" onChange={(value) => mergeMeta({ saturation: value })} />
              </>
            ) : (
              <>
                <ColorRow label="Stroke" value={meta.strokeColor || "#ffffff"} onChange={(value) => mergeMeta({ strokeColor: value, strokeWidth: meta.strokeWidth || 2 })} />
                <Slider label="Stroke" value={Number(meta.strokeWidth || 0)} min={0} max={24} step={1} suffix="px" onChange={(value) => mergeMeta({ strokeWidth: value })} />
                <Slider label="Opacity" value={opacity} min={0.1} max={1} step={0.01} suffix="" onChange={(value) => mergeMeta({ opacity: value })} />
              </>
            )}

            <Slider label="Rotate" value={rotation} min={-180} max={180} step={1} suffix="°" onChange={(value) => mergeMeta({ rotation: value })} />
            <Slider label="Opacity" value={opacity} min={0.1} max={1} step={0.01} suffix="" onChange={(value) => mergeMeta({ opacity: value })} />
            <button type="button" onClick={() => mergeMeta({ rotation: 0, brightness: 100, contrast: 100, saturation: 100 })} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 active:scale-[0.98]">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        )}
      </div>

      <div
        onPointerDown={stopEvent}
        onMouseDown={stopEvent}
        onTouchStart={stopEvent}
        data-mynify-edit-toolbar="true"
        className="mynify-mobile-edit-toolbar fixed inset-x-0 bottom-0 z-[10000] border-t border-slate-200 bg-white text-slate-950 shadow-[0_-2px_8px_rgba(15,23,42,0.06)] md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        <div className="flex h-[48px] items-center gap-1 overflow-x-auto px-1.5">
          <button type="button" onClick={clearSelection} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100" title="Close">
            <X size={17} />
          </button>

          {isText && !isMulti && (
            <>
              <FontPicker
                value={fontFamily}
                mobile
                onChange={(family) => {
                  loadEditorFont(family);
                  mergeMeta({ fontFamily: family });
                }}
              />
              <MobileNumberStepper value={Math.round(fontSize)} decrease={() => resizePrimary(-2)} increase={() => resizePrimary(2)} />
              <ColorChip value={meta.color || "#ffffff"} onChange={(value) => mergeMeta({ color: value })} title="Color" />
            </>
          )}

          {!isText && !isMulti && <MobileNumberStepper value={Math.round(width)} decrease={() => resizePrimary(-20)} increase={() => resizePrimary(20)} />}

          <MobileIconButton label="More" onClick={() => setAdvancedOpen((value) => !value)}><SlidersHorizontal size={18} /></MobileIconButton>
          <MobileIconButton label="Copy" onClick={() => selected?.id && duplicateElement(selected.id)} disabled={isMulti}><Copy size={18} /></MobileIconButton>
          <MobileIconButton label={locked ? "Unlock" : "Lock"} onClick={() => patchSelected({ locked: !locked, meta: { ...meta, locked: !locked, lock: !locked } })}>{locked ? <Unlock size={18} /> : <Lock size={18} />}</MobileIconButton>
          <button type="button" onClick={() => deleteElements(selectedIds)} className="flex h-9 min-w-[42px] shrink-0 flex-col items-center justify-center rounded-lg text-[9px] font-semibold text-red-300 active:bg-red-500/10">
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>

        {advancedOpen && !isMulti && (
          <div className="grid max-h-[28dvh] gap-2 overflow-y-auto border-t border-slate-200 px-2 py-2">
            <Slider label="Rotate" value={rotation} min={-180} max={180} step={1} suffix="°" onChange={(value) => mergeMeta({ rotation: value })} />
            <Slider label="Opacity" value={opacity} min={0.1} max={1} step={0.01} onChange={(value) => mergeMeta({ opacity: value })} />
            {isText && <Slider label="Letter" value={Number(meta.letterSpacing || 0)} min={-8} max={24} step={1} suffix="px" onChange={(value) => mergeMeta({ letterSpacing: value })} />}
          </div>
        )}
      </div>
    </>
  );
}


type FontPickerProps = {
  value: string;
  onChange: (family: string) => void;
  mobile?: boolean;
};

const FontPicker = memo(function FontPicker({ value, onChange, mobile = false }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const fonts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = Array.isArray(FONT_ITEMS) ? FONT_ITEMS : [];
    if (!q) return source.slice(0, 80);
    return source
      .filter((font) => `${font.family} ${font.category} ${font.id}`.toLowerCase().includes(q))
      .slice(0, 80);
  }, [query]);

  const selectFont = useCallback((family: string) => {
    onChange(family);
    setOpen(false);
    setQuery("");
  }, [onChange]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className={mobile
          ? "flex h-8 min-w-[132px] max-w-[150px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 text-left text-[11px] font-bold text-slate-900 outline-none active:scale-[0.98]"
          : "flex h-8 w-[170px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#0c0e1d] px-2 text-left text-xs font-bold text-slate-950 outline-none hover:border-violet-300/35"}
        title="Font family"
      >
        <span className="truncate">{value || "Inter"}</span>
        <span className="text-[10px] text-violet-200">Fonts</span>
      </button>

      {open && (
        <div
          onPointerDown={stopEvent}
          onMouseDown={stopEvent}
          className={mobile
            ? "fixed inset-x-2 bottom-[54px] z-[10030] max-h-[34dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_-18px_70px_rgba(0,0,0,.48)] backdrop-blur-2xl"
            : "absolute left-0 top-10 z-[10030] w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_70px_rgba(0,0,0,.48)] backdrop-blur-2xl"}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search same fonts as Text panel..."
            className="mb-2 h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-950 outline-none placeholder:text-slate-950/35 focus:border-violet-300/50"
          />
          <div className="max-h-[300px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {fonts.map((font) => {
              const active = font.family === value;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => selectFont(font.family)}
                  className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl px-2 text-left text-xs font-bold transition ${active ? "bg-violet-500 text-slate-950" : "text-slate-700 hover:bg-white/[0.075]"}`}
                >
                  <span className="truncate">{font.family}</span>
                  <span className="shrink-0 text-[10px] capitalize text-slate-950/40">{font.category}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 border-t border-slate-200 pt-2 text-center text-[10px] font-bold text-slate-950/35">
            Showing {fonts.length} from {FONT_ITEMS.length} fonts. Search to find any font.
          </div>
        </div>
      )}
    </div>
  );
});

function MiniStepper({ value, decrease, increase }: { value: string; decrease: () => void; increase: () => void }) {
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-xl border border-slate-200 bg-[#0c0e1d]">
      <button type="button" onClick={decrease} className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-white/10"><Minus size={13} /></button>
      <div className="min-w-12 px-2 text-center text-xs font-black text-slate-950/82">{value}</div>
      <button type="button" onClick={increase} className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-white/10"><Plus size={13} /></button>
    </div>
  );
}

function ColorChip({ value, onChange, title }: { value: string; onChange: (value: string) => void; title: string }) {
  return (
    <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50" title={title}>
      <span className="h-4 w-4 rounded-md border border-white/20" style={{ background: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex h-10 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/[0.04] px-3">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-950/45">{label}</span>
      <ColorChip value={value} onChange={onChange} title={label} />
    </div>
  );
}

function Slider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  const display = suffix === "" && max === 1 ? `${Math.round(value * 100)}%` : `${Number(value).toFixed(step < 1 ? 2 : 0)}${suffix}`;
  return (
    <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-white/[0.04] px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-950/42">{label}</span>
        <span className="text-[11px] font-black text-slate-950/76">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-violet-400" />
    </div>
  );
}

function MobileNumberStepper({ value, decrease, increase }: { value: number; decrease: () => void; increase: () => void }) {
  return (
    <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <button type="button" onClick={decrease} className="flex h-full w-7 items-center justify-center active:bg-white/10"><Minus size={15} /></button>
      <div className="min-w-12 px-2 text-center text-xs font-black text-slate-950">{value}</div>
      <button type="button" onClick={increase} className="flex h-full w-7 items-center justify-center active:bg-white/10"><Plus size={15} /></button>
    </div>
  );
}

function MobileIconButton({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex h-9 min-w-[42px] shrink-0 flex-col items-center justify-center rounded-lg text-[9px] font-semibold text-slate-950/80 active:bg-white/10 disabled:opacity-35">
      {children}
      <span>{label}</span>
    </button>
  );
}

function IconButton({ children, label, active, danger, disabled, onClick }: { children: React.ReactNode; label: string; active?: boolean; danger?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 min-w-8 items-center justify-center rounded-xl border px-2 text-xs font-black transition active:scale-[0.97] disabled:opacity-35 ${
        danger
          ? "border-rose-400/25 bg-rose-500/12 text-rose-200 hover:bg-rose-500/18"
          : active
          ? "border-violet-300/40 bg-violet-500/20 text-violet-100"
          : "border-slate-200 bg-slate-50 text-slate-950/76 hover:bg-white/[0.1]"
      }`}
    >
      {children}
    </button>
  );
}

export default memo(FloatingEditToolbar);
