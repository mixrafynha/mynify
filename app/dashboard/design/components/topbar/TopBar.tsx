"use client";

import { memo, useCallback, useMemo, useState } from "react";
import BrandSection from "./components/BrandSection";
import HistorySection from "./components/HistorySection";
import PreviewButton from "./components/PreviewButton";
import SaveButton from "./components/SaveButton";
import SaveConfirmModal from "./components/SaveConfirmModal";
import SideSwitcher from "./components/SideSwitcher";
import ZoomSection from "./components/ZoomSection";
import ProductionPreviewDrawer from "../preview/ProductionPreviewDrawer";
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
  productConfig = null,
}: TopBarProps) {
  const [confirmSave, setConfirmSave] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [drawerInput, setDrawerInput] = useState<PreviewPayloadInput | null>(null);

  const { zoom: safeZoom, setZoom } = useTopBarZoom({
    zoom,
    zoomIn,
    zoomOut,
    onZoomChange,
  });

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
      productConfig,
    }),
    [
      productId,
      category,
      side,
      elements,
      frontElements,
      backElements,
      mockupColor,
      productConfig,
    ],
  );

  const isBusy = saving || previewing;

  const openPreview = useCallback(async () => {
    if (isBusy) return;

    try {
      setPreviewing(true);

      // The drawer receives the generated payload directly in memory. Keep the
      // legacy callback non-blocking so a failed full-mockup capture cannot stop
      // the production preview from opening.
      void onPreviewDesign?.();

      const payload = await storePreviewPayload(previewPayload);

      setDrawerInput((payload || previewPayload) as PreviewPayloadInput);
      setPreviewOpen(true);
    } catch {
      alert("Error opening preview.");
    } finally {
      setPreviewing(false);
    }
  }, [isBusy, onPreviewDesign, previewPayload]);

  const openSaveConfirm = useCallback(() => {
    if (!isBusy) setConfirmSave(true);
  }, [isBusy]);

  const handleConfirmSave = useCallback(async () => {
    if (saving) return;

    try {
      setConfirmSave(false);
      await onSaveDesign();
    } catch {
      alert("Error saving design.");
    }
  }, [onSaveDesign, saving]);

  return (
    <>
      <header className="sticky top-0 z-50 h-12 w-full shrink-0 overflow-hidden border-b border-white/[0.07] bg-[#05050d]/92 text-white shadow-[0_8px_24px_rgba(0,0,0,.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#05050d]/78">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />

        <div className="relative mx-auto flex h-full w-full max-w-[1800px] items-center gap-1.5 overflow-hidden px-1.5 sm:gap-2 sm:px-3 lg:px-5">
          <BrandSection />

          <SideSwitcher side={side} setSide={setSide} disabled={isBusy} />

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <ZoomSection zoom={safeZoom} setZoom={setZoom} disabled={isBusy} />
          </div>

          <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-1">
            <HistorySection
              onUndo={onUndo}
              onRedo={onRedo}
              onRevert={onRevert}
              canUndo={canUndo}
              canRedo={canRedo}
              disabled={isBusy}
              compact
            />

            <div className="hidden md:block lg:hidden">
              <ZoomSection
                zoom={safeZoom}
                setZoom={setZoom}
                disabled={isBusy}
                mobile
              />
            </div>

            <PreviewButton
              previewing={previewing || previewOpen}
              onClick={openPreview}
              disabled={isBusy}
              compact
            />

            <SaveButton
              saving={saving}
              onClick={openSaveConfirm}
              disabled={isBusy}
              compact
            />
          </div>
        </div>
      </header>

      <SaveConfirmModal
        open={confirmSave}
        saving={saving}
        onCancel={() => setConfirmSave(false)}
        onConfirm={handleConfirmSave}
      />

      <ProductionPreviewDrawer
        open={previewOpen}
        input={(drawerInput || previewPayload) as PreviewPayloadInput}
        onClose={() => setPreviewOpen(false)}
        onSaveDesign={onSaveDesign}
      />
    </>
  );
}

export default memo(TopBar);