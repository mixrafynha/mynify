"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Monitor,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  Undo2,
  Redo2,
  RotateCcw,
  X,
  Check,
} from "lucide-react";

interface TopBarProps {
  productId?: string;
  side: "front" | "back";
  setSide: (side: "front" | "back") => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onSaveDesign: () => Promise<void> | void;
  onPreviewDesign: () => Promise<void> | void;
  onUndo?: () => void;
  onRedo?: () => void;
  saving?: boolean;

  elements: any[];
  mockupColor?: string;
}

export default function TopBar({
  productId,
  side,
  setSide,
  zoomIn,
  zoomOut,
  zoom = 100,
  onZoomChange,
  onSaveDesign,
  onPreviewDesign,
  onUndo,
  onRedo,
  saving = false,
  elements,
  mockupColor = "#ffffff",
}: TopBarProps) {
  const [confirmSave, setConfirmSave] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [localZoom, setLocalZoom] = useState(zoom);
  const lastSliderZoomRef = useRef(zoom);

  const isBusy = saving || previewing;
  const nextSide = side === "front" ? "back" : "front";

  const btn =
    "group flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.045] text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition duration-150 hover:border-white/15 hover:bg-white/[0.085] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35 sm:h-9 sm:w-9";

  const active =
    "border-violet-300/25 bg-gradient-to-b from-violet-500/18 to-fuchsia-500/12 text-violet-100 shadow-[0_0_22px_rgba(168,85,247,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]";

  const iconSize = 16;

  const previewData = useMemo(
    () => ({
      productId,
      side,
      elements,
      mockupColor,
      generateMockupAI: true,
      updatedAt: Date.now(),
    }),
    [productId, side, elements, mockupColor],
  );

  useEffect(() => {
    const nextZoom = Math.min(200, Math.max(25, Math.round(zoom)));
    setLocalZoom(nextZoom);
    lastSliderZoomRef.current = nextZoom;
  }, [zoom]);

  const safeZoom = Math.min(200, Math.max(25, Math.round(localZoom)));

  const handleZoomSlider = useCallback(
    (value: number) => {
      const nextZoom = Math.min(200, Math.max(25, Math.round(value)));
      const previousZoom = lastSliderZoomRef.current;

      setLocalZoom(nextZoom);
      lastSliderZoomRef.current = nextZoom;

      if (onZoomChange) {
        onZoomChange(nextZoom);
        return;
      }

      // Fallback para projetos que ainda só têm zoomIn/zoomOut.
      // Assim a barra não fica bloqueada mesmo sem onZoomChange.
      if (nextZoom > previousZoom) zoomIn();
      if (nextZoom < previousZoom) zoomOut();
    },
    [onZoomChange, zoomIn, zoomOut],
  );

  const handleConfirmSave = useCallback(async () => {
    if (saving) return;

    try {
      setConfirmSave(false);
      await onSaveDesign();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving design.");
    }
  }, [onSaveDesign, saving]);

  const handlePreview = useCallback(async () => {
    if (isBusy) return;

    try {
      setPreviewing(true);

      if (typeof window !== "undefined" && productId) {
        const payload = JSON.stringify(previewData);
        const key = `mynify-editor-preview-${productId}`;

        localStorage.setItem(key, payload);
        sessionStorage.setItem(key, payload);
      }

      await onPreviewDesign();
    } catch (err) {
      console.error("Preview failed:", err);
      alert("Error opening preview.");
      setPreviewing(false);
    }
  }, [isBusy, onPreviewDesign, previewData, productId]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#05050d]/88 text-white shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#05050d]/72">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/45 to-transparent" />

        <div className="mx-auto flex h-[52px] w-full max-w-[1800px] items-center justify-between gap-2 px-2.5 sm:h-14 sm:px-4 lg:px-5">
          <button
            type="button"
            onClick={() => setSide(nextSide)}
            disabled={isBusy}
            className="flex min-w-0 shrink-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] py-1.5 pl-2 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/[0.07] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            title={side === "front" ? "Switch to back" : "Switch to front"}
            aria-label={side === "front" ? "Switch to back" : "Switch to front"}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/22 to-fuchsia-500/16 text-violet-100 shadow-[0_0_18px_rgba(168,85,247,0.18)]">
              {side === "front" ? <Monitor size={15} /> : <Layers size={15} />}
            </span>

            <h1
              className="select-none whitespace-nowrap text-[21px] font-black uppercase leading-none tracking-[-0.045em] text-white sm:text-[25px] md:text-[30px]"
              style={{ fontFamily: "Sibarico, var(--font-sibarico), ui-serif, Georgia, serif" }}
            >
              <span>MY</span>
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
                NIFY
              </span>
            </h1>
          </button>

          <div className="mx-1 flex min-w-0 flex-1 items-center justify-center">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/18 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
              <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.035] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] lg:flex">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={isBusy}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/62 transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>

                <div className="flex w-[210px] items-center gap-2">
                  <input
                    type="range"
                    min={25}
                    max={200}
                    step={5}
                    value={safeZoom}
                    disabled={isBusy}
                    onChange={(event) => handleZoomSlider(Number(event.target.value))}
                    aria-label="Canvas zoom"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-violet-400 disabled:cursor-not-allowed disabled:opacity-45 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/30 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/30 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_18px_rgba(168,85,247,0.42)]"
                  />

                  <span className="w-10 text-right text-[11px] font-black tabular-nums text-white/62">
                    {safeZoom}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={isBusy}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/62 transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={zoomOut}
                disabled={isBusy}
                className={`${btn} lg:hidden`}
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut size={iconSize} />
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={isBusy}
                className={`${btn} lg:hidden`}
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn size={iconSize} />
              </button>

              <button
                type="button"
                onClick={onUndo}
                disabled={!onUndo || isBusy}
                className={btn}
                title="Undo"
                aria-label="Undo"
              >
                <Undo2 size={iconSize} />
              </button>

              <button
                type="button"
                onClick={onRedo}
                disabled={!onRedo || isBusy}
                className={btn}
                title="Redo"
                aria-label="Redo"
              >
                <Redo2 size={iconSize} />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isBusy}
              className={`${btn} hidden sm:flex`}
              title="Preview"
              aria-label="Preview"
            >
              {previewing ? (
                <RotateCcw size={iconSize} className="animate-spin" />
              ) : (
                <Eye size={iconSize} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setConfirmSave(true)}
              disabled={isBusy}
              className="relative flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-2.5 text-white shadow-[0_10px_28px_rgba(168,85,247,0.26)] transition duration-150 hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:px-3.5"
              title="Save"
              aria-label="Save"
            >
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] opacity-40" />

              {saving ? (
                <RotateCcw size={15} className="relative animate-spin" />
              ) : (
                <Save size={15} className="relative" />
              )}

              <span className="relative hidden text-[12px] font-black tracking-[-0.02em] sm:block">
                {saving ? "Saving" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {confirmSave && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[#090914]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.62)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/45 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/18 blur-3xl" />

            <h2 className="relative text-xl font-black tracking-[-0.04em] text-white">
              Save design?
            </h2>

            <p className="relative mt-2 text-sm leading-relaxed text-white/58">
              Do you want to save this design and update the product preview?
            </p>

            <div className="relative mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSave(false)}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/72 transition hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-40"
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(168,85,247,0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                {saving ? (
                  <RotateCcw size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
