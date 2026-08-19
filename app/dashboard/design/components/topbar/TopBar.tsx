"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandSection from "./components/BrandSection";
import HistorySection from "./components/HistorySection";
import PreviewButton from "./components/PreviewButton";
import SaveButton from "./components/SaveButton";
import SideSwitcher from "./components/SideSwitcher";
import ZoomSection from "./components/ZoomSection";
import ProductionPreviewDrawer, { preloadProductionPreview } from "../preview/ProductionPreviewDrawer";
import { storePreviewPayload } from "./services/previewStorage";
import { useTopBarZoom } from "./hooks/useTopBarZoom";
import type { PreviewPayloadInput, TopBarProps } from "./types";
import ProductInfoButton from "./components/ProductInfoButton";

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
  selectedVariant = null,
}: TopBarProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [drawerInput, setDrawerInput] = useState<PreviewPayloadInput | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(preloadProductionPreview, { timeout: 1800 });
      return () => win.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(preloadProductionPreview, 700);
    return () => window.clearTimeout(id);
  }, []);

  const { zoom: safeZoom, setZoom } = useTopBarZoom({
    zoom,
    zoomIn,
    zoomOut,
    onZoomChange,
  });

  const previewPayload = useMemo<PreviewPayloadInput>(
    () => {
      const liveElements = Array.isArray(elements) ? elements : [];
      const resolvedFrontElements =
        Array.isArray(frontElements) && frontElements.length > 0
          ? frontElements
          : side === "front"
            ? liveElements
            : Array.isArray(frontElements)
              ? frontElements
              : [];
      const resolvedBackElements =
        Array.isArray(backElements) && backElements.length > 0
          ? backElements
          : side === "back"
            ? liveElements
            : Array.isArray(backElements)
              ? backElements
              : [];

      return {
        productId,
        category,
        side,
        elements: liveElements,
        frontElements: resolvedFrontElements,
        backElements: resolvedBackElements,
        mockupColor,
        color: mockupColor,
        mockupMode: "on_model_ai",
        modelMockup: true,
        productConfig,
        variantId: selectedVariant?.variantId || null,
        selectedVariant,
      };
    },
    [
      productId,
      category,
      side,
      elements,
      frontElements,
      backElements,
      mockupColor,
      productConfig,
      selectedVariant,
    ],
  );

  const isBusy = saving || previewing;

  const openPreview = useCallback(() => {
    if (isBusy) return;

    const requestId = ++previewRequestRef.current;
    setDrawerInput(previewPayload);
    setPreviewOpen(true);
    setPreviewing(true);
    void onPreviewDesign?.();

    // Open immediately with the live vectors. The heavier high-resolution
    // capture is swapped in only when ready, without blocking the drawer.
    void storePreviewPayload(previewPayload)
      .then((payload) => {
        if (previewRequestRef.current === requestId && payload) {
          setDrawerInput(payload as PreviewPayloadInput);
        }
      })
      .catch(() => {
        // The immediate vector preview remains usable if the optional capture fails.
      })
      .finally(() => {
        if (previewRequestRef.current === requestId) setPreviewing(false);
      });
  }, [isBusy, onPreviewDesign, previewPayload]);

  const handleSaveClick = useCallback(async () => {
    console.warn("[PREVIEW DIAGNOSTIC] save button clicked");
    console.warn("[PREVIEW DIAGNOSTIC] save handler entered");
    console.info("[save-design] save button clicked", {
      saving,
      previewing,
    });
    if (saving) return;

    try {
      console.info("[save-design] invoking save handler");
      await onSaveDesign();
    } catch (error) {
      console.error("[preview] failed", error);
      alert("Error saving design.");
    }
  }, [onSaveDesign, saving]);

  return (
    <>
      <header className="sticky top-0 z-50 h-[50px] w-full shrink-0 overflow-hidden border-b border-violet-400/18 bg-[#090514]/95 text-white shadow-[0_8px_24px_rgba(0,0,0,.28),0_0_24px_rgba(168,85,247,.10)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#090514]/82">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/55 to-transparent" />

        <div className="relative mx-auto flex h-full w-full max-w-[1840px] items-center gap-1.5 overflow-hidden px-1.5 sm:gap-2 sm:px-3 lg:px-4">
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

            <ProductInfoButton
              productId={productId}
              category={category}
              mockupColor={mockupColor}
              productConfig={productConfig}
              selectedVariant={selectedVariant}
              frontElements={previewPayload.frontElements}
              backElements={previewPayload.backElements}
            />

            <SaveButton saving={saving} onClick={handleSaveClick} disabled={saving} compact />
          </div>
        </div>
      </header>

      <ProductionPreviewDrawer
        open={previewOpen}
        input={(drawerInput || previewPayload) as PreviewPayloadInput}
        onClose={() => {
          previewRequestRef.current += 1;
          setPreviewing(false);
          setPreviewOpen(false);
        }}
        onSaveDesign={onSaveDesign}
      />
    </>
  );
}

export default memo(TopBar);
