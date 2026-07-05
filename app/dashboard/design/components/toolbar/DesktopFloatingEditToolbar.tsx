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
  RotateCcw,
  SendToBack,
  SlidersHorizontal,
  Trash2,
  Type,
  Unlock,
} from "lucide-react";
import { loadEditorFont } from "./data";
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
import {
  ColorChip,
  ColorRow,
  IconButton,
  MiniStepper,
  Slider,
  type FloatingEditToolbarProps,
} from "./FloatingEditToolbarShared";

function DesktopFloatingEditToolbar({
  selectedElements,
  safeArea,
  updateElement,
  deleteElements,
  duplicateElement,
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
        const nextFontSize = clamp(fontSize + amount, MIN_TEXT_SIZE, MAX_TEXT_SIZE);
        updateElement(selected.id, {
          fontSize: nextFontSize,
          meta: { ...meta, fontSize: nextFontSize },
        });
        return;
      }

      const ratio = height > 0 ? width / height : 1;
      const nextWidth = clamp(width + amount, MIN_ELEMENT_SIZE, MAX_ELEMENT_SIZE);
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
      if (axis === "x") {
        updateElement(selected.id, {
          x: Math.round((finite(safeArea.width, width) - width) / 2),
        });
        return;
      }

      updateElement(selected.id, {
        y: Math.round((finite(safeArea.height, height) - height) / 2),
      });
    },
    [height, isMulti, safeArea.height, safeArea.width, selected, updateElement, width],
  );

  const getToolbarBounds = useCallback(() => {
    const toolbar = toolbarRef.current;
    const parent = toolbar?.parentElement;
    const parentWidth =
      parent?.clientWidth ||
      Math.max(
        720,
        typeof window !== "undefined" ? window.innerWidth : finite(safeArea.width, 980),
      );
    const parentHeight =
      parent?.clientHeight ||
      Math.max(
        520,
        typeof window !== "undefined" ? window.innerHeight : finite(safeArea.height, 720),
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
        x: clamp(drag.originX + event.clientX - drag.startX, bounds.minX, bounds.maxX),
        y: clamp(drag.originY + event.clientY - drag.startY, bounds.minY, bounds.maxY),
      };

      userMovedToolbarRef.current = true;
      setDesktopPosition(nextPosition);
      saveToolbarPosition(nextPosition);
    },
    [getToolbarBounds],
  );

  const endToolbarDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    stopEvent(event);
    dragRef.current = null;
  }, []);

  if (!hasSelection) return null;

  return (
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
          selected && setDesktopPosition(getInitialToolbarPosition(selected, safeArea));
        }}
        className="mb-2.5 flex cursor-grab items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.06] p-2 active:cursor-grabbing active:bg-white/[0.08]"
        title="Drag this cube anywhere on the canvas. Double click to reset near the selected element."
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-100 ring-1 ring-violet-300/15">
          {isMulti ? <Copy size={18} /> : isText ? <Type size={18} /> : isImage ? <ImageIcon size={18} /> : <SlidersHorizontal size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-white/92">
            {isMulti ? `${selectedElements.length} items` : getElementLabel(selected)}
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
              <MiniStepper value={`${Math.round(fontSize)}`} decrease={() => resizePrimary(-2)} increase={() => resizePrimary(2)} />
              <ColorChip value={meta.color || "#ffffff"} onChange={(value) => mergeMeta({ color: value })} title="Text color" />
            </div>

            <select
              value={meta.fontWeight || 700}
              onChange={(e) => mergeMeta({ fontWeight: Number(e.target.value) })}
              className="h-10 w-full rounded-2xl border border-white/10 bg-[#0c0e1d] px-3 text-sm font-black text-white outline-none focus:border-violet-300/50"
              title="Font weight"
            >
              {[300, 400, 500, 600, 700, 800, 900].map((weight) => (
                <option key={weight} value={weight}>{weight}</option>
              ))}
            </select>
          </div>
        )}

        {!isText && !isMulti && (
          <div className="grid gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
            <MiniStepper value={`${Math.round(width)}px`} decrease={() => resizePrimary(-20)} increase={() => resizePrimary(20)} />
            {!isImage && (
              <ColorChip value={meta.color || meta.fill || "#8b5cf6"} onChange={(value) => mergeMeta({ color: value, fill: value })} title="Fill color" />
            )}
          </div>
        )}

        {!isMulti && (
          <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
            <IconButton label="Center X" onClick={() => alignPrimary("x")}><AlignCenterHorizontal size={16} /></IconButton>
            <IconButton label="Center Y" onClick={() => alignPrimary("y")}><AlignCenterVertical size={16} /></IconButton>
            <IconButton label="Flip" active={!!meta.flipX} onClick={() => mergeMeta({ flipX: !meta.flipX })}><FlipHorizontal size={16} /></IconButton>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-white/[0.035] p-2 ring-1 ring-white/10">
          <IconButton label="Send back" onClick={() => patchSelected({ zAction: "sendBackward" })}><SendToBack size={16} /></IconButton>
          <IconButton label="Bring front" onClick={() => patchSelected({ zAction: "bringForward" })}><BringToFront size={16} /></IconButton>
          <IconButton label="Duplicate" disabled={isMulti} onClick={() => selected?.id && duplicateElement(selected.id)}><Copy size={16} /></IconButton>
          <IconButton label={locked ? "Unlock" : "Lock"} onClick={() => patchSelected({ locked: !locked, meta: { ...meta, locked: !locked, lock: !locked } })}>{locked ? <Unlock size={16} /> : <Lock size={16} />}</IconButton>
          <IconButton label="More" active={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}><SlidersHorizontal size={16} /></IconButton>
          <IconButton label="Delete" danger onClick={() => deleteElements(selectedIds)}><Trash2 size={16} /></IconButton>
        </div>
      </div>

      {advancedOpen && !isMulti && (
        <div className="mt-3 grid max-h-[330px] gap-2 overflow-y-auto rounded-[22px] border border-white/10 bg-white/[0.03] p-2 [scrollbar-width:thin]">
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
            </>
          )}

          <Slider label="Rotate" value={rotation} min={-180} max={180} step={1} suffix="°" onChange={(value) => mergeMeta({ rotation: value })} />
          <Slider label="Opacity" value={opacity} min={0.1} max={1} step={0.01} suffix="" onChange={(value) => mergeMeta({ opacity: value })} />
          <button
            type="button"
            onClick={() => mergeMeta({ rotation: 0, brightness: 100, contrast: 100, saturation: 100 })}
            className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] text-xs font-black text-white/78 active:scale-[0.98]"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(DesktopFloatingEditToolbar);
