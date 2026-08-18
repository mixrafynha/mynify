"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import EmptyCart from "./_components/EmptyCart";
import ProductPreviewImage from "./_components/ProductPreviewImage";
import { getAddressStateLabel, isStateRequiredForCountry } from "./_lib/address-rules";
import {
  createAddressSessionToken,
  fieldClass,
  getCartProductId,
  getCountryCode,
  getPostalPlaceholder,
  getVariantLookupProductIds,
  isValidEmail,
  money,
  normalizeDigits,
  resolveCheckoutCountry,
  safeArray,
  selectClass,
  validatePhoneNumber,
  variantColor,
  variantHex,
  variantId,
  variantImage,
  variantSize,
  variantPrice,
  variantStock,
  variantSku,
  variantProductColorId,
  isVariantAvailable,
  isCustomDesignItem,
  customSecondPrintCharge,
  readCheckoutSession,
  readCheckoutStep,
  CHECKOUT_SESSION_KEY,
  CHECKOUT_STEP_SESSION_KEY,
  GELATO_COUNTRIES,
  createSecureCheckoutRequestPayload,
  resolveGelatoPrintFiles,
} from "./_lib/checkout";
import { normalizeShippingMethods, type NormalizedShippingMethod } from "@/lib/gelato/shipping-methods";
import NavbarBrand from "@/app/components/Navbar/NavbarBrand";
import type {
  AddressSuggestion,
  CartItem,
  CartVariant,
  CheckoutForm,
  ProductAvailability,
  ProductAvailabilityItem,
  Step,
  SecureCheckoutRequestPayload,
} from "./_lib/checkout";

type CheckoutShippingMethod = {
  id: string;
  title: string;
  price?: number | null;
  currency?: string | null;
  estimatedDays?: string | null;
  fulfillmentCountry?: string | null;
  promiseUid?: string | null;
  carrierUid?: string | null;
  serviceType?: string | null;
  description?: string | null;
};

const countryDisplayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function getObjectValue(source: unknown, keys: string[]): unknown {
  if (!source || typeof source !== "object") return null;

  if (Array.isArray(source)) {
    for (const entry of source) {
      const value = getObjectValue(entry, keys);
      if (value !== null && value !== undefined) return value;
    }
    return null;
  }

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }

  for (const value of Object.values(record)) {
    const nested = getObjectValue(value, keys);
    if (nested !== null && nested !== undefined) return nested;
  }

  return null;
}


function cleanUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}


function resolveRealCanvasMockupUrl(args: {
  mockups: Record<string, unknown>;
  side: "front" | "back";
}) {
  const canvasUrl =
    args.side === "front"
      ? cleanUrl(args.mockups.front)
      : cleanUrl(args.mockups.back);
  const fallbackUrl =
    args.side === "front"
      ? cleanUrl(args.mockups.checkout_thumbnail_front_url) || cleanUrl(args.mockups.checkout_thumbnail_url)
      : cleanUrl(args.mockups.checkout_thumbnail_back_url) || cleanUrl(args.mockups.checkout_thumbnail_back);

  if (!canvasUrl) return null;
  if (fallbackUrl && canvasUrl === fallbackUrl) return null;
  return canvasUrl;
}

function formatShippingCurrency(amount: number | null | undefined, _currency?: string | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "Calculated";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

function formatEstimatedDelivery(value: string | null | undefined) {
  if (!value) return "Estimated delivery";
  const cleaned = value.trim().replace(/\s+/g, " ");
  const rangeMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2})\s*[-–]\s*(\d{4}-\d{2}-\d{2})$/);
  if (!rangeMatch) return cleaned;

  const start = new Date(`${rangeMatch[1]}T00:00:00`);
  const end = new Date(`${rangeMatch[2]}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return cleaned;

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const monthDay = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  if (sameMonth) {
    return `${monthDay.format(start)}–${end.getDate()}`;
  }

  const longDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${longDate.format(start)} – ${longDate.format(end)}`;
}

function formatShipsFrom(countryCode: string | null | undefined) {
  if (!countryCode) return null;
  const label = countryDisplayNames?.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase();
  return `Ships from ${label}`;
}

function CardBrandIcon({ brand }: { brand: "visa" | "mastercard" | "apple-pay" | "google-pay" | "klarna" | "link" }) {
  const baseClass = "h-10 w-[72px] rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  if (brand === "visa") {
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 120 40" className="h-full w-full" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="118" height="38" rx="12" fill="#122a66" />
          <path d="M20 28h9l5-16h-9l-5 16Z" fill="#fff" />
          <path d="M43 28h7l3.6-16H46l-3 16Z" fill="#fff" />
          <path d="M57 12h6.5c2.9 0 5.3 1.2 5.3 4 0 2.7-2.2 4.4-5.1 4.4H61l-1.1 5.6h-6.2L57 12Zm4.8 6.4c1.1 0 1.8-.5 1.8-1.4 0-.8-.6-1.2-1.6-1.2H60l-.5 2.6h2.3Z" fill="#fff" />
          <path d="M76 12h6.4L87 28h-6.2l-.5-2h-5.1l-1 2H68l8-16Zm1.3 9.5h3.1l-1.1-4.5-2 4.5Z" fill="#fff" />
        </svg>
      </div>
    );
  }

  if (brand === "mastercard") {
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
          <rect x="1" y="1" width="118" height="38" rx="12" fill="#111" />
          <circle cx="48" cy="20" r="10" fill="#EA001B" />
          <circle cx="60" cy="20" r="10" fill="#FF5F00" fillOpacity="0.95" />
          <path d="M54 12.4a10 10 0 0 1 0 15.2 10 10 0 1 0 0-15.2Z" fill="#F79E1B" opacity="0.95" />
        </svg>
      </div>
    );
  }

  if (brand === "apple-pay") {
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
          <rect x="1" y="1" width="118" height="38" rx="12" fill="#111" />
          <path d="M61 27c-1.4 0-2.4-.7-3.1-.7-.8 0-1.9.7-3.1.7-2.5 0-5.5-4.9-5.5-8.8 0-3.9 2.4-5.9 4.7-5.9 1.2 0 2.2.8 2.9.8.7 0 1.9-.8 3.3-.8 1.2 0 3 .6 4.1 2.1-3.6 2-3 7.2.7 8.3-.4 1.2-1.6 4.3-4 4.3Zm-1.2-14.5c.7-.8 1.2-1.9 1.1-3.1-1 .1-2.1.7-2.8 1.5-.7.8-1.3 1.9-1.1 3 1.1 0 2.2-.6 2.8-1.4Z" fill="#fff" />
        </svg>
      </div>
    );
  }

  if (brand === "google-pay") {
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
          <rect x="1" y="1" width="118" height="38" rx="12" fill="#111" />
          <path d="M39 20a8 8 0 0 1 8-8h6v4h-6a4 4 0 1 0 0 8h3v-3h-3v-4h7v9h-7a8 8 0 0 1-8-8Z" fill="#4285F4" />
          <path d="M58 12h4v16h-4z" fill="#34A853" />
          <path d="M65 12h4l4 7 4-7h4l-6.2 10 6.2 6h-4.7l-4.2-4.2L64.7 28H60l6.1-6L65 12Z" fill="#EA4335" />
          <path d="M86 12h4l5 16h-4l-1-3h-5l-1 3h-4l5-16Zm1.2 9h3.6l-1.8-5.6-1.8 5.6Z" fill="#FBBC05" />
        </svg>
      </div>
    );
  }

  if (brand === "klarna") {
    return (
      <div className={baseClass}>
        <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
          <rect x="1" y="1" width="118" height="38" rx="12" fill="#ffb7d5" />
          <path d="M38 12h7v16h-7zM48 12h7v16h-7zM58 12h7v16h-7zM70 12h7v16h-7z" fill="#111" opacity="0.92" />
          <path d="M90 13c2.9 0 5 2 5 4.8 0 2.1-1.2 3.8-3.1 4.5l3.7 6.7h-4.7l-3-6h-1.3v6h-4V13h7.4Zm-3.4 7h2.9c1.2 0 2-.8 2-2s-.8-2-2-2h-2.9v4Z" fill="#111" opacity="0.92" />
        </svg>
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
        <rect x="1" y="1" width="118" height="38" rx="12" fill="#1a1a1a" />
        <path d="M41 12h6v16h-6zM50 12h6l4 7 4-7h6l-6 10 6 6h-6l-4-4-4 4h-6l6-6-6-10Z" fill="#00C05F" />
      </svg>
    </div>
  );
}

function resolvePreviewImageSources(item: CartItem) {
  const customDesignItem = isCustomDesignItem(item);
  const designData = item.design_data ?? item.designData ?? {};
  const directMockups =
    item.mockups && typeof item.mockups === "object" && !Array.isArray(item.mockups)
      ? (item.mockups as Record<string, unknown>)
      : {};
  const mockups =
    designData && typeof designData === "object" && !Array.isArray(designData) && designData.mockups && typeof designData.mockups === "object"
      ? (designData.mockups as Record<string, unknown>)
      : {};
  const mergedMockups = { ...directMockups, ...mockups };
  const sides =
    designData && typeof designData === "object" && !Array.isArray(designData) && designData.sides && typeof designData.sides === "object"
      ? (designData.sides as Record<string, unknown>)
      : {};
  const frontSide =
    sides.front && typeof sides.front === "object" && !Array.isArray(sides.front)
      ? (sides.front as Record<string, unknown>)
      : {};
  const backSide =
    sides.back && typeof sides.back === "object" && !Array.isArray(sides.back)
      ? (sides.back as Record<string, unknown>)
      : {};

  const front =
    cleanUrl(item.previewFront) ||
    resolveRealCanvasMockupUrl({ mockups: mergedMockups, side: "front" }) ||
    cleanUrl(frontSide.mockupUrl) ||
    cleanUrl(frontSide.mockup_url) ||
    cleanUrl(mergedMockups.checkout_thumbnail_url) ||
    cleanUrl(mergedMockups.checkout_thumbnail_front_url) ||
    (customDesignItem ? null : cleanUrl(item.image));

  const back =
    cleanUrl(item.previewBack) ||
    resolveRealCanvasMockupUrl({ mockups: mergedMockups, side: "back" }) ||
    cleanUrl(backSide.mockupUrl) ||
    cleanUrl(backSide.mockup_url) ||
    cleanUrl(mergedMockups.checkout_thumbnail_back_url) ||
    cleanUrl(mergedMockups.checkout_thumbnail_back);


  return { front, back };
}

function cleanUuid(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : null;
}

function resolveCheckoutAvailabilityVariantId(item: CartItem) {
  return cleanUuid(item.variant_id ?? (item as CartItem & { variantId?: string | null }).variantId ?? null);
}

function buildCheckoutAvailabilityItems(items: CartItem[]) {
  return items.map((item) => ({
    itemId: item.id,
    cartItemId: item.id,
    title: item.title,
    productId: getCartProductId(item),
    variantId: resolveCheckoutAvailabilityVariantId(item),
    designId: item.design_id ?? item.designId ?? item.user_product_id ?? item.userProductId ?? null,
    userProductId: item.user_product_id ?? item.userProductId ?? item.design_id ?? item.designId ?? null,
    color: item.color ?? null,
    size: item.size ?? null,
    quantity: Math.max(1, Number(item.quantity) || 1),
    printFiles: resolveGelatoPrintFiles(item),
  }));
}

function previewSourceRank(item: CartItem, side: "front" | "back") {
  const designData = item.design_data ?? item.designData ?? {};
  const directMockups =
    item.mockups && typeof item.mockups === "object" && !Array.isArray(item.mockups)
      ? (item.mockups as Record<string, unknown>)
      : {};
  const mockups =
    designData && typeof designData === "object" && !Array.isArray(designData) && designData.mockups && typeof designData.mockups === "object"
      ? (designData.mockups as Record<string, unknown>)
      : {};
  const mergedMockups = { ...directMockups, ...mockups };
  const sides =
    designData && typeof designData === "object" && !Array.isArray(designData) && designData.sides && typeof designData.sides === "object"
      ? (designData.sides as Record<string, unknown>)
      : {};
  const sideData =
    sides[side] && typeof sides[side] === "object" && !Array.isArray(sides[side])
      ? (sides[side] as Record<string, unknown>)
      : {};

  if (side === "front") {
    if (cleanUrl(item.previewFront)) return 7;
    if (resolveRealCanvasMockupUrl({ mockups: mergedMockups, side: "front" })) return 6;
    if (cleanUrl(sideData.mockupUrl) || cleanUrl(sideData.mockup_url)) return 5;
    if (cleanUrl((item as Record<string, unknown>).mockup_url)) return 4;
    if (cleanUrl(item.image)) return 3;
    if (cleanUrl(mergedMockups.checkout_thumbnail_front_url) || cleanUrl(mergedMockups.checkout_thumbnail_url)) return 2;
    return 1;
  }

  if (cleanUrl(item.previewBack)) return 7;
  if (resolveRealCanvasMockupUrl({ mockups: mergedMockups, side: "back" })) return 6;
  if (cleanUrl(sideData.mockupUrl) || cleanUrl(sideData.mockup_url)) return 5;
  if (cleanUrl(mergedMockups.checkout_thumbnail_back_url) || cleanUrl(mergedMockups.checkout_thumbnail_back)) return 2;
  return 1;
}

function mergeCartItemsPreservingPreview(currentItems: CartItem[], nextItems: CartItem[]) {
  const currentMap = new Map(currentItems.map((item) => [item.id, item]));

  return nextItems.map((nextItem) => {
    const currentItem = currentMap.get(nextItem.id);
    if (!currentItem) return nextItem;

    const currentFrontRank = previewSourceRank(currentItem, "front");
    const nextFrontRank = previewSourceRank(nextItem, "front");
    const currentBackRank = previewSourceRank(currentItem, "back");
    const nextBackRank = previewSourceRank(nextItem, "back");

    if (nextFrontRank >= currentFrontRank && nextBackRank >= currentBackRank) {
      return nextItem;
    }

    return {
      ...nextItem,
      previewFront: nextFrontRank < currentFrontRank ? currentItem.previewFront ?? nextItem.previewFront : nextItem.previewFront,
      previewBack: nextBackRank < currentBackRank ? currentItem.previewBack ?? nextItem.previewBack : nextItem.previewBack,
      image: nextFrontRank < currentFrontRank ? currentItem.image ?? nextItem.image : nextItem.image,
      mockups:
        nextFrontRank < currentFrontRank || nextBackRank < currentBackRank
          ? (currentItem.mockups ?? nextItem.mockups)
          : nextItem.mockups,
      design_data:
        nextFrontRank < currentFrontRank || nextBackRank < currentBackRank
          ? (currentItem.design_data ?? nextItem.design_data)
          : nextItem.design_data,
      designData:
        nextFrontRank < currentFrontRank || nextBackRank < currentBackRank
          ? (currentItem.designData ?? nextItem.designData)
          : nextItem.designData,
    };
  });
}

type ThumbnailReadiness = "pending" | "processing" | "ready" | "failed" | "missing";

function resolveThumbnailReadiness(item: CartItem): ThumbnailReadiness {
  const designData = item.design_data ?? item.designData ?? {};
  const designRecord =
    designData && typeof designData === "object" && !Array.isArray(designData)
      ? (designData as Record<string, unknown>)
      : {};
  const directMockups =
    item.mockups && typeof item.mockups === "object" && !Array.isArray(item.mockups)
      ? (item.mockups as Record<string, unknown>)
      : {};
  const designMockups =
    designRecord.mockups && typeof designRecord.mockups === "object" && !Array.isArray(designRecord.mockups)
      ? (designRecord.mockups as Record<string, unknown>)
      : {};
  const backgroundJobs =
    designRecord.backgroundJobs && typeof designRecord.backgroundJobs === "object" && !Array.isArray(designRecord.backgroundJobs)
      ? (designRecord.backgroundJobs as Record<string, unknown>)
      : {};
  const production =
    designRecord.production && typeof designRecord.production === "object" && !Array.isArray(designRecord.production)
      ? (designRecord.production as Record<string, unknown>)
      : {};
  const productionJobs =
    production.jobs && typeof production.jobs === "object" && !Array.isArray(production.jobs)
      ? (production.jobs as Record<string, unknown>)
      : {};
  const checkoutThumbnailJob =
    productionJobs.checkoutThumbnail &&
    typeof productionJobs.checkoutThumbnail === "object" &&
    !Array.isArray(productionJobs.checkoutThumbnail)
      ? (productionJobs.checkoutThumbnail as Record<string, unknown>)
      : {};
  const persistedFrontThumbnail =
    cleanUrl(typeof directMockups.checkout_thumbnail_url === "string" ? directMockups.checkout_thumbnail_url : null) ||
    cleanUrl(typeof directMockups.checkout_thumbnail_front_url === "string" ? directMockups.checkout_thumbnail_front_url : null) ||
    cleanUrl(typeof designMockups.checkout_thumbnail_url === "string" ? designMockups.checkout_thumbnail_url : null) ||
    cleanUrl(typeof designMockups.checkout_thumbnail_front_url === "string" ? designMockups.checkout_thumbnail_front_url : null) ||
    cleanUrl(typeof item.previewFront === "string" ? item.previewFront : null);

  if (persistedFrontThumbnail) return "ready";

  const candidates = [
    directMockups.checkout_thumbnail_status,
    designMockups.checkout_thumbnail_status,
    designRecord.checkoutThumbnailStatus,
    backgroundJobs.checkoutThumbnail,
    checkoutThumbnailJob.status ?? null,
  ];

  for (const candidate of candidates) {
    const status = normalizePrintFileStatus(candidate);
    if (status) return status;
  }

  return "missing";
}

type PrintFileReadiness = {
  status: "pending" | "processing" | "ready" | "failed" | "missing";
  source: "user_product" | "cart_item" | "design_data" | "frontend" | "missing";
};

function normalizePrintFileStatus(value: unknown): PrintFileReadiness["status"] | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "pending" || normalized === "processing" || normalized === "ready" || normalized === "failed") {
    return normalized;
  }
  return null;
}

function resolvePrintFileReadiness(item: CartItem): PrintFileReadiness {
  const designData = item.design_data ?? item.designData ?? {};
  const directPrintFiles = item.print_files ?? item.printFiles ?? null;
  const designPrintFiles =
    designData && typeof designData === "object" && !Array.isArray(designData)
      ? ((designData as Record<string, unknown>).print_files ??
          (designData as Record<string, unknown>).printFiles ??
          null)
      : null;

  const sources: Array<{ source: PrintFileReadiness["source"]; value: unknown }> = [
    { source: "user_product", value: directPrintFiles },
    { source: "design_data", value: designPrintFiles },
    { source: "cart_item", value: item.files ?? null },
    { source: "frontend", value: resolveGelatoPrintFiles(item) },
  ];

  for (const candidate of sources) {
    const value = candidate.value;
    const status =
      value && typeof value === "object" && !Array.isArray(value)
        ? normalizePrintFileStatus((value as Record<string, unknown>).status ?? (value as Record<string, unknown>).checkout_thumbnail_status)
        : null;

    const hasResolvedUrl = Array.isArray(value)
      ? value.some((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const record = entry as Record<string, unknown>;
          const url = record.url ?? record.fileUrl ?? record.printFileUrl ?? record.print_file_url ?? record.output_url ?? record.export_url ?? record.final_design_url ?? record.artwork_url ?? record.design_file_url;
          return typeof url === "string" && url.trim().startsWith("https://");
        })
      : candidate.source === "frontend"
        ? resolveGelatoPrintFiles(item).length > 0
        : Boolean(value && typeof value === "object");

    if (status === "failed") return { status: "failed", source: candidate.source };
    if (status === "ready" || hasResolvedUrl) return { status: "ready", source: candidate.source };
    if (status === "processing") return { status: "processing", source: candidate.source };
    if (status === "pending") return { status: "pending", source: candidate.source };
  }

  return { status: "missing", source: "missing" };
}

function isPrintFileReady(item: CartItem) {
  return resolvePrintFileReadiness(item).status === "ready";
}

export default function CheckoutPage() {
  const router = useRouter();
  const addressLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressAddressLookup = useRef(false);
  const selectedAddressLock = useRef("");
  const addressSessionToken = useRef(createAddressSessionToken());
  const availabilityLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const availabilityAbortController = useRef<AbortController | null>(null);
  const availabilityRequestId = useRef(0);
  const availabilityRequestSignatureRef = useRef("");
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const variantMutationSeqRef = useRef(0);
  const [variantMutationPendingCount, setVariantMutationPendingCount] = useState(0);
  const [availabilityMutationBlock, setAvailabilityMutationBlock] = useState(0);

  const [step, setStep] = useState<Step>(() => readCheckoutStep());
  const [items, setItems] = useState<CartItem[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, CartVariant[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const [shippingMethodSelection, setShippingMethodSelection] = useState<NormalizedShippingMethod | null>(null);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggestion, setAddressSuggestion] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prepareAssetsRequestKey = useRef("");
  const [productAvailability, setProductAvailability] = useState<ProductAvailability>({
    loading: false,
    checked: false,
    configured: false,
    available: true,
    unavailableItems: [],
    message: null,
  });
  const [form, setForm] = useState<CheckoutForm>(() =>
    readCheckoutSession() ?? {
      email: "",
      fullName: "",
      phoneCountry: "+351",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      stateCode: "",
      postalCode: "",
      country: "",
      shippingMethod: "standard",
    },
  );

  const hasCompleteShippingAddress = Boolean(
    form.country.trim() &&
      form.postalCode.trim() &&
      form.city.trim() &&
      form.address.trim() &&
      (!isStateRequiredForCountry(form.country) || form.state.trim() || form.stateCode.trim()),
  );

  const customDesignItems = useMemo(() => items.filter((item) => isCustomDesignItem(item)), [items]);
  const printFilesReady = useMemo(() => customDesignItems.every((item) => isPrintFileReady(item)), [customDesignItems]);
  const printFilesPending = customDesignItems.length > 0 && !printFilesReady;
  const checkoutAvailabilityItems = useMemo(() => buildCheckoutAvailabilityItems(items), [items]);
  const checkoutAvailabilityItemsReady = items.length > 0 && checkoutAvailabilityItems.every((item) => Boolean(item.variantId));
  const availabilityRequestSignature = useMemo(() => {
    return JSON.stringify({
      refreshKey: availabilityRefreshKey,
      mutationBlock: availabilityMutationBlock,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: `${form.phoneCountry}${form.phone.replace(/^\+/, "").replace(/\s/g, "")}`,
      country: form.country.trim(),
      address: form.address.trim(),
      apartment: form.apartment.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      state: form.state.trim(),
      stateCode: form.stateCode.trim(),
      hasCompleteShippingAddress,
      items: checkoutAvailabilityItems.map((item) => ({
        ...item,
        printFiles: item.printFiles.map((file) => `${file.type}:${file.url}`),
      })),
    });
  }, [availabilityRefreshKey, availabilityMutationBlock, checkoutAvailabilityItems, hasCompleteShippingAddress, form.address, form.apartment, form.city, form.country, form.email, form.fullName, form.phone, form.phoneCountry, form.postalCode, form.state, form.stateCode, variantMutationPendingCount]);

  const { subtotal, totalItems } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const price = Math.max(0, Number(item.price) || 0);
        acc.totalItems += qty;
        acc.subtotal += price * qty;
        return acc;
      },
      { subtotal: 0, totalItems: 0 },
    );
  }, [items]);

  const validatedShippingMethods = productAvailability.shippingMethods?.length ? productAvailability.shippingMethods : null;
  const shippingMethodsForDisplay = useMemo(() => {
    if (!validatedShippingMethods?.length) return null;

    // The checkout is EUR-only. Always use the latest validated quote and
    // normalize the UI value so every shipping method is submitted as EUR.
    return normalizeShippingMethods(validatedShippingMethods).map((method) => ({
      ...method,
    }));
  }, [validatedShippingMethods]);
  const findShippingMethod = useMemo(
    () =>
      (value?: string | null) => {
        const normalizedValue = typeof value === "string" ? value.trim() : "";
        if (!normalizedValue || !shippingMethodsForDisplay?.length) return null;
        return (
          shippingMethodsForDisplay.find(
            (method) => method.shipmentMethodUid === normalizedValue || method.id === normalizedValue,
          ) ?? null
        );
      },
    [shippingMethodsForDisplay],
  );
  const itemsSignature = useMemo(
    () =>
      items
        .map((item) =>
          [
            item.id,
            item.quantity,
            item.variant_id ?? "",
            item.user_product_id ?? item.userProductId ?? "",
            item.base_product_id ?? item.baseProductId ?? "",
          ].join(":"),
        )
        .join("|"),
    [items],
  );
  const shippingAddressSignature = useMemo(
    () =>
      [
        form.address.trim(),
        form.country.trim(),
        form.postalCode.trim(),
        form.city.trim(),
        form.state.trim(),
        form.stateCode.trim(),
      ].join("|"),
    [form.address, form.city, form.country, form.postalCode, form.state, form.stateCode],
  );
  useEffect(() => {
    if (!shippingMethodsForDisplay?.length) {
      // Preserve the validated selection while moving from review to payment.
      // The selection is cleared only when the address or cart really changes.
      if (step === "payment" && shippingMethodSelection?.id) return;

      setShippingMethodSelection(null);
      setSelectedShippingMethodId("");
      return;
    }

    setShippingMethodSelection((current) => {
      if (current) {
        // A shipping selection is identified only by Gelato's shipmentMethodUid.
        // Never migrate a selection to another carrier by code/name after a quote refresh.
        const currentShipmentMethodUid = String(current.shipmentMethodUid ?? "").trim();
        const matched = currentShipmentMethodUid
          ? shippingMethodsForDisplay.find(
              (method) => method.shipmentMethodUid === currentShipmentMethodUid,
            ) ?? null
          : null;

        if (matched) {
          setSelectedShippingMethodId(matched.id);
          setForm((previous) =>
            previous.shippingMethod === matched.id
              ? previous
              : { ...previous, shippingMethod: matched.id },
          );
          return matched;
        }
      }

      const matchedByForm = findShippingMethod(form.shippingMethod);
      return matchedByForm;
    });
    if (selectedShippingMethodId && !findShippingMethod(selectedShippingMethodId)) {
      setSelectedShippingMethodId("");
    }
  }, [
    findShippingMethod,
    form.shippingMethod,
    selectedShippingMethodId,
    shippingMethodsForDisplay,
    shippingMethodSelection?.id,
    step,
  ]);

  const previousItemsSignature = useRef("");
  const previousShippingAddressSignature = useRef("");
  useEffect(() => {
    if (previousItemsSignature.current && previousItemsSignature.current !== itemsSignature) {
      setShippingMethodSelection(null);
      setSelectedShippingMethodId("");
      setDraftOrderId(null);
    }
    previousItemsSignature.current = itemsSignature;
  }, [itemsSignature]);
  useEffect(() => {
    if (previousShippingAddressSignature.current && previousShippingAddressSignature.current !== shippingAddressSignature) {
      setShippingMethodSelection(null);
      setSelectedShippingMethodId("");
      setDraftOrderId(null);
    }
    previousShippingAddressSignature.current = shippingAddressSignature;
  }, [shippingAddressSignature]);
  const selectedShippingMethodRaw =
    findShippingMethod(selectedShippingMethodId) ??
    shippingMethodsForDisplay?.find((method) => method.id === shippingMethodSelection?.id) ??
    findShippingMethod(form.shippingMethod) ??
    null;
  const selectedShippingMethod = selectedShippingMethodRaw;
  const shipping =
    subtotal > 0 && step !== "shipping" && printFilesReady
      ? typeof selectedShippingMethod?.price === "number"
        ? selectedShippingMethod.price
        : null
      : null;
  const shippingDisplay = typeof shipping === "number" ? shipping : null;
  const totalBeforeTax = subtotal + (typeof shipping === "number" ? shipping : 0);
  const taxDisplay = form.country ? "Calculated at payment" : "Calculated after delivery country";
  const total = totalBeforeTax;
  const hasAvailabilityBlock = productAvailability.checked && productAvailability.configured && !productAvailability.available;
  const fullNameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
  const fullNameValid = fullNameParts.length >= 2;
  const emailValid = isValidEmail(form.email);
  const phoneValidation = validatePhoneNumber(form.country, form.phoneCountry, form.phone);
  const phoneValid = phoneValidation.valid;

  const stateRequired = isStateRequiredForCountry(form.country);
  const shippingComplete = Boolean(
    emailValid &&
      fullNameValid &&
      phoneValid &&
      form.address.trim() &&
      form.city.trim() &&
      form.postalCode.trim() &&
      form.country.trim() &&
      (!stateRequired || form.state.trim() || form.stateCode.trim()) &&
      !productAvailability.loading &&
      (step === "shipping" || printFilesReady) &&
      !hasAvailabilityBlock,
  );

  const canPay =
    shippingComplete &&
    items.length > 0 &&
    !productAvailability.loading &&
    productAvailability.available &&
    Boolean(validatedShippingMethods?.length) &&
    Boolean(selectedShippingMethod?.id);

  useEffect(() => {
    if (step === "payment" && !selectedShippingMethod?.id) {
      setStep("review");
    }
  }, [selectedShippingMethod?.id, step]);

  const fetchVariantsForItems = useCallback(async (cartItems: CartItem[]) => {
    const lookupIds = Array.from(new Set(cartItems.flatMap((item) => getVariantLookupProductIds(item))));
    if (!lookupIds.length) return;

    const entries = await Promise.all(
      lookupIds.map(async (productId) => {
        try {
          const res = await fetch(`/api/product-variants?productId=${encodeURIComponent(productId)}`, {
            cache: "no-store",
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) return [productId, []] as const;
          return [productId, safeArray<CartVariant>(data?.variants)] as const;
        } catch {
          return [productId, []] as const;
        }
      }),
    );

    setVariantMap((current) => {
      const next = { ...current };
      entries.forEach(([productId, variants]) => {
        next[productId] = [...variants];
      });
      return next;
    });
  }, []);

  const loadCart = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background === true;
    if (!background) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch("/api/cart", { method: "GET", cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error loading cart");
      const nextItems = safeArray<CartItem>(data?.items);
      setItems((current) => mergeCartItemsPreservingPreview(current, nextItems));
      void fetchVariantsForItems(nextItems);
    } catch {
      if (!background) {
        setItems([]);
        setError("We could not load your cart. Please try again.");
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [fetchVariantsForItems]);

  const prepareCheckoutAssets = useCallback(async () => {
    if (!items.some((item) => isCustomDesignItem(item))) return;

    const requestKey = items
      .map((item) => [
        item.user_product_id ?? item.userProductId ?? item.design_id ?? item.designId ?? item.id,
        item.design_data && typeof item.design_data === "object"
          ? (item.design_data as Record<string, unknown>).printFileStatus ?? (item.design_data as Record<string, unknown>).printFileRunId ?? null
          : null,
        item.print_files && typeof item.print_files === "object"
          ? (item.print_files as Record<string, unknown>).status ?? null
          : null,
      ].join(":"))
      .join("|");

    if (requestKey === prepareAssetsRequestKey.current) return;
    prepareAssetsRequestKey.current = requestKey;

    try {
      await fetch("/api/checkout/prepare-assets", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Best-effort prefetch only.
    }
  }, [items]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (!items.length) return;
    void prepareCheckoutAssets();
  }, [items, step, prepareCheckoutAssets]);

  useEffect(() => {
    const shouldPoll = items.some((item) => {
      if (!isCustomDesignItem(item)) return false;
      const thumbnailState = resolveThumbnailReadiness(item);
      return thumbnailState === "pending" || thumbnailState === "processing" || thumbnailState === "missing";
    });

    if (!shouldPoll) return;

    const intervalId = window.setInterval(() => {
      void loadCart({ background: true });
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [items, loadCart]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(form));
    } catch {
      // Session persistence is a best-effort UX enhancement.
    }
  }, [form]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHECKOUT_STEP_SESSION_KEY, step);
    } catch {
      // Session persistence is a best-effort UX enhancement.
    }
  }, [step]);


  useEffect(() => {
    if (availabilityLookupTimer.current) clearTimeout(availabilityLookupTimer.current);
    availabilityAbortController.current?.abort();

    if (availabilityRequestSignatureRef.current === availabilityRequestSignature) {
      return;
    }

    if (variantMutationPendingCount > 0) {
      setProductAvailability((current) => ({
        ...current,
        loading: false,
        message: current.message ?? null,
      }));
      return;
    }

    const country = form.country.trim();
    const countryData = resolveCheckoutCountry(country);

    if (step !== "review") {
      // Keep the quote and selected shipping method intact on the payment step.
      // Clearing them here caused payment to immediately fall back to review.
      if (step === "payment") return;

      setProductAvailability((current) => ({
        ...current,
        loading: false,
        message: null,
      }));
      return;
    }

    if (loading) {
      setProductAvailability((current) => ({
        ...current,
        loading: false,
        checked: false,
        message: null,
      }));
      return;
    }

    if (!items.length) {
      setProductAvailability({
        loading: false,
        checked: false,
        configured: false,
        available: true,
        unavailableItems: [],
        message: null,
      });
      return;
    }

    if (!hasCompleteShippingAddress) {
      setProductAvailability({
        loading: false,
        checked: false,
        configured: false,
        available: true,
        unavailableItems: [],
        message: "Complete your shipping address in the previous step.",
      });
      return;
    }

    if (!checkoutAvailabilityItemsReady) {
      setProductAvailability({
        loading: false,
        checked: false,
        configured: false,
        available: true,
        unavailableItems: [],
        message: "Preparing your cart items...",
      });
      return;
    }

    if (printFilesPending) {
      setProductAvailability({
        loading: false,
        checked: false,
        configured: false,
        available: true,
        unavailableItems: [],
        message: "Preparing your design for printing...",
      });
      return;
    }

    availabilityLookupTimer.current = setTimeout(async () => {
      const requestId = ++availabilityRequestId.current;
      const controller = new AbortController();
      availabilityAbortController.current = controller;
      availabilityRequestSignatureRef.current = availabilityRequestSignature;

      setProductAvailability((current) => ({ ...current, loading: true, message: null }));

      try {
        const res = await fetch("/api/checkout/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Ryfio-Availability-Source": "checkout-review",
          },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: `${form.phoneCountry}${form.phone.replace(/^\+/, "").replace(/\s/g, "")}`,
            country,
            countryIso: countryData?.iso ?? null,
            addressLine1: form.address.trim(),
            addressLine2: form.apartment.trim() || null,
            city: form.city.trim(),
            postalCode: form.postalCode.trim(),
            state: form.state.trim() || form.stateCode.trim() || null,
            stateCode: form.stateCode.trim() || form.state.trim() || null,
            currency: "EUR",
            items: checkoutAvailabilityItems,
          }),
        });

        if (requestId !== availabilityRequestId.current) return;

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Availability check failed");

        const methods = safeArray<CheckoutShippingMethod>(data?.shippingMethods).filter((method) => Boolean(method.id));

        setProductAvailability({
          loading: false,
          checked: true,
          configured: Boolean(data?.configured),
          available: data?.available !== false,
          country: data?.country ?? country,
          countryIso: data?.countryIso ?? countryData?.iso ?? null,
          shippingMethods: methods,
          unavailableItems: safeArray<ProductAvailabilityItem>(data?.unavailableItems),
          message: data?.message ?? null,
        });

        if (methods.length) {
          setForm((prev) => {
            if (methods.some((method) => method.id === prev.shippingMethod)) return prev;
            const cheapest = [...methods].sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))[0];
            return cheapest ? { ...prev, shippingMethod: cheapest.id } : prev;
          });
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== availabilityRequestId.current) return;
        setProductAvailability({
          loading: false,
          checked: true,
          configured: false,
          available: false,
          country,
          countryIso: countryData?.iso ?? null,
          unavailableItems: [],
          message: error instanceof Error && error.name === "AbortError"
            ? "Calculating delivery options..."
            : "We couldn't calculate shipping. Check the address and try again.",
        });
      }
    }, 500);

    return () => {
      if (availabilityLookupTimer.current) clearTimeout(availabilityLookupTimer.current);
      availabilityAbortController.current?.abort();
    };
  }, [availabilityRequestSignature, checkoutAvailabilityItems, checkoutAvailabilityItemsReady, items.length, loading, printFilesPending, step, variantMutationPendingCount]);

  const updateField = (key: keyof CheckoutForm, value: string) => {
    if (key === "address") {
      selectedAddressLock.current = "";
      suppressAddressLookup.current = false;
      if (!addressSessionToken.current) addressSessionToken.current = createAddressSessionToken();
    }

    if (key === "address" || key === "country" || key === "postalCode" || key === "city" || key === "state" || key === "stateCode") {
      setShippingMethodSelection(null);
      setDraftOrderId(null);
    }

    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "country" && value ? { phoneCountry: getCountryCode(value) } : null),
      ...(key === "country" && value ? { state: "", stateCode: "" } : {}),
    }));
  };


  const updatePhone = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("+")) {
      const digits = normalizeDigits(trimmed);
      const countryMatch = [...GELATO_COUNTRIES]
        .sort((a, b) => b.code.length - a.code.length)
        .find((item) => digits.startsWith(item.code.replace(/\D/g, "")));

      if (countryMatch) {
        const dialDigits = countryMatch.code.replace(/\D/g, "");
        setForm((prev) => ({
          ...prev,
          phoneCountry: countryMatch.code,
          country: prev.country || countryMatch.country,
          phone: digits.slice(dialDigits.length),
        }));
        return;
      }
    }

    updateField("phone", value.replace(/[^\d\s]/g, ""));
  };

  // Postal code no longer triggers a separate suggestion box.
  // The street autocomplete is the single source of truth, so the user selects once.

  useEffect(() => {
    const query = form.address.trim();
    if (addressLookupTimer.current) clearTimeout(addressLookupTimer.current);

    if (suppressAddressLookup.current) {
      suppressAddressLookup.current = false;
      setAddressSuggestions([]);
      return;
    }

    if (query.length < 3 || (selectedAddressLock.current && query === selectedAddressLock.current)) {
      setAddressSuggestions([]);
      setAddressSearching(false);
      return;
    }

    addressLookupTimer.current = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const params = new URLSearchParams({ input: query, sessionToken: addressSessionToken.current });
        if (form.country) params.set("country", form.country);
        const res = await fetch(`/api/maps/autocomplete?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setAddressSuggestions([]);
          return;
        }
        setAddressSuggestions(safeArray<AddressSuggestion>(data?.suggestions).slice(0, 6));
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSearching(false);
      }
    }, 280);

    return () => {
      if (addressLookupTimer.current) clearTimeout(addressLookupTimer.current);
    };
  }, [form.address, form.country]);

  const applyAddressSuggestion = async (suggestion = addressSuggestion) => {
    if (!suggestion) return;
    setAddressSearching(true);

    try {
      let resolved = suggestion;
      if (suggestion.placeId) {
        const params = new URLSearchParams({ placeId: suggestion.placeId, sessionToken: addressSessionToken.current });
        const res = await fetch(`/api/maps/autocomplete?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.address) resolved = data.address as AddressSuggestion;
      }

      const detectedCountry = resolveCheckoutCountry(resolved.country);
      const nextCountry = detectedCountry?.country || form.country;
      const nextAddress = resolved.address || resolved.label || form.address;
      selectedAddressLock.current = nextAddress;
      suppressAddressLookup.current = true;
      addressSessionToken.current = createAddressSessionToken();
      const nextState = resolved.state || "";
      const nextStateCode = resolved.stateCode || "";

      setForm((prev) => ({
        ...prev,
        address: nextAddress,
        postalCode: resolved.postalCode || prev.postalCode,
        city: resolved.city || prev.city,
        country: nextCountry,
        phoneCountry: getCountryCode(nextCountry),
        state: nextState,
        stateCode: nextStateCode,
      }));
    } catch {
      const fallbackAddress = suggestion.address || suggestion.label || form.address;
      selectedAddressLock.current = fallbackAddress;
      suppressAddressLookup.current = true;
      addressSessionToken.current = createAddressSessionToken();
      setForm((prev) => ({
        ...prev,
        address: fallbackAddress,
        postalCode: suggestion.postalCode || prev.postalCode,
        city: suggestion.city || prev.city,
        state: suggestion.state || prev.state,
        stateCode: suggestion.stateCode || prev.stateCode,
      }));
    } finally {
      setAddressSuggestions([]);
      setAddressSuggestion(null);
      setAddressSearching(false);
    }
  };

  const getItemVariants = (item: CartItem) => {
    const merged = [
      ...getVariantLookupProductIds(item).flatMap((productId) => safeArray<CartVariant>(variantMap[productId])),
      ...safeArray<CartVariant>(item.product?.variants),
      ...safeArray<CartVariant>(item.availableVariants),
      ...safeArray<CartVariant>(item.available_variants),
      ...safeArray<CartVariant>(item.variants),
      ...(item.selectedVariant ? [item.selectedVariant] : []),
    ];

    const byId = new Map<string, CartVariant>();

    merged.forEach((variant) => {
      const id = variantId(variant);
      if (!id) return;
      const current = byId.get(id);
      byId.set(id, current ? { ...current, ...variant, product_color: variant.product_color ?? current.product_color, product_colors: variant.product_colors ?? current.product_colors } : variant);
    });

    return Array.from(byId.values()).sort((a, b) => {
      const colorSort = String(variantColor(a) || "").localeCompare(String(variantColor(b) || ""));
      if (colorSort !== 0) return colorSort;
      return String(variantSize(a) || "").localeCompare(String(variantSize(b) || ""), undefined, { numeric: true });
    });
  };

  const getCurrentVariant = (item: CartItem) => {
    const variants = getItemVariants(item);
    return (
      variants.find((variant) => variantId(variant) === item.variant_id) ||
      variants.find((variant) => variantColor(variant) === item.color && variantSize(variant) === item.size) ||
      variants.find((variant) => variantColor(variant) === item.color) ||
      variants.find((variant) => variantSize(variant) === item.size) ||
      null
    );
  };

  const updateCartItem = async (item: CartItem, payload: Record<string, unknown>) => {
    const previousItems = items;
    setUpdatingItemId(item.id);
    setError(null);

    try {
      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          ...payload,
          countryCode: resolveCheckoutCountry(form.country)?.iso ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error updating item");
      const updatedItem = data?.item ?? data?.data;
      return updatedItem ?? null;
    } catch {
      setItems(previousItems);
      setError("Could not update this item. Please try again.");
      return null;
    } finally {
      setUpdatingItemId(null);
    }
  };

  const changeVariant = async (item: CartItem, selected: CartVariant) => {
    if (removingItemId) return;

    const mutationSeq = ++variantMutationSeqRef.current;
    setVariantMutationPendingCount((count) => count + 1);
    setAvailabilityMutationBlock(mutationSeq);

    const nextColor = variantColor(selected) ?? item.color ?? null;
    const nextSize = variantSize(selected) ?? item.size ?? null;
    const nextVariantId = selected.id || selected.variant_id || item.variant_id || null;
    const customDesign = isCustomDesignItem(item);
    const countryIso = resolveCheckoutCountry(form.country)?.iso ?? null;
    const currentVariant = getCurrentVariant(item);
    const currentSecondPrintCharge = customSecondPrintCharge(
      item,
      currentVariant,
      countryIso,
      item.currency || "EUR",
    );
    const nextSecondPrintCharge = customSecondPrintCharge(
      item,
      selected,
      countryIso,
      item.currency || "EUR",
    );
    const nextPrice = customDesign
      ? variantPrice(
          selected,
          Math.max(0, (Number(item.price) || 0) - currentSecondPrintCharge),
        ) + nextSecondPrintCharge
      : variantPrice(selected, Math.max(0, Number(item.price) || 0));
    const nextImage = customDesign
      ? item.image || variantImage(selected) || null
      : variantImage(selected) || item.image || null;
    const nextSku = variantSku(selected) || item.sku || null;
    const nextProductColorId = variantProductColorId(selected) || item.product_color_id || null;
    const nextProductUid =
      selected.gelato_product_uid ||
      selected.gelatoProductUid ||
      selected.product_uid ||
      selected.productUid ||
      selected.product_uid_v4 ||
      selected.productUidV4 ||
      selected.gelato_product_uid_v4 ||
      selected.gelatoProductUidV4 ||
      item.gelato_product_uid ||
      item.gelatoProductUid ||
      item.product_uid ||
      item.productUid ||
      item.product_uid_v4 ||
      item.productUidV4 ||
      item.gelato_product_uid_v4 ||
      item.gelatoProductUidV4 ||
      null;

    try {
      const confirmedItem = await updateCartItem(item, {
        variantId: nextVariantId,
        variant_id: nextVariantId,
        product_color_id: nextProductColorId,
        product_uid: nextProductUid,
        gelato_product_uid: nextProductUid,
        color: nextColor,
        size: nextSize,
        sku: nextSku,
        image: nextImage,
        price: nextPrice,
      });

      if (mutationSeq !== variantMutationSeqRef.current) return;

      if (!confirmedItem) {
        throw new Error("No updated item returned");
      }

      const confirmedVariantId =
        cleanUuid((confirmedItem as CartItem).variant_id) ||
        nextVariantId ||
        null;
      const confirmedProductUid =
        (confirmedItem as CartItem).product_uid ||
        (confirmedItem as CartItem).productUid ||
        (confirmedItem as CartItem).gelato_product_uid ||
        (confirmedItem as CartItem).gelatoProductUid ||
        nextProductUid ||
        null;
      const confirmedProductColorId =
        variantProductColorId(selected) ||
        (confirmedItem as CartItem).product_color_id ||
        nextProductColorId;
      const confirmedColor = (confirmedItem as CartItem).color ?? nextColor;
      const confirmedSize = (confirmedItem as CartItem).size ?? nextSize;
      const confirmedSku = (confirmedItem as CartItem).sku ?? nextSku;
      const confirmedImage = (confirmedItem as CartItem).image ?? nextImage ?? null;
      const confirmedPrice = customDesign
        ? variantPrice(
            selected,
            Math.max(0, (Number(item.price) || 0) - currentSecondPrintCharge),
          ) + nextSecondPrintCharge
        : variantPrice(selected, Math.max(0, Number(item.price) || 0));

      console.info("[checkout:variant-mutation]", {
        mutationSeq,
        requestedVariant: {
          variantId: nextVariantId,
          productId: getCartProductId(item),
          productUid: nextProductUid,
          color: nextColor,
          size: nextSize,
        },
        confirmedVariant: {
          variantId: confirmedVariantId,
          productId: getCartProductId(item),
          productUid: confirmedProductUid,
          color: confirmedColor,
          size: confirmedSize,
        },
      });

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id && mutationSeq === variantMutationSeqRef.current
            ? {
                ...entry,
                variant_id: confirmedVariantId,
                color: confirmedColor,
                size: confirmedSize,
                price: confirmedPrice,
                image: confirmedImage,
                sku: confirmedSku,
                product_color_id: confirmedProductColorId,
                product_uid: confirmedProductUid,
                gelato_product_uid: confirmedProductUid,
                productUid: confirmedProductUid,
                gelatoProductUid: confirmedProductUid,
                selectedVariant: selected,
              }
            : entry,
        ),
      );

      setAvailabilityRefreshKey((value) => value + 1);
    } finally {
      if (mutationSeq === variantMutationSeqRef.current) {
        setVariantMutationPendingCount((count) => Math.max(0, count - 1));
        setAvailabilityMutationBlock((current) => (current === mutationSeq ? 0 : current));
      } else {
        setVariantMutationPendingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const changeVariantByColor = (item: CartItem, color: string | null) => {
    const variants = getItemVariants(item);
    const current = getCurrentVariant(item);
    const currentSize = current ? variantSize(current) : item.size;
    const sameSize = variants.filter((variant) => variantColor(variant) === color && variantSize(variant) === currentSize);
    const sameColor = variants.filter((variant) => variantColor(variant) === color);
    const selected = sameSize.find(isVariantAvailable) || sameSize[0] || sameColor.find(isVariantAvailable) || sameColor[0] || null;
    if (selected) void changeVariant(item, selected);
  };

  const changeVariantBySize = (item: CartItem, size: string | null) => {
    const variants = getItemVariants(item);
    const current = getCurrentVariant(item);
    const currentColor = current ? variantColor(current) : item.color;
    const sameColor = variants.filter((variant) => variantSize(variant) === size && variantColor(variant) === currentColor);
    const sameSize = variants.filter((variant) => variantSize(variant) === size);
    const selected = sameColor.find(isVariantAvailable) || sameColor[0] || sameSize.find(isVariantAvailable) || sameSize[0] || null;
    if (selected) void changeVariant(item, selected);
  };

  const changeQuantity = async (itemId: string, nextQuantity: number) => {
    if (nextQuantity < 1 || updatingItemId || removingItemId) return;
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    setItems((current) => current.map((entry) => (entry.id === itemId ? { ...entry, quantity: nextQuantity } : entry)));
    await updateCartItem(item, { quantity: nextQuantity });
  };

  const removeItem = async (itemId: string) => {
    if (updatingItemId || removingItemId) return;
    const previousItems = items;
    setRemovingItemId(itemId);
    setItems((current) => current.filter((item) => item.id !== itemId));

    try {
      const res = await fetch("/api/cart/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error removing item");
    } catch {
      setItems(previousItems);
      setError("Could not remove this item. Please try again.");
    } finally {
      setRemovingItemId(null);
    }
  };

  useEffect(() => {
    setShippingMethodSelection((current) => {
      const active = shippingMethodsForDisplay?.find((method) => method.id === current?.id) ?? null;
      if (!active) return current;
      return active;
    });
  }, [shippingMethodsForDisplay]);


  // Payload mínimo para pagamento. O servidor recebe apenas os IDs do carrinho
  // e recalcula produtos, variantes, quantidades, preços e envio.
  const buildSecureCheckoutPayload = (): SecureCheckoutRequestPayload =>
    createSecureCheckoutRequestPayload(form, items);

  const handleCheckout = async () => {
    if (!canPay || submitting) return;
    if (hasAvailabilityBlock) {
      setError("Some products are not available for this delivery country. Change country or product variant before paying.");
      return;
    }
    if (!selectedShippingMethod?.id || !selectedShippingMethod.shipmentMethodUid) {
      setError("Please select a shipping method.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts.slice(0, -1).join(" ");
      const lastName = nameParts.at(-1) ?? "";

      if (!firstName || !lastName) {
        throw new Error("Enter your first and last name.");
      }

      const draftRes = await fetch("/api/checkout/draft-order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          cartItemIds: items.map((item) => item.id),
          address: {
            firstName,
            lastName,
            addressLine1: form.address,
            addressLine2: form.apartment || null,
            city: form.city,
            state: form.state.trim() || form.stateCode.trim() || null,
            stateCode: form.stateCode.trim() || form.state.trim() || null,
            postalCode: form.postalCode,
            countryCode: form.country,
            email: form.email,
            phone: `${form.phoneCountry}${form.phone.replace(/^\+/, "").replace(/\s/g, "")}`,
          },
          customer: {
            fullName: form.fullName,
            email: form.email,
            phone: `${form.phoneCountry}${form.phone.replace(/^\+/, "").replace(/\s/g, "")}`,
            country: form.country,
            countryIso: resolveCheckoutCountry(form.country)?.iso ?? null,
            address: form.address,
            apartment: form.apartment,
            city: form.city,
            state: form.state.trim() || form.stateCode.trim() || null,
            stateCode: form.stateCode.trim() || form.state.trim() || null,
            postalCode: form.postalCode,
          },
          shippingMethod: selectedShippingMethod,
        }),
      });
      const draftData = await draftRes.json().catch(() => null);
      if (!draftRes.ok || !draftData?.success) {
        throw new Error(draftData?.message || draftData?.error || "Failed to prepare draft order");
      }
      setDraftOrderId(draftData.draftOrderId ?? null);

      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildSecureCheckoutPayload(), draftOrderId: draftData.draftOrderId }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const serverMessage = data?.details || data?.error || "Error creating checkout";
        const invalidItems = Array.isArray(data?.invalidItems) ? ` ${JSON.stringify(data.invalidItems)}` : "";
        throw new Error(`${serverMessage}${invalidItems}`);
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      router.push(data?.orderId ? `/checkout/success?order=${data.orderId}` : "/checkout/success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Checkout is not connected yet. Please check your /api/checkout route.");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === "shipping" && shippingComplete) setStep("review");
    if (step === "review" && items.length > 0 && selectedShippingMethod?.id) setStep("payment");
  };

  const stepIndex = step === "shipping" ? 1 : step === "review" ? 2 : 3;

  return (
    <main data-ryfio-checkout-page className="fixed inset-0 z-[9999] min-h-dvh overflow-y-auto bg-[#04040a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(168,85,247,0.2),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_26%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1080px] flex-col px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <header className="mb-4 flex items-center justify-between gap-2 sm:mb-6 sm:gap-4">
          <button type="button" onClick={() => router.back()} className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 text-sm font-black text-white/80 transition active:scale-[0.98] hover:bg-white/[0.06]">
            <ArrowLeft size={16} /> Back
          </button>
          <NavbarBrand />
        </header>

        <section className="mb-5 sm:mb-7">
          <p className="text-[11px] font-black uppercase tracking-[0.38em] text-purple-200/80">RYFIO CHECKOUT</p>
          <h1 className="mt-3 text-[clamp(2.5rem,5vw,4.4rem)] font-black tracking-[-0.09em] leading-[0.95]">Finish your order</h1>
        </section>

        <nav className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:mb-8">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["shipping", "Shipping"],
              ["review", "Review"],
              ["payment", "Payment"],
            ].map(([id, label], index) => {
              const metaIndex = index + 1;
              const active = step === id;
              const done = metaIndex < stepIndex;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === "shipping") setStep("shipping");
                    if (id === "review" && shippingComplete) setStep("review");
                    if (id === "payment" && shippingComplete && items.length > 0) setStep("payment");
                  }}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                    active ? "bg-white text-[#0b0b12] shadow-[0_8px_24px_rgba(255,255,255,0.18)]" : done ? "text-white/88" : "text-white/38"
                  }`}
                >
                  {done ? <Check size={14} /> : <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-[10px]">{metaIndex}</span>}
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        {error && <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div>}

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-8">
          <section className="min-w-0">
            {step === "shipping" && (
              <div className="mx-auto max-w-[760px]">
                <div className="mb-6 sm:mb-7">
                  <h2 className="text-2xl font-black tracking-[-0.06em]">Shipping details</h2>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-white/45">Type your street and choose the right result. The checkout fills city, postal code and country when the API can detect them.</p>
                </div>
                <div className="space-y-6 sm:space-y-7">
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <label className="sm:col-span-2">
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Mail size={13} /> Email</span>
                      <input className={fieldClass} type="email" autoComplete="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(form.email.trim()) && !emailValid} />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">Full name</span>
                      <input className={fieldClass} autoComplete="name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="First and last name" />
                    </label>
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Phone size={13} /> Phone</span>
                      <div className="flex gap-2">
                        <select className="h-12 w-[102px] rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-black text-white outline-none focus:border-purple-300/80 [&_option]:bg-[#0b0b13] [&_option]:text-white" value={form.phoneCountry} onChange={(e) => updateField("phoneCountry", e.target.value)} aria-label="Phone country code" style={{ colorScheme: "dark" }}>
                          {GELATO_COUNTRIES.map((item) => <option key={`${item.iso}-${item.code}`} value={item.code} className="bg-[#0b0b13] text-white">{item.code} · {item.iso}</option>)}
                        </select>
                        <input className={fieldClass} inputMode="tel" autoComplete="tel-national" required value={form.phone} onChange={(e) => updatePhone(e.target.value)} placeholder={phoneValidation.rule.example} aria-invalid={Boolean(form.phone.trim()) && !phoneValid} />
                      </div>
                    </label>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <label>
                      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-white/55"><span>Delivery country</span>{productAvailability.loading ? <span className="flex items-center gap-1 text-[10px] text-white/35"><Loader2 size={11} className="animate-spin" /> checking</span> : null}</span>
                      <select className={selectClass} value={form.country} onChange={(e) => updateField("country", e.target.value)} autoComplete="country-name" style={{ colorScheme: "dark" }}>
                        <option value="" className="bg-[#0b0b13] text-white">Auto-detect from address</option>
                        {GELATO_COUNTRIES.map((item) => <option key={item.iso} value={item.country} className="bg-[#0b0b13] text-white">{item.country}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Search size={13} /> Postal code</span>
                      <div className="relative">
                        <input className={`${fieldClass} pr-9`} autoComplete="postal-code" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} placeholder={getPostalPlaceholder(form.country)} />
                        {addressSearching && <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 animate-spin text-white/35" size={16} />}
                      </div>
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-white/55"><span>Street and door number</span><span className="text-[10px] text-white/35">Editable after selection</span></span>
                      <div className="relative">
                        <input className={`${fieldClass} pr-9`} autoComplete="street-address" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Start typing your street or full address" />
                        {addressSearching && <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 animate-spin text-white/35" size={16} />}
                      </div>
                    </label>
                    {addressSuggestions.length > 0 && (
                      <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]">
                        {addressSuggestions.map((suggestion) => (
                          <button key={suggestion.placeId || suggestion.label} type="button" onClick={() => applyAddressSuggestion(suggestion)} className="block w-full border-b border-white/10 px-4 py-3 text-left text-xs font-bold text-white/70 transition last:border-b-0 hover:bg-white/[0.06] hover:text-white">
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-xs font-black text-white/55">Apartment, floor, door or company - optional</span>
                      <input className={fieldClass} autoComplete="address-line2" value={form.apartment} onChange={(e) => updateField("apartment", e.target.value)} placeholder="Apartment, floor, door, building, company" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">City</span>
                      <input className={fieldClass} autoComplete="address-level2" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">{getAddressStateLabel(resolveCheckoutCountry(form.country)?.iso ?? form.country)}</span>
                      <input className={fieldClass} autoComplete="address-level1" value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder={stateRequired ? "Required when needed" : "Optional"} aria-required={stateRequired} />
                    </label>
                  </div>
                  <div className="h-px bg-white/10" />
                  <button type="button" disabled={!shippingComplete} onClick={goNext} className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#080812] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 lg:hidden">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="mx-auto max-w-[760px]">
                <div className="mb-6 sm:mb-7">
                  <h2 className="text-2xl font-black tracking-[-0.06em]">Review products</h2>
                  <p className="mt-2 text-sm font-medium text-white/45">Change color, size and quantity before payment.</p>
                </div>
                {loading ? (
                  <div className="grid h-64 place-items-center text-sm font-semibold text-white/45"><span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Loading cart...</span></div>
                ) : items.length === 0 ? (
                  <EmptyCart onAdd={() => router.push("/stepcategory")} />
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => {
                      const variants = getItemVariants(item);
                      const current = getCurrentVariant(item);
                      const currentColor = current ? variantColor(current) : item.color;
                      const currentSize = current ? variantSize(current) : item.size;
                      const quantity = Math.max(1, Number(item.quantity) || 1);
                      const customDesign = isCustomDesignItem(item);
                      const checkoutCountryIso = resolveCheckoutCountry(form.country)?.iso ?? null;
                      const secondPrintCharge = customSecondPrintCharge(item, current, checkoutCountryIso, item.currency || "EUR");
                      const price = customDesign && checkoutCountryIso ? (current ? variantPrice(current, Math.max(0, Number(item.price) || 0)) : Math.max(0, (Number(item.price) || 0) - secondPrintCharge)) + secondPrintCharge : customDesign ? Math.max(0, Number(item.price) || 0) : variantPrice(current, Math.max(0, Number(item.price) || 0));
                      const busy = updatingItemId === item.id || removingItemId === item.id;
                      const previewImages = resolvePreviewImageSources(item);

                      const colorGroups = Array.from(
                        variants.reduce((map, variant) => {
                          const color = variantColor(variant);
                          if (!color) return map;
                          const list = map.get(color) ?? [];
                          list.push(variant);
                          map.set(color, list);
                          return map;
                        }, new Map<string, CartVariant[]>()),
                      ).map(([color, list]) => {
                        const sameSize = list.filter((variant) => variantSize(variant) === currentSize);
                        const selected = sameSize.find(isVariantAvailable) || sameSize[0] || list.find(isVariantAvailable) || list[0];
                        return { color, variant: selected };
                      });

                      const visibleSizes = Array.from(
                        (currentColor ? variants.filter((variant) => variantColor(variant) === currentColor) : variants).reduce((map, variant) => {
                          const size = variantSize(variant);
                          if (!size) return map;
                          const existing = map.get(size);
                          const preferNew = !existing || (variantColor(variant) === currentColor && variantStock(variant) > variantStock(existing));
                          if (preferNew) map.set(size, variant);
                          return map;
                        }, new Map<string, CartVariant>()),
                      ).map(([, variant]) => variant);

                      return (
                        <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-5">
                          <div className="grid gap-5 lg:grid-cols-[minmax(210px,240px)_minmax(0,1fr)] lg:items-start">
                            <div className="space-y-4">
                              <ProductPreviewImage
                                title={item.title}
                                frontImage={previewImages.front}
                                backImage={previewImages.back}
                                className="h-[220px] w-full sm:h-[240px] sm:w-full"
                              />
                              <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Color</p>
                                <div className="grid grid-cols-8 gap-1.5">
                                  {colorGroups.length > 0 ? colorGroups.slice(0, 16).map(({ color, variant }) => {
                                    const active = color === currentColor;
                                    return (
                                      <button key={color} type="button" disabled={busy} onClick={() => changeVariantByColor(item, color)} className={`grid h-9 w-9 place-items-center rounded-md border transition active:scale-95 disabled:opacity-35 ${active ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.12)]" : "border-white/10 bg-white/[0.03]"}`} aria-label={`Select color ${color}`}>
                                        <span className="h-6 w-6 rounded-sm border border-black/20" style={String(variantHex(variant)).includes("gradient(") ? { backgroundImage: variantHex(variant) } : { backgroundColor: variantHex(variant) }} />
                                      </button>
                                    );
                                  }) : <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black text-white/70">{currentColor || "Color"}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-xl font-black leading-[1.06] sm:text-2xl">{item.title}</p>
                                  <p className="mt-1 text-sm text-white/52">{[currentColor, currentSize].filter(Boolean).join(" • ") || "Custom product"}</p>
                                  <p className="mt-1 text-xs text-white/34">Variant: {[currentColor, currentSize].filter(Boolean).join(" / ") || "Selected variant"}</p>
                                </div>
                                <button type="button" disabled={busy} onClick={() => removeItem(item.id)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition hover:bg-white/[0.08] disabled:opacity-35" aria-label="Remove item">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="mt-4 border-t border-white/10 pt-4">
                                <p className="text-2xl font-black tracking-[-0.05em]">{money(price)}</p>
                                <p className="text-xs text-white/38">Excl. tax</p>
                              </div>
                              {visibleSizes.length > 0 && (
                                <div className="mt-5">
                                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Size</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {visibleSizes.map((variant) => {
                                      const size = variantSize(variant);
                                      const active = size === currentSize;
                                      const available = isVariantAvailable(variant);
                                      return (
                                        <button key={variantId(variant)} type="button" disabled={busy || !available} onClick={() => changeVariantBySize(item, size)} className={`min-w-10 rounded-none border px-2.5 py-1.5 text-center transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "border-[#a855f7] bg-[#a855f7] text-white" : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]"}`}>
                                          <span className="block text-sm font-black leading-4">{size}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div className="mt-5">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Quantity</p>
                                <div className="inline-flex items-center rounded-none border border-white/10 bg-white/[0.03] p-0.5">
                                  <button type="button" onClick={() => changeQuantity(item.id, quantity - 1)} disabled={quantity <= 1 || busy} className="grid h-9 w-9 place-items-center rounded-none text-white/70 transition hover:bg-white/[0.06] disabled:opacity-35" aria-label="Decrease quantity"><Minus size={13} /></button>
                                  <span className="grid h-9 min-w-10 place-items-center rounded-none px-2 text-sm font-black">{quantity}</span>
                                  <button type="button" onClick={() => changeQuantity(item.id, quantity + 1)} disabled={busy} className="grid h-9 w-9 place-items-center rounded-none text-white/70 transition hover:bg-white/[0.06] disabled:opacity-35" aria-label="Increase quantity"><Plus size={13} /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
                {step === "review" && (
                  <div className="mt-6 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.025] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">Secure & flexible payments</p>
                    {printFilesPending ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                        <p className="text-sm font-black text-white">Preparing your design for printing...</p>
                        <p className="mt-2 text-sm font-medium text-white/45">Delivery options will appear automatically.</p>
                      </div>
                    ) : productAvailability.loading ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="h-[110px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                        <div className="h-[110px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
                      </div>
                    ) : productAvailability.checked && productAvailability.available && shippingMethodsForDisplay?.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {shippingMethodsForDisplay.map((method, index) => {
                          const active = selectedShippingMethod?.id === method.id;
                          const isCheapest = index === 0;
                          const isFastest = index === shippingMethodsForDisplay.length - 1;
                          return (
                            <button key={method.id} type="button" onClick={() => {
                              setSelectedShippingMethodId(method.id);
                              setShippingMethodSelection(method);
                              setForm((prev) => ({ ...prev, shippingMethod: method.id }));
                            }} className={`rounded-[24px] border px-4 py-4 text-left transition active:scale-[0.99] ${active ? "border-purple-300/50 bg-purple-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                              <span className="flex items-start justify-between gap-3">
                                <span className="min-w-0">
                                  <span className="block text-sm font-black leading-5">{method.name}</span>
                                  <span className="mt-1 block text-sm font-bold text-white/80">{formatShippingCurrency(method.price ?? null, method.currency)}</span>
                                </span>
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/20">
                                  <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-purple-300" : "bg-transparent"}`} />
                                </span>
                              </span>
                              <span className="mt-2 block text-xs font-medium text-white/45">{`Estimated delivery: ${formatEstimatedDelivery(method.minDays || method.maxDays ? `${method.minDays ?? ""} - ${method.maxDays ?? ""}` : null)}`}</span>
                              <div className="mt-2 flex items-center gap-2">
                                {isCheapest ? <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Cheapest</span> : null}
                                {isFastest ? <span className="rounded-full bg-purple-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-purple-100">Fastest</span> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : productAvailability.checked && !productAvailability.available ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm font-semibold text-white/55">{productAvailability.message || "This product cannot currently be delivered to this address."}</div>
                    ) : productAvailability.checked && productAvailability.available && !shippingMethodsForDisplay?.length ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm font-semibold text-white/55">{productAvailability.message || "No delivery methods are available for this address."}</div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm font-semibold text-white/45">{productAvailability.message || "Complete your shipping address in the previous step."}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === "payment" && (
              <div className="mx-auto max-w-[760px]">
                <div className="mb-6 sm:mb-7">
                  <h2 className="text-2xl font-black tracking-[-0.06em]">Payment</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/45">You are one step away. Confirm the total and continue to payment.</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/15 text-purple-200"><CreditCard size={21} /></div>
                      <div>
                        <p className="text-sm font-black">Card payment</p>
                        <p className="mt-1 text-xs font-semibold text-white/40">Handled by your secure checkout route.</p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">Secure & flexible payments</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <CardBrandIcon brand="visa" />
                        <CardBrandIcon brand="mastercard" />
                        <CardBrandIcon brand="apple-pay" />
                        <CardBrandIcon brand="google-pay" />
                        <CardBrandIcon brand="klarna" />
                        <CardBrandIcon brand="link" />
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-[11px] font-medium text-white/45"><Lock size={12} /> Your payment information is encrypted and secure.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Shipping to</p>
                        <p className="mt-2 text-sm font-black">{form.fullName}</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-white/45">{form.address}{form.apartment ? `, ${form.apartment}` : ""}<br />{form.postalCode} {form.city}<br />{form.country}</p>
                      </div>
                      <button type="button" onClick={() => setStep("shipping")} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/[0.05]">Edit</button>
                    </div>
                  </div>
                  <button type="button" disabled={!canPay || submitting || loading || Boolean(updatingItemId) || Boolean(removingItemId) || !selectedShippingMethod?.id} onClick={handleCheckout} className="flex h-[60px] w-full items-center justify-center gap-2 rounded-full bg-[#8b28ff] text-sm font-black text-white shadow-[0_24px_40px_rgba(139,40,255,0.28)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating checkout...</> : <><Lock size={16} /> Pay now {money(total)}</>}
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-4 backdrop-blur-xl sm:rounded-[32px] sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/70">Summary</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">{totalItems} item{totalItems === 1 ? "" : "s"}</h2>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-purple-600/15 text-purple-200"><ShoppingBag size={18} /></div>
              </div>
              <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white/50">Products</span><span className="font-black">{money(subtotal)}</span></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-white/50"><Truck size={15} /> Shipping</span>
                  <span className="font-black">{step === "shipping" || !printFilesReady ? "Calculated in review" : typeof shippingDisplay === "number" ? money(shippingDisplay) : "Select a method"}</span>
                </div>
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white/50">Tax</span><span className="text-right text-xs font-black text-white/45">{taxDisplay}</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex items-end justify-between gap-4"><span className="text-sm font-semibold text-white/50">Total before tax</span><span className="text-3xl font-black tracking-[-0.06em]">{money(totalBeforeTax)}</span></div>
                <p className="pt-1 text-[10px] font-semibold leading-4 text-white/32">Applicable tax is calculated from the delivery country at payment.</p>
              </div>
              <div className="mt-5 hidden lg:block">
                {step !== "payment" ? (
                  <button type="button" disabled={(step === "shipping" && !shippingComplete) || (step === "review" && items.length === 0)} onClick={goNext} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#080812] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight size={15} />
                  </button>
                ) : null}
              </div>
              {shippingComplete && (
                <button type="button" onClick={() => setStep("shipping")} className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white/55 hover:bg-white/[0.05]">
                  <span className="min-w-0"><span className="block text-white/80">{form.city || "Shipping"}</span><span className="line-clamp-1">{form.address}</span></span><ChevronRight size={15} />
                </button>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] font-bold text-white/42">
                <div className="flex items-center gap-1.5"><ShieldCheck size={13} /> Protected</div>
                <div className="flex items-center justify-end gap-1.5"><Check size={13} /> Editable</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[10000] border-t border-white/10 bg-[#05050b]/92 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Total before tax</p>
            <p className="text-xl font-black tracking-[-0.05em]">{money(totalBeforeTax)}</p>
            <p className="text-[10px] font-bold text-white/32">Tax calculated at payment</p>
          </div>
          {step === "payment" ? (
            <button type="button" disabled={!canPay || submitting || loading || Boolean(updatingItemId) || Boolean(removingItemId)} onClick={handleCheckout} className="flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-full bg-[#8b28ff] px-4 text-sm font-black text-white disabled:opacity-40 sm:h-12 sm:min-w-[150px] sm:px-5">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Pay now"}
            </button>
          ) : (
            <button type="button" disabled={(step === "shipping" && !shippingComplete) || (step === "review" && items.length === 0)} onClick={goNext} className="flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#080812] disabled:opacity-40 sm:h-12 sm:min-w-[150px] sm:px-5">
              Continue <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
