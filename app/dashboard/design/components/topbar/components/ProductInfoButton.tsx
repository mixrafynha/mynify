"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Layers3, Package, Palette, Ruler, Tag, X } from "lucide-react";
import type { ProductDisplayConfig } from "../../canvas/productConfig";
import type { SelectedProductVariant } from "../types";
import TopBarButton from "./TopBarButton";

const SECOND_PRINT_PRICE = 6;

function parsePrice(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  let normalized = String(value).trim().replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    normalized = comma > dot
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (comma >= 0) {
    normalized = normalized.replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasVisibleDesign(elements?: any[]) {
  return Array.isArray(elements) && elements.some((element) => element && element.meta?.hidden !== true);
}

function ProductInfoButton({
  productId,
  category,
  mockupColor,
  productConfig,
  selectedVariant,
  frontElements,
  backElements,
}: {
  productId?: string;
  category?: string;
  mockupColor: string;
  productConfig?: ProductDisplayConfig | null;
  selectedVariant?: SelectedProductVariant | null;
  frontElements?: any[];
  backElements?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pricing = useMemo(() => {
    const rawPrice = selectedVariant?.variantPrice ?? selectedVariant?.price;
    const basePrice = parsePrice(rawPrice);
    const raw = String(rawPrice ?? "");
    const currency = raw.includes("$") ? "USD" : raw.includes("£") ? "GBP" : "EUR";
    const formatter = new Intl.NumberFormat("en-IE", { style: "currency", currency });
    const frontPrinted = hasVisibleDesign(frontElements);
    const backPrinted = hasVisibleDesign(backElements);
    const printSideCount = Number(frontPrinted) + Number(backPrinted);
    const secondPrintCharge = printSideCount >= 2 ? SECOND_PRINT_PRICE : 0;
    return {
      basePrice,
      frontPrinted,
      backPrinted,
      printSideCount,
      secondPrintCharge,
      format: (amount: number) => formatter.format(amount),
      total: basePrice == null ? null : basePrice + secondPrintCharge,
    };
  }, [backElements, frontElements, selectedVariant?.price, selectedVariant?.variantPrice]);

  const productName = productConfig?.gelatoProductName || category || "Custom product";
  const productUid = selectedVariant?.gelatoProductUid || selectedVariant?.gelato_product_uid || selectedVariant?.productUid || selectedVariant?.product_uid;
  const variantColourMatches = selectedVariant?.colorHex?.toLowerCase() === mockupColor.toLowerCase();

  return (
    <>
      <TopBarButton title="Product details and price" onClick={() => setOpen(true)}>
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Package className="h-[18px] w-[18px]" strokeWidth={2.15} />
          <span className="absolute -bottom-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-cyan-300 px-0.5 text-[8px] font-black leading-none text-[#05050d] ring-2 ring-[#10101b]">€</span>
        </span>
      </TopBarButton>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[2147483646] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
          role="presentation"
        >
          <section className="max-h-[88svh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b0b16] p-5 text-white shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="product-info-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-300"><Package className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-300/80">Product details</p>
                <h2 id="product-info-title" className="truncate text-lg font-black">{productName}</h2>
                {productId && <p className="truncate text-xs text-white/40">Product ID: {productId}</p>}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white/[.055] p-3"><Ruler className="mb-2 h-4 w-4 text-cyan-300" /><span className="block text-[11px] text-white/45">Size</span><strong>{selectedVariant?.size || "Not selected"}</strong></div>
              <div className="rounded-2xl bg-white/[.055] p-3"><Palette className="mb-2 h-4 w-4 text-cyan-300" /><span className="block text-[11px] text-white/45">Colour</span><span className="flex items-center gap-2 font-bold"><i className="h-3.5 w-3.5 rounded-full border border-white/25" style={{ backgroundColor: mockupColor }} />{variantColourMatches && selectedVariant?.colorName ? selectedVariant.colorName : "Custom"}</span></div>
              <div className="rounded-2xl bg-white/[.055] p-3"><Tag className="mb-2 h-4 w-4 text-cyan-300" /><span className="block text-[11px] text-white/45">SKU</span><strong className="break-all text-xs">{selectedVariant?.sku || "—"}</strong></div>
              <div className="rounded-2xl bg-white/[.055] p-3"><Layers3 className="mb-2 h-4 w-4 text-cyan-300" /><span className="block text-[11px] text-white/45">Print sides</span><strong>{pricing.frontPrinted && pricing.backPrinted ? "Front + back" : pricing.backPrinted ? "Back" : pricing.frontPrinted ? "Front" : "No design"}</strong></div>
            </div>

            {(selectedVariant?.variantId || productUid) && <div className="mt-2 rounded-2xl bg-white/[.035] px-3 py-2.5 text-[11px] text-white/40">{selectedVariant?.variantId && <p className="truncate">Variant ID: {selectedVariant.variantId}</p>}{productUid && <p className="truncate">Product UID: {productUid}</p>}</div>}

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm"><span className="text-white/55">Base product price</span><strong>{pricing.basePrice == null ? "Price unavailable" : pricing.format(pricing.basePrice)}</strong></div>
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm"><span className="text-white/55">First print side</span><strong className="text-emerald-300">Included</strong></div>
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm"><span className="text-white/55">Second print side</span><strong className={pricing.secondPrintCharge ? "text-amber-300" : "text-white/40"}>{pricing.secondPrintCharge ? `+ ${pricing.format(pricing.secondPrintCharge)}` : pricing.printSideCount === 0 ? "Not used" : "Not used"}</strong></div>
              <div className="flex items-center justify-between px-4 py-4"><span className="font-bold">Total</span><strong className="text-xl font-black text-cyan-300">{pricing.total == null ? "—" : pricing.format(pricing.total)}</strong></div>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">One print side is included. {pricing.format(SECOND_PRINT_PRICE)} is added only when both front and back contain a visible design.</p>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

export default memo(ProductInfoButton);
