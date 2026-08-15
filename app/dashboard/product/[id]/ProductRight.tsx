"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Globe2,
  Minus,
  AlertTriangle,
  Palette,
  Plus,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { COUNTRY_DIALS, resolveCheckoutCountry } from "@/app/checkout/_lib/checkout";

type ShippingMethod = {
  id: string;
  title: string;
  price: number | null;
  estimatedDays: string | null;
};

type ProductAvailabilityStatus = "available" | "unavailable" | "unknown";

function CountryFlag({
  iso,
  country,
}: {
  iso?: string | null;
  country?: string | null;
}) {
  const code = (iso || "").trim().toLowerCase();
  const label = country || iso || "Country";

  if (!code || code.length !== 2) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
      title={label}
    >
      <img
        src={`https://flagcdn.com/${code}.svg`}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function ProductRight({
  product,
  selectedVariant,
}: any) {
  const router = useRouter();
  const title = String(product?.title ?? "Untitled product").trim();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingCountryIso, setShippingCountryIso] = useState("PT");
  const [shippingMenuOpen, setShippingMenuOpen] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<ProductAvailabilityStatus>("unknown");
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const availabilityCacheRef = useRef(new Map<string, ProductAvailabilityStatus>());
  const availabilityRequestIdRef = useRef(0);

  const stock = selectedVariant?.stock ?? null;
  const isOutOfStock = typeof stock === "number" && stock <= 0;

  const price = useMemo(() => {
    const selectedVariantPrice =
      selectedVariant?.price != null ? Number(selectedVariant.price) : null;
    const fallbackPrice = Number(product?.discount_price ?? product?.price ?? 0);

    if (typeof selectedVariantPrice === "number" && Number.isFinite(selectedVariantPrice)) {
      return selectedVariantPrice;
    }

    return Number.isFinite(fallbackPrice) ? fallbackPrice : 0;
  }, [product?.discount_price, product?.price, selectedVariant?.price]);

  const selectedVariantLabel = selectedVariant
    ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") ||
      selectedVariant.sku ||
      "Selected variant"
    : "Choose color and size";

  const originalPrice =
    product?.discount_price && product?.price ? Number(product.price) : null;

  const verifiedReviews = useMemo(() => {
    const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

    return reviews
      .filter((review: any) => review?.verified === true)
      .slice(0, 3);
  }, [product?.reviews]);

  const shippingCountries = COUNTRY_DIALS;
  const selectedShippingCountry = useMemo(() => {
    return (
      shippingCountries.find((country) => country.iso === shippingCountryIso) ||
      resolveCheckoutCountry("Portugal") ||
      shippingCountries[0] ||
      null
    );
  }, [shippingCountryIso, shippingCountries]);

  const shippingPrice = shippingMethods[0]?.price ?? null;
  const shippingEta = shippingMethods[0]?.estimatedDays ?? null;
  const shippingMethodLabel = shippingMethods[0]?.title ?? "Shipping";
  const availabilityVariantId = selectedVariant?.id ? String(selectedVariant.id) : null;
  const availabilityCountryCode = selectedShippingCountry?.iso ?? null;
  const availabilityCacheKey = availabilityVariantId && availabilityCountryCode
    ? `${availabilityVariantId}:${availabilityCountryCode}`
    : null;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    if (typeof stock === "number") {
      setQuantity((prev) => Math.min(stock, prev + 1));
      return;
    }

    setQuantity((prev) => prev + 1);
  };

  useEffect(() => {
    const productCountry =
      resolveCheckoutCountry(product?.shipping_country) ||
      resolveCheckoutCountry(product?.country) ||
      resolveCheckoutCountry(product?.origin_country) ||
      null;

    if (productCountry?.iso) {
      setShippingCountryIso(productCountry.iso);
    }
  }, [product?.shipping_country, product?.country, product?.origin_country]);

  useEffect(() => {
    setShippingMethods([]);
    setShippingAvailable(true);
    setShippingError(null);
    setShippingLoading(false);
  }, [selectedShippingCountry?.iso, selectedVariant?.id]);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      if (!availabilityVariantId || !availabilityCountryCode) {
        setAvailabilityStatus("unknown");
        setAvailabilityChecking(false);
        return;
      }

      if (availabilityCacheKey && availabilityCacheRef.current.has(availabilityCacheKey)) {
        setAvailabilityStatus(availabilityCacheRef.current.get(availabilityCacheKey) ?? "unknown");
        setAvailabilityChecking(false);
        return;
      }

      const requestId = ++availabilityRequestIdRef.current;
      setAvailabilityChecking(true);

      try {
        const response = await fetch("/api/product-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: availabilityVariantId,
            countryCode: availabilityCountryCode,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!active || requestId !== availabilityRequestIdRef.current) return;

        const status: ProductAvailabilityStatus =
          data?.status === "available" || data?.status === "unavailable"
            ? data.status
            : "unknown";

        if (availabilityCacheKey) {
          availabilityCacheRef.current.set(availabilityCacheKey, status);
        }

        setAvailabilityStatus(status);
      } catch {
        if (!active || requestId !== availabilityRequestIdRef.current) return;
        setAvailabilityStatus("unknown");
      } finally {
        if (active && requestId === availabilityRequestIdRef.current) {
          setAvailabilityChecking(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      active = false;
    };
  }, [availabilityCacheKey, availabilityCountryCode, availabilityVariantId]);

  const formatShippingPrice = (value: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getMockup = () => {
    const mockup = String(product?.mockup || "").toLowerCase().trim();

    if (mockup === "tshirt" || mockup === "t-shirt" || mockup === "shirt") {
      return "tshirt";
    }

    if (mockup === "hoodie" || mockup === "hooded" || mockup === "sweatshirt") {
      return "hoodie";
    }

    const value = `${product?.type || ""} ${product?.category || ""} ${
      product?.title || ""
    }`.toLowerCase();

    if (
      value.includes("tshirt") ||
      value.includes("t-shirt") ||
      value.includes("t shirt") ||
      value.includes("tee")
    ) {
      return "tshirt";
    }

    if (
      value.includes("hoodie") ||
      value.includes("hooded") ||
      value.includes("sweatshirt")
    ) {
      return "hoodie";
    }

    return "hoodie";
  };

  const handleStartDesigning = async () => {
    if (!product?.id || loading || availabilityStatus === "unavailable") return;

    if (!selectedVariant) {
      showToast("error", "This product has no available variant.");
      return;
    }

    setLoading(true);

    try {
      const mockup = getMockup();

      const selection = {
        productId: product.id,
        product_id: product.id,
        variantId: selectedVariant.id,
        variant_id: selectedVariant.id,
        selectedVariantId: selectedVariant.id,
        selected_variant_id: selectedVariant.id,
        size: selectedVariant.size ?? null,
        selectedSize: selectedVariant.size ?? null,
        selected_size: selectedVariant.size ?? null,
        color: selectedVariant.color ?? null,
        initialColor: selectedVariant.color ?? null,
        initial_color: selectedVariant.color ?? null,
        colorEditable: true,
        color_editable: true,
        sku: selectedVariant.sku ?? null,
        productColorId: selectedVariant.product_color_id ?? null,
        product_color_id: selectedVariant.product_color_id ?? null,
        title: product?.title ?? null,
        source: "product-page",
        savedAt: new Date().toISOString(),
      };

      try {
        const payload = JSON.stringify(selection);
        window.localStorage.setItem("ryfio:selected-design-variant", payload);
        window.localStorage.setItem("ryfio:design-selection", payload);
        window.localStorage.setItem("ryfio:editor-initial-variant", payload);
        window.sessionStorage.setItem("ryfio:selected-design-variant", payload);
        window.sessionStorage.setItem("ryfio:design-selection", payload);
        window.sessionStorage.setItem("ryfio:editor-initial-variant", payload);
      } catch {
        // Storage can fail in private mode; navigation should still work.
      }

      const params = new URLSearchParams({
        productId: product.id,
        product_id: product.id,
        variantId: selectedVariant.id,
        variant_id: selectedVariant.id,
        selectedVariantId: selectedVariant.id,
        colorEditable: "true",
      });

      if (selectedVariant.size) {
        params.set("size", selectedVariant.size);
        params.set("selectedSize", selectedVariant.size);
      }
      if (selectedVariant.color) {
        params.set("color", selectedVariant.color);
        params.set("initialColor", selectedVariant.color);
      }
      if (selectedVariant.sku) params.set("sku", selectedVariant.sku);
      if (selectedVariant.product_color_id) {
        params.set("productColorId", selectedVariant.product_color_id);
      }

      router.push(`/dashboard/design/${mockup}?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed left-4 right-4 top-24 z-[9999] sm:left-auto sm:right-6 sm:top-28 sm:w-[360px]">
          <div
            className={`rounded-2xl border px-5 py-4 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-[#1b1424] text-emerald-100 shadow-emerald-500/20"
                : "border-red-400/40 bg-[#1b1424] text-red-100 shadow-red-500/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black shadow-lg ${
                  toast.type === "success"
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-black"
                    : "bg-gradient-to-br from-red-400 to-red-500 text-black"
                }`}
              >
                {toast.type === "success" ? "✓" : "!"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black tracking-wide text-white">
                    {toast.type === "success"
                      ? "Added to cart"
                      : "Something went wrong"}
                  </p>

                  {toast.type === "success" && (
                    <span className="rounded-full border border-emerald-300/20 bg-[#1b1424] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                      success
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  {toast.message}
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={`h-full animate-[toastBar_3s_linear_forwards] rounded-full ${
                      toast.type === "success" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes toastBar {
          from {
            width: 100%;
          }

          to {
            width: 0%;
          }
        }
      `}</style>

      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <div className="space-y-2 text-left">
          <h1
            className="max-w-full overflow-hidden text-[1.73rem] uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-[2.13rem] lg:text-[2.66rem]"
            style={{ fontFamily: "var(--font-logo)", textWrap: "balance" }}
          >
            <span className="whitespace-nowrap">{title}</span>
          </h1>

          <p className="max-w-[30rem] text-[11px] font-semibold uppercase tracking-[0.08em] text-white/42 sm:text-[12px]">
            Premium customizable products made for creators, online brands and RYFIO stores.
          </p>
        </div>

        <div className="border border-white/[0.07] bg-[linear-gradient(180deg,#241a31_0%,#191322_100%)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="text-[1.8rem] font-black tracking-tight text-white sm:text-[2.2rem]">
                €{price.toFixed(2)}
              </div>

              {originalPrice && (
                <div className="text-sm text-white/38 line-through">
                  €{originalPrice.toFixed(2)}
                </div>
              )}

              <div className="inline-flex max-w-full items-center gap-1.5 border border-fuchsia-300/24 bg-fuchsia-400/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-fuchsia-50">
                <span className="text-sm leading-none text-fuchsia-300">+</span>
                <span className="truncate">{selectedVariantLabel}</span>
              </div>
            </div>

            <div className="min-w-[9rem] text-right">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/44">
                Available in
              </div>
              <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-white">
                20+ countries
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/52">
              <span
                className={`inline-flex h-3 w-3 rounded-full ${
                  typeof stock === "number" && stock > 0
                    ? "bg-[#22c55e]"
                    : "bg-[#ef4444]"
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/48">
                Quantity
              </span>

              <div className="flex items-center gap-0 border border-white/[0.08] bg-black/10">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || loading}
                  aria-label="Decrease quantity"
                  className="flex h-9 w-9 items-center justify-center text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:bg-white/[0.03]"
                >
                  <Minus size={14} />
                </button>

                <span className="min-w-7 px-2 text-center text-sm font-black text-white">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    loading ||
                    isOutOfStock ||
                    (typeof stock === "number" && quantity >= stock)
                  }
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:bg-white/[0.03]"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-white/[0.08] bg-white px-3 py-3 text-[#111111]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-medium text-[#6b7280]">
              <span>Shipping from</span>
              <span className="grid h-4 w-4 place-items-center border border-[#cfd4dc] text-[9px] leading-none">
                i
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <div className="min-w-0">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Delivery to
              </div>

              <button
                type="button"
                onClick={() => setShippingMenuOpen((prev) => !prev)}
                className="mt-1 flex h-11 w-full items-center justify-between gap-3 border border-[#d8dde5] px-3 text-left text-sm font-semibold text-[#111111]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-base leading-none">
                    <CountryFlag iso={selectedShippingCountry?.iso} country={selectedShippingCountry?.country} />
                  </span>
                  <span className="truncate">
                    {selectedShippingCountry?.country ?? "Portugal"}
                  </span>
                </span>
                <ChevronDown size={15} className="shrink-0 text-[#6b7280]" />
              </button>

              {shippingMenuOpen && (
                <div className="mt-1 max-h-52 overflow-y-auto border border-[#d8dde5] bg-white">
                  {shippingCountries.map((country) => (
                    <button
                      key={country.iso}
                      type="button"
                      onClick={() => {
                        setShippingCountryIso(country.iso);
                        setShippingMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-black/[0.03] ${
                        selectedShippingCountry?.iso === country.iso
                          ? "font-black text-[#111111]"
                          : "text-[#333333]"
                      }`}
                    >
                      <span className="text-base leading-none">
                        <CountryFlag iso={country.iso} country={country.country} />
                      </span>
                      <span className="truncate">{country.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-[8rem] text-right">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                {shippingLoading ? "Calculating" : shippingMethodLabel}
              </div>
              <div className="mt-1 text-[1.45rem] font-black leading-none tracking-[-0.04em] text-[#111111]">
                {shippingLoading ? "…" : formatShippingPrice(shippingPrice)}
              </div>
              <div className="mt-1 text-[10px] font-medium text-[#6b7280]">
                {shippingLoading ? "Please wait" : shippingEta ?? "Estimated at checkout"}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-[#e8ebf1] pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
            {availabilityChecking ? (
              <span className="inline-flex items-center gap-1.5 text-[#6b7280]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6b7280]" />
                CHECKING...
              </span>
            ) : availabilityStatus === "available" ? (
              <span className="inline-flex items-center gap-1.5 text-[#0f9d58]">
                <Check size={12} />
                AVAILABLE
              </span>
            ) : availabilityStatus === "unavailable" ? (
              <span className="text-[#d94660]">UNAVAILABLE</span>
            ) : (
              <span className="text-[#6b7280]">UNABLE TO VERIFY</span>
            )}
          </div>
        </div>

        {availabilityStatus === "unavailable" && (
          <div className="flex w-full items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-[11px] leading-snug text-red-200/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <p>
              This color and size aren&apos;t available for delivery to the selected country.
              Choose another variant or country.
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <button
            type="button"
            disabled={loading || availabilityStatus === "unavailable"}
            onClick={handleStartDesigning}
            className="group relative flex h-[58px] items-center justify-center gap-2 overflow-hidden rounded-none border border-[#22c55e]/28 bg-[linear-gradient(135deg,#03140a_0%,#0b3b1b_34%,#22c55e_100%)] px-4 text-[12px] font-black uppercase tracking-[0.1em] text-white transition-colors duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 md:hover:brightness-110"
          >
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.08)),radial-gradient(circle_at_82%_18%,rgba(187,247,208,0.18),transparent_26%)] opacity-90" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black/20 ring-1 ring-white/10">
              <Palette size={16} />
            </span>
            <span className="relative">{loading ? "Opening..." : "BUY FOR YOUR SELF"}</span>
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-300">
            <Check size={12} className="text-cyan-300" />
            Production
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-300">
            <Sparkles size={12} className="text-fuchsia-300" />
            Delivery CO2 0%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-300">
            <Globe2 size={12} className="text-emerald-300" />
            Secure checkout Ready
          </span>
        </div>

        {verifiedReviews.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#1b1424] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">Verified reviews</p>
              <div className="flex items-center gap-1 text-yellow-300">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star key={item} size={13} fill="currentColor" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
