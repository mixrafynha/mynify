"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductionPreviewInput } from "./types/preview";
import "./styles/preview-global.css";

const ProductionPreview = dynamic(() => import("./ProductionPreview"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[2147483647] flex h-[100svh] w-screen items-center justify-center bg-[#f4f1ec] text-sm font-black text-black/50">
      Preparing preview...
    </div>
  ),
});

function ProductionPreviewDrawer({
  open,
  input,
  onClose,
  onSaveDesign,
}: {
  open: boolean;
  input: ProductionPreviewInput;
  onClose: () => void;
  onSaveDesign?: () => Promise<void> | void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousTouchAction = document.body.style.touchAction;
    const previousPosition = document.body.style.position;
    const previousWidth = document.body.style.width;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("mynify-preview-open");
    document.documentElement.classList.add("mynify-preview-open");
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.touchAction = "none";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.classList.remove("mynify-preview-open");
      document.documentElement.classList.remove("mynify-preview-open");
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.style.touchAction = previousTouchAction;
      document.body.style.position = previousPosition;
      document.body.style.width = previousWidth;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-mynify-preview-overlay="true"
      className="fixed inset-0 z-[2147483647] h-[100svh] w-screen overflow-hidden bg-[#f4f1ec] text-black isolation-isolate"
      role="dialog"
      aria-modal="true"
    >
      <ProductionPreview input={input} onClose={onClose} onSaveDesign={onSaveDesign} />
    </div>,
    document.body,
  );
}

export default memo(ProductionPreviewDrawer);
