"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  BringToFront,
  Copy,
  FlipHorizontal,
  GripVertical,
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
import { loadEditorFont } from "../data";
import FloatingFontPicker from "./FloatingFontPicker";
import {
  MAX_ELEMENT_SIZE,
  MAX_TEXT_SIZE,
  MIN_ELEMENT_SIZE,
  MIN_TEXT_SIZE,
  clamp,
  finite,
  getElementHeight,
  getElementLabel,
  getElementWidth,
  getFontFamily,
  getFontSize,
  getInitialToolbarPosition,
  readSavedToolbarPosition,
  saveToolbarPosition,
  clearSavedToolbarPosition,
  stopEvent,
  type FloatingPoint,
} from "./floating-toolbar-utils";

type FloatingEditToolbarProps = {
  selectedElements: any[];
  safeArea: { width: number; height: number };
  updateElement: (id: string, patch: any) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  clearSelection?: () => void;
};

function FloatingEditToolbar({
  selectedElements,
  safeArea,
  updateElement,
  deleteElements,
  duplicateElement,
  clearSelection,
}: FloatingEditToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [desktopPosition, setDesktopPosition] = useState<FloatingPoint | null>(() =>
    readSavedToolbarPosition(),
  );
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const userMovedToolbarRef = useRef(false);

  const selected = selectedElements[0] ?? null;
  const selectedIds = useMemo(
    () => selectedElements.map((item) => item.id).filter(Boolean),
    [selectedElements],
  );

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
    if (!selected?.id) return;

    const savedPosition = readSavedToolbarPosition();
    if (savedPosition) {
      userMovedToolbarRef.current = true;
      setDesktopPosition(savedPosition);
      return;
    }

    if (userMovedToolbarRef.current || desktopPosition) return;
    setDesktopPosition(getInitialToolbarPosition(selected, safeArea));
  }, [desktopPosition, selected, selected?.id, safeArea]);

  useEffect(() => {
    if (isText) loadEditorFont(fontFamily);
  }, [fontFamily, isText]);

  const patchSelected = useCallback(
    (patch: any) => selectedIds.forEach((id) => updateElement(id, patch)),
    [selectedIds, updateElement],
  );

  const mergeMeta = useCallback(
    (patch: any) => {
      selectedIds.forEach((id) => {
        const current = selectedElements.find((item) => item.id === id);
        updateElement(id, { meta: { ...(current?.meta || {}), ...patch } });
      });
    },
    [selectedElements, selectedIds, updateElement],
  );

  const setFontFamily = useCallback(
    (family: string) => {
      selectedIds.forEach((id) => {
        const current = selectedElements.find((item) => item.id === id);
        updateElement(id, {
          fontFamily: family,
          meta: { ...(current?.meta || {}), fontFamily: family },
        });
      });
    },
    [selectedElements, selectedIds, updateElement],
  );

  const resizePrimary = useCallback(
    (amount: number) => {
      if (!selected || isMulti) return;

      if (isText) {
        updateElement(selected.id, {
          fontSize: clamp(fontSize + amount, MIN_TEXT_SIZE, MAX_TEXT_SIZE),
          meta: {
            ...meta,
            fontSize: clamp(fontSize + amount, MIN_TEXT_SIZE, MAX_TEXT_SIZE),
          },
        });
        return;
      }

      const ratio = height > 0 ? width / height : 1;
      const nextWidth = clamp(
        width + amount,
        MIN_ELEMENT_SIZE,
        MAX_ELEMENT_SIZE,
      );
      updateElement(selected.id, {
        width: nextWidth,
        height: Math.round(nextWidth / ratio),
      });
    },
    [fontSize, height, isMulti, isText, meta, selected, updateElement, width],
  );

  const alignPrimary = useCallback(
    (axis: "x" | "y") => {
      if (!selected || isMulti) return;
      if (axis === "x")
        updateElement(selected.id, {
          x: Math.round((finite(safeArea.width, width) - width) / 2),
        });
      else
        updateElement(selected.id, {
          y: Math.round((finite(safeArea.height, height) - height) / 2),
        });
    },
    [
      height,
      isMulti,
      safeArea.height,
      safeArea.width,
      selected,
      updateElement,
      width,
    ],
  );

  const getToolbarBounds = useCallback(() => {
    const toolbar = toolbarRef.current;
    const parent = toolbar?.parentElement;
    const parentWidth =
      parent?.clientWidth ||
      Math.max(
        720,
        typeof window !== "undefined"
          ? window.innerWidth
          : finite(safeArea.width, 980),
      );
    const parentHeight =
      parent?.clientHeight ||
      Math.max(
        520,
        typeof window !== "undefined"
          ? window.innerHeight
          : finite(safeArea.height, 720),
      );
    const toolbarWidth = toolbar?.offsetWidth || 360;
    const toolbarHeight = toolbar?.offsetHeight || 680;

    return {
      minX: 10,
      minY: 10,
      maxX: Math.max(10, parentWidth - toolbarWidth - 10),
      maxY: Math.max(10, parentHeight - toolbarHeight - 10),
    };
  }, [safeArea.height, safeArea.width]);

  const startToolbarDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!desktopPosition) return;
      stopEvent(event);
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: desktopPosition.x,
        originY: desktopPosition.y,
      };
    },
    [desktopPosition],
  );

  const moveToolbar = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      stopEvent(event);

      const bounds = getToolbarBounds();
      const nextPosition = {
        x: clamp(
          drag.originX + event.clientX - drag.startX,
          bounds.minX,
          bounds.maxX,
        ),
        y: clamp(
          drag.originY + event.clientY - drag.startY,
          bounds.minY,
          bounds.maxY,
        ),
      };

      userMovedToolbarRef.current = true;
      setDesktopPosition(nextPosition);
      saveToolbarPosition(nextPosition);
    },
    [getToolbarBounds],
  );

  const endToolbarDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      stopEvent(event);
      dragRef.current = null;
    },
    [],
  );

  if (!hasSelection) return null;

  return (
    <>
      <div
        ref={toolbarRef}
        onPointerDown={stopEvent}
        onMouseDown={stopEvent}
        onTouchStart={stopEvent}
        className={`absolute z-[9999] hidden w-[360px] select-none rounded-[28px] border border-white/10 bg-[#070817]/96 p-3 text-white shadow-[0_24px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl md:block ${
          desktopPosition ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          left: desktopPosition?.x ?? -9999,
          top: desktopPosition?.y ?? -9999,
        }}
      >
        <div
          onPointerDown={startToolbarDrag}
          onPointerMove={moveToolbar}
          onPointerUp={endToolbarDrag}
          onPointerCancel={endToolbarDrag}
          onDoubleClick={() => {
            userMovedToolbarRef.current = false;
            clearSavedToolbarPosition();
            selected &&
              setDesktopPosition(getInitialToolbarPosition(selected, safeArea));
          }}
          className="mb-2.5 flex cursor-grab items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.06] p-2 active:cursor-grabbing active:bg-white/[0.08]"
          title="Drag this cube anywhere on the canvas. Double click to reset near the selected element."
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-100 ring-1 ring-violet-300/15">
            {isMulti ? (
              <Copy size={18} />
            ) : isText ? (
              <Type size={18} />
            ) : isImage ? (
              <ImageIcon size={18} />
            ) : (
              <SlidersHorizontal size={18} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black text-white/92">
              {isMulti
                ? `${selectedElements.length} items`
                : getElementLabel(selected)}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
              Drag cube
            </div>
          </div>
          <GripVertical size={18} className="shrink-0 text-white/42" />
        </div>

        <div className="grid gap-2">
          {isText && !isMulti && (
            <div className="grid gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
              <FloatingFontPicker
                value={fontFamily}
                onChange={(family) => {
                  loadEditorFont(family);
                  setFontFamily(family);
                }}
              />

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <MiniStepper
                  value={`${Math.round(fontSize)}`}
                  decrease={() => resizePrimary(-2)}
                  increase={() => resizePrimary(2)}
                />
                <ColorChip
                  value={meta.color || "#ffffff"}
                  onChange={(value) => mergeMeta({ color: value })}
                  title="Text color"
                />
              </div>

              <select
                value={meta.fontWeight || 700}
                onChange={(e) =>
                  mergeMeta({ fontWeight: Number(e.target.value) })
                }
                className="h-10 w-full rounded-2xl border border-white/10 bg-[#0c0e1d] px-3 text-sm font-black text-white outline-none focus:border-violet-300/50"
                title="Font weight"
              >
                {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isText && !isMulti && (
            <div className="grid gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
              <MiniStepper
                value={`${Math.round(width)}px`}
                decrease={() => resizePrimary(-20)}
                increase={() => resizePrimary(20)}
              />
              {!isImage && (
                <ColorChip
                  value={meta.color || meta.fill || "#8b5cf6"}
                  onChange={(value) => mergeMeta({ color: value, fill: value })}
                  title="Fill color"
                />
              )}
            </div>
          )}

          {!isMulti && (
            <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
              <IconButton label="Center X" onClick={() => alignPrimary("x")}>
                <AlignCenterHorizontal size={16} />
              </IconButton>
              <IconButton label="Center Y" onClick={() => alignPrimary("y")}>
                <AlignCenterVertical size={16} />
              </IconButton>
              <IconButton
                label="Flip"
                active={!!meta.flipX}
                onClick={() => mergeMeta({ flipX: !meta.flipX })}
              >
                <FlipHorizontal size={16} />
              </IconButton>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
            <IconButton
              label="Send back"
              onClick={() => patchSelected({ zAction: "sendBackward" })}
            >
              <SendToBack size={16} />
            </IconButton>
            <IconButton
              label="Bring front"
              onClick={() => patchSelected({ zAction: "bringForward" })}
            >
              <BringToFront size={16} />
            </IconButton>
            <IconButton
              label="Duplicate"
              disabled={isMulti}
              onClick={() => selected?.id && duplicateElement(selected.id)}
            >
              <Copy size={16} />
            </IconButton>
            <IconButton
              label={locked ? "Unlock" : "Lock"}
              onClick={() =>
                patchSelected({
                  locked: !locked,
                  meta: { ...meta, locked: !locked, lock: !locked },
                })
              }
            >
              {locked ? <Unlock size={16} /> : <Lock size={16} />}
            </IconButton>
            <IconButton
              label="More"
              active={advancedOpen}
              onClick={() => setAdvancedOpen((value) => !value)}
            >
              <SlidersHorizontal size={16} />
            </IconButton>
            <IconButton
              label="Delete"
              danger
              onClick={() => deleteElements(selectedIds)}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        </div>

        {advancedOpen && !isMulti && (
          <div className="mt-3 grid max-h-[330px] gap-2 overflow-y-auto rounded-[22px] border border-white/10 bg-white/[0.03] p-2 [scrollbar-width:thin]">
            {isText ? (
              <>
                <Slider
                  label="Letter"
                  value={Number(meta.letterSpacing || 0)}
                  min={-8}
                  max={24}
                  step={1}
                  suffix="px"
                  onChange={(value) => mergeMeta({ letterSpacing: value })}
                />
                <Slider
                  label="Line"
                  value={Number(meta.lineHeight || 1.16)}
                  min={0.8}
                  max={2.4}
                  step={0.02}
                  onChange={(value) => mergeMeta({ lineHeight: value })}
                />
                <Slider
                  label="Stroke"
                  value={Number(meta.strokeWidth || 0)}
                  min={0}
                  max={18}
                  step={1}
                  suffix="px"
                  onChange={(value) => mergeMeta({ strokeWidth: value })}
                />
              </>
            ) : isImage ? (
              <>
                <Slider
                  label="Bright"
                  value={Number(meta.brightness ?? 100)}
                  min={40}
                  max={180}
                  step={1}
                  suffix="%"
                  onChange={(value) => mergeMeta({ brightness: value })}
                />
                <Slider
                  label="Contrast"
                  value={Number(meta.contrast ?? 100)}
                  min={40}
                  max={180}
                  step={1}
                  suffix="%"
                  onChange={(value) => mergeMeta({ contrast: value })}
                />
                <Slider
                  label="Saturate"
                  value={Number(meta.saturation ?? 100)}
                  min={0}
                  max={220}
                  step={1}
                  suffix="%"
                  onChange={(value) => mergeMeta({ saturation: value })}
                />
              </>
            ) : (
              <>
                <ColorRow
                  label="Stroke"
                  value={meta.strokeColor || "#ffffff"}
                  onChange={(value) =>
                    mergeMeta({
                      strokeColor: value,
                      strokeWidth: meta.strokeWidth || 2,
                    })
                  }
                />
                <Slider
                  label="Stroke"
                  value={Number(meta.strokeWidth || 0)}
                  min={0}
                  max={24}
                  step={1}
                  suffix="px"
                  onChange={(value) => mergeMeta({ strokeWidth: value })}
                />
              </>
            )}

            <Slider
              label="Rotate"
              value={rotation}
              min={-180}
              max={180}
              step={1}
              suffix="°"
              onChange={(value) => mergeMeta({ rotation: value })}
            />
            <Slider
              label="Opacity"
              value={opacity}
              min={0.1}
              max={1}
              step={0.01}
              suffix=""
              onChange={(value) => mergeMeta({ opacity: value })}
            />
            <button
              type="button"
              onClick={() =>
                mergeMeta({
                  rotation: 0,
                  brightness: 100,
                  contrast: 100,
                  saturation: 100,
                })
              }
              className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] text-xs font-black text-white/78 active:scale-[0.98]"
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        )}
      </div>

      <div
        onPointerDown={stopEvent}
        onMouseDown={stopEvent}
        onTouchStart={stopEvent}
        className="fixed inset-x-0 bottom-0 z-[10000] border-t border-violet-300/15 bg-[#070817]/97 text-white shadow-[0_-18px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        <div className="flex h-[66px] items-center gap-2 overflow-x-auto px-2">
          <button
            type="button"
            onClick={clearSelection}
            className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl text-white/70 active:bg-white/10"
            title="Close"
          >
            <X size={22} />
          </button>

          {isText && !isMulti && (
            <>
              <FloatingFontPicker
                value={fontFamily}
                mobile
                onChange={(family) => {
                  loadEditorFont(family);
                  setFontFamily(family);
                }}
              />
              <MobileNumberStepper
                value={Math.round(fontSize)}
                decrease={() => resizePrimary(-2)}
                increase={() => resizePrimary(2)}
              />
              <ColorChip
                value={meta.color || "#ffffff"}
                onChange={(value) => mergeMeta({ color: value })}
                title="Color"
              />
            </>
          )}

          {!isText && !isMulti && (
            <MobileNumberStepper
              value={Math.round(width)}
              decrease={() => resizePrimary(-20)}
              increase={() => resizePrimary(20)}
            />
          )}

          <MobileIconButton
            label="More"
            onClick={() => setAdvancedOpen((value) => !value)}
          >
            <SlidersHorizontal size={18} />
          </MobileIconButton>
          <MobileIconButton
            label="Copy"
            onClick={() => selected?.id && duplicateElement(selected.id)}
            disabled={isMulti}
          >
            <Copy size={18} />
          </MobileIconButton>
          <MobileIconButton
            label={locked ? "Unlock" : "Lock"}
            onClick={() =>
              patchSelected({
                locked: !locked,
                meta: { ...meta, locked: !locked, lock: !locked },
              })
            }
          >
            {locked ? <Unlock size={18} /> : <Lock size={18} />}
          </MobileIconButton>
          <button
            type="button"
            onClick={() => deleteElements(selectedIds)}
            className="flex h-12 min-w-[54px] shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-red-300 active:bg-red-500/10"
          >
            <Trash2 size={19} />
            <span>Delete</span>
          </button>
        </div>

        {advancedOpen && !isMulti && (
          <div className="grid max-h-[42dvh] gap-3 overflow-y-auto border-t border-white/10 px-3 py-3">
            <Slider
              label="Rotate"
              value={rotation}
              min={-180}
              max={180}
              step={1}
              suffix="°"
              onChange={(value) => mergeMeta({ rotation: value })}
            />
            <Slider
              label="Opacity"
              value={opacity}
              min={0.1}
              max={1}
              step={0.01}
              onChange={(value) => mergeMeta({ opacity: value })}
            />
            {isText && (
              <Slider
                label="Letter"
                value={Number(meta.letterSpacing || 0)}
                min={-8}
                max={24}
                step={1}
                suffix="px"
                onChange={(value) => mergeMeta({ letterSpacing: value })}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MiniStepper({
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

function ColorChip({
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
    [onChange]
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

function ColorRow({
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

function Slider({
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

function MobileNumberStepper({
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

function MobileIconButton({
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

function IconButton({
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

export default memo(FloatingEditToolbar);
