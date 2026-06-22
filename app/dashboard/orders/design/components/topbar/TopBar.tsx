"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ArrowLeft, Eye, Save, Undo2, Redo2 } from "lucide-react";
import BrandSection from "./components/BrandSection";
import HistorySection from "./components/HistorySection";
import PreviewButton from "./components/PreviewButton";
import SaveButton from "./components/SaveButton";
import SaveConfirmModal from "./components/SaveConfirmModal";
import SideSwitcher from "./components/SideSwitcher";
import ZoomSection from "./components/ZoomSection";
import { storePreviewPayload } from "./services/previewStorage";
import { useTopBarZoom } from "./hooks/useTopBarZoom";
import type { PreviewPayloadInput, TopBarProps } from "./types";

function TopBar({
  productId,
  category,
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
  onRevert,
  canUndo,
  canRedo,
  saving = false,
  elements,
  frontElements,
  backElements,
  mockupColor = "#ffffff",
}: TopBarProps) {
  const [confirmSave, setConfirmSave] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const { zoom: safeZoom, setZoom } = useTopBarZoom({ zoom, zoomIn, zoomOut, onZoomChange });

  const previewPayload = useMemo<PreviewPayloadInput>(
    () => ({
      productId,
      category,
      side,
      elements: elements || [],
      frontElements: frontElements || (side === "front" ? elements || [] : []),
      backElements: backElements || (side === "back" ? elements || [] : []),
      mockupColor,
      color: mockupColor,
      mockupMode: "on_model_ai",
      modelMockup: true,
    }),
    [productId, category, side, elements, frontElements, backElements, mockupColor],
  );

  const isBusy = saving || previewing;

  const openPreview = useCallback(async () => {
    if (isBusy) return;

    try {
      setPreviewing(true);
      await onPreviewDesign?.();
      const payload = await storePreviewPayload(previewPayload);
      const targetId = encodeURIComponent(String(payload?.productId || productId || category || "draft"));
      window.location.assign(`/dashboard/design/preview/${targetId}`);
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Error opening preview.");
    } finally {
      setPreviewing(false);
    }
  }, [category, isBusy, onPreviewDesign, previewPayload, productId]);

  const openSaveConfirm = useCallback(() => {
    if (!isBusy) setConfirmSave(true);
  }, [isBusy]);

  const handleConfirmSave = useCallback(async () => {
    if (saving) return;
    try {
      setConfirmSave(false);
      await onSaveDesign();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving design.");
    }
  }, [onSaveDesign, saving]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#05050d]/92 text-white shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#05050d]/78">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />

        <div className="relative mx-auto hidden h-12 w-full max-w-[1800px] items-center gap-1.5 px-2 sm:flex sm:h-12 sm:gap-2 sm:px-3 lg:px-5">
          <BrandSection />
          <SideSwitcher side={side} setSide={setSide} disabled={isBusy} />

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <ZoomSection zoom={safeZoom} setZoom={setZoom} disabled={isBusy} />
          </div>

          <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-1">
            <div className="hidden sm:block">
              <HistorySection onUndo={onUndo} onRedo={onRedo} onRevert={onRevert} canUndo={canUndo} canRedo={canRedo} disabled={isBusy} compact />
            </div>
            <div className="hidden md:block lg:hidden">
              <ZoomSection zoom={safeZoom} setZoom={setZoom} disabled={isBusy} mobile />
            </div>
            <PreviewButton previewing={previewing} onClick={openPreview} disabled={isBusy} compact />
            <SaveButton saving={saving} onClick={openSaveConfirm} disabled={isBusy} compact />
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[640px] flex-col gap-1.5 px-2 py-2 sm:hidden">
          <div className="grid grid-cols-[36px_1fr_82px] items-center gap-1.5">
            <button type="button" onClick={() => window.history.back()} className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.07] text-white ring-1 ring-white/10 active:scale-95" aria-label="Back">
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 rounded-2xl bg-white/[0.045] px-3 py-2 ring-1 ring-white/10">
              <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-cyan-200">{category || productId || "Design"}</p>
              <p className="truncate text-[10px] font-bold text-white/45">{side} · production editor</p>
            </div>
            <button type="button" onClick={openPreview} disabled={isBusy} className="flex h-9 items-center justify-center gap-1 rounded-2xl bg-white text-[11px] font-black text-[#05050d] active:scale-95 disabled:opacity-50">
              <Eye size={14} /> Preview
            </button>
          </div>

          <div className="grid grid-cols-5 items-center gap-1.5">
            <button type="button" onClick={onUndo} disabled={!canUndo || isBusy} className="flex h-9 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 disabled:opacity-35" aria-label="Undo"><Undo2 size={15} /></button>
            <button type="button" onClick={onRedo} disabled={!canRedo || isBusy} className="flex h-9 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 disabled:opacity-35" aria-label="Redo"><Redo2 size={15} /></button>
            <button type="button" onClick={() => setSide(side === "front" ? "back" : "front")} disabled={isBusy} className="h-9 rounded-2xl bg-white/[0.06] px-2 text-[11px] font-black uppercase ring-1 ring-white/10">{side === "front" ? "Back" : "Front"}</button>
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white/[0.045] ring-1 ring-white/10">
              <ZoomSection zoom={safeZoom} setZoom={setZoom} disabled={isBusy} mobile />
            </div>
            <button type="button" onClick={openSaveConfirm} disabled={isBusy} className="flex h-9 items-center justify-center gap-1 rounded-2xl bg-cyan-300 text-[11px] font-black text-[#05050d] disabled:opacity-50"><Save size={14} /> Save</button>
          </div>
        </div>
      </header>

      <SaveConfirmModal
        open={confirmSave}
        saving={saving}
        onCancel={() => setConfirmSave(false)}
        onConfirm={handleConfirmSave}
      />

    </>
  );
}

export default memo(TopBar);
