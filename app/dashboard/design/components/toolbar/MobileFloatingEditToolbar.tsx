"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Layers, Lock, SlidersHorizontal, Trash2, Unlock, X } from "lucide-react";
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
  getElementWidth,
  getFontFamily,
  getFontSize,
  stopEvent,
} from "./floating-toolbar-utils";
import {
  ColorChip,
  MobileIconButton,
  MobileNumberStepper,
  Slider,
  type FloatingEditToolbarProps,
} from "./FloatingEditToolbarShared";

function MobileFloatingEditToolbar({
  selectedElements,
  updateElement,
  deleteElements,
  duplicateElement,
  clearSelection,
}: FloatingEditToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selected = selectedElements[0] ?? null;
  const selectedIds = useMemo(
    () => selectedElements.map((item) => item.id).filter(Boolean),
    [selectedElements],
  );

  const hasSelection = selectedElements.length > 0;
  const isMulti = selectedElements.length > 1;
  const isText = selected?.type === "text";
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

  if (!hasSelection) return null;

  return (
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

        <MobileIconButton label="More" onClick={() => setAdvancedOpen((value) => !value)}>
          <SlidersHorizontal size={18} />
        </MobileIconButton>
        <MobileIconButton
          label="Layers"
          onClick={() => window.dispatchEvent(new Event("ryfio:open-mobile-layers"))}
        >
          <Layers size={18} />
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
          onClick={() => patchSelected({ locked: !locked, meta: { ...meta, locked: !locked, lock: !locked } })}
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
          <Slider label="Rotate" value={rotation} min={-180} max={180} step={1} suffix="°" onChange={(value) => mergeMeta({ rotation: value })} />
          <Slider label="Opacity" value={opacity} min={0.1} max={1} step={0.01} onChange={(value) => mergeMeta({ opacity: value })} />
          {isText && (
            <Slider label="Letter" value={Number(meta.letterSpacing || 0)} min={-8} max={24} step={1} suffix="px" onChange={(value) => mergeMeta({ letterSpacing: value })} />
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MobileFloatingEditToolbar);
