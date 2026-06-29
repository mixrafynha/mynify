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
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

type Step = "shipping" | "review" | "payment";

type CartVariant = {
  id?: string | null;
  variant_id?: string | null;
  product_color_id?: string | null;
  color?: string | null;
  color_hex?: string | null;
  size?: string | null;
  title?: string | null;
  name?: string | null;
  stock?: number | null;
  price?: number | null;
  product_color?: {
    color?: string | null;
    color_hex?: string | null;
    image?: string | null;
  } | null;
};

type CartItem = {
  id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  variant_id?: string | null;
  color?: string | null;
  size?: string | null;
  image?: string | null;
  stock?: number | null;
  variants?: CartVariant[];
  available_variants?: CartVariant[];
  product?: { variants?: CartVariant[] | null } | null;
};

type CheckoutForm = {
  email: string;
  fullName: string;
  phoneCountry: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: "standard" | "express";
};

type AddressSuggestion = {
  city?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  label: string;
  placeId?: string;
};

const COUNTRY_DIALS = [
  { country: "Portugal", code: "+351", postalExample: "1000-001" },
  { country: "France", code: "+33", postalExample: "75001" },
  { country: "Spain", code: "+34", postalExample: "28001" },
  { country: "Germany", code: "+49", postalExample: "10115" },
  { country: "United Kingdom", code: "+44", postalExample: "SW1A 1AA" },
  { country: "United States", code: "+1", postalExample: "10001" },
];

const safeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const money = (value: number) => `€${value.toFixed(2)}`;

const fieldClass =
  "h-12 w-full rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/80";

const selectClass =
  "h-12 w-full rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-semibold text-white outline-none transition focus:border-purple-300/80";

function getCountryCode(country: string) {
  return COUNTRY_DIALS.find((item) => item.country === country)?.code ?? "+351";
}

function getPostalPlaceholder(country: string) {
  return COUNTRY_DIALS.find((item) => item.country === country)?.postalExample ?? "Postal code";
}

function variantId(variant: CartVariant) {
  return variant.id || variant.variant_id || `${variant.color || ""}-${variant.size || ""}-${variant.title || variant.name || ""}`;
}

function variantColor(variant: CartVariant) {
  return variant.color || variant.product_color?.color || null;
}

function variantHex(variant: CartVariant) {
  return variant.color_hex || variant.product_color?.color_hex || "#9ca3af";
}

function variantSize(variant: CartVariant) {
  return variant.size || variant.title || variant.name || null;
}

function normalizeVariantLabel(variant: CartVariant) {
  return [variantColor(variant), variantSize(variant)].filter(Boolean).join(" / ") || "Variant";
}

export default function CheckoutPage() {
  const router = useRouter();
  const addressLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postalLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState<Step>("shipping");
  const [items, setItems] = useState<CartItem[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, CartVariant[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggestion, setAddressSuggestion] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    email: "",
    fullName: "",
    phoneCountry: "+351",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    country: "Portugal",
    shippingMethod: "standard",
  });

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

  const shipping = subtotal > 0 ? (form.shippingMethod === "express" ? 9.99 : 4.99) : 0;
  const total = subtotal + shipping;

  const shippingComplete = Boolean(
    form.email.trim() &&
      form.fullName.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      form.city.trim() &&
      form.postalCode.trim() &&
      form.country.trim(),
  );

  const canPay = shippingComplete && items.length > 0;

  const fetchVariantsForItems = useCallback(async (cartItems: CartItem[]) => {
    const productIds = Array.from(new Set(cartItems.map((item) => item.product_id).filter(Boolean)));
    if (!productIds.length) return;

    const entries = await Promise.all(
      productIds.map(async (productId) => {
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
        next[productId] = variants;
      });
      return next;
    });
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cart", { method: "GET", cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error loading cart");
      const nextItems = safeArray<CartItem>(data?.items);
      setItems(nextItems);
      void fetchVariantsForItems(nextItems);
    } catch {
      setItems([]);
      setError("We could not load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchVariantsForItems]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const updateField = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "country" ? { phoneCountry: getCountryCode(value) } : null),
    }));
  };

  useEffect(() => {
    const postalCode = form.postalCode.trim();
    const countryName = form.country.trim();

    if (postalLookupTimer.current) clearTimeout(postalLookupTimer.current);
    setAddressSuggestion(null);

    if (postalCode.replace(/\s|-/g, "").length < 4 || !countryName) {
      setAddressSearching(false);
      return;
    }

    postalLookupTimer.current = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const countryMap: Record<string, string> = {
          Portugal: "PT",
          France: "FR",
          Spain: "ES",
          Germany: "DE",
          "United Kingdom": "GB",
          "United States": "US",
        };
        const iso = countryMap[countryName] ?? "PT";
        const normalizedPostal = postalCode.toUpperCase().replace(/\s+/g, "");
        const res = await fetch(`https://api.zippopotam.us/${iso}/${encodeURIComponent(normalizedPostal)}`, {
          cache: "force-cache",
        });
        if (!res.ok) return;
        const data = await res.json();
        const place = Array.isArray(data?.places) ? data.places[0] : null;
        const city = place?.["place name"] || "";
        const state = place?.state || "";
        const country = data?.country || countryName;
        if (city) setAddressSuggestion({ city, state, country, label: [city, state, country].filter(Boolean).join(", ") });
      } catch {
        // Fallback unavailable; the user can still complete the field manually.
      } finally {
        setAddressSearching(false);
      }
    }, 420);

    return () => {
      if (postalLookupTimer.current) clearTimeout(postalLookupTimer.current);
    };
  }, [form.postalCode, form.country]);

  useEffect(() => {
    const query = form.address.trim();
    if (addressLookupTimer.current) clearTimeout(addressLookupTimer.current);

    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    addressLookupTimer.current = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const params = new URLSearchParams({ input: query, country: form.country });
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
        const params = new URLSearchParams({ placeId: suggestion.placeId });
        const res = await fetch(`/api/maps/autocomplete?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.address) resolved = data.address as AddressSuggestion;
      }

      const nextCountry = COUNTRY_DIALS.some((item) => item.country === resolved.country)
        ? resolved.country || form.country
        : form.country;

      setForm((prev) => ({
        ...prev,
        address: resolved.address || resolved.label || prev.address,
        postalCode: resolved.postalCode || prev.postalCode,
        city: resolved.city || prev.city,
        country: nextCountry,
        phoneCountry: getCountryCode(nextCountry),
      }));
    } catch {
      setForm((prev) => ({
        ...prev,
        address: suggestion.address || suggestion.label || prev.address,
        postalCode: suggestion.postalCode || prev.postalCode,
        city: suggestion.city || prev.city,
      }));
    } finally {
      setAddressSuggestions([]);
      setAddressSuggestion(null);
      setAddressSearching(false);
    }
  };

  const getItemVariants = (item: CartItem) => {
    const merged = [
      ...safeArray<CartVariant>(item.variants),
      ...safeArray<CartVariant>(item.available_variants),
      ...safeArray<CartVariant>(item.product?.variants),
      ...safeArray<CartVariant>(variantMap[item.product_id]),
    ];

    return merged.filter((variant, index, array) => {
      const id = variantId(variant);
      return Boolean(id) && array.findIndex((entry) => variantId(entry) === id) === index;
    });
  };

  const getCurrentVariant = (item: CartItem) => {
    const variants = getItemVariants(item);
    return (
      variants.find((variant) => variantId(variant) === item.variant_id) ||
      variants.find((variant) => variantColor(variant) === item.color && variantSize(variant) === item.size) ||
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
        body: JSON.stringify({ id: item.id, ...payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error updating item");
    } catch {
      setItems(previousItems);
      setError("Could not update this item. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const changeVariant = async (item: CartItem, selected: CartVariant) => {
    if (updatingItemId || removingItemId) return;

    const nextColor = variantColor(selected) ?? item.color ?? null;
    const nextSize = variantSize(selected) ?? item.size ?? null;
    const nextVariantId = selected.id || selected.variant_id || item.variant_id || null;
    const nextImage = selected.product_color?.image || item.image || null;
    const nextPrice = typeof selected.price === "number" && selected.price > 0 ? selected.price : item.price;

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, variant_id: nextVariantId, color: nextColor, size: nextSize, image: nextImage, price: nextPrice }
          : entry,
      ),
    );

    await updateCartItem(item, {
      variant_id: nextVariantId,
      color: nextColor,
      size: nextSize,
      image: nextImage,
      price: nextPrice,
    });
  };

  const changeVariantByColor = (item: CartItem, color: string | null) => {
    const variants = getItemVariants(item);
    const current = getCurrentVariant(item);
    const selected =
      variants.find((variant) => variantColor(variant) === color && variantSize(variant) === (current ? variantSize(current) : item.size)) ||
      variants.find((variant) => variantColor(variant) === color) ||
      null;
    if (selected) void changeVariant(item, selected);
  };

  const changeVariantBySize = (item: CartItem, size: string | null) => {
    const variants = getItemVariants(item);
    const current = getCurrentVariant(item);
    const selected =
      variants.find((variant) => variantSize(variant) === size && variantColor(variant) === (current ? variantColor(current) : item.color)) ||
      variants.find((variant) => variantSize(variant) === size) ||
      null;
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

  const handleCheckout = async () => {
    if (!canPay || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            ...form,
            phone: `${form.phoneCountry}${form.phone.replace(/^\+/, "").replace(/\s/g, "")}`,
          },
          shipping: { method: form.shippingMethod, price: shipping },
          items: items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error creating checkout");

      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      router.push(data?.orderId ? `/checkout/success?order=${data.orderId}` : "/checkout/success");
    } catch {
      setError("Checkout is not connected yet. Please check your /api/checkout route.");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === "shipping" && shippingComplete) setStep("review");
    if (step === "review" && items.length > 0) setStep("payment");
  };

  const stepIndex = step === "shipping" ? 0 : step === "review" ? 1 : 2;

  return (
    <main data-ryfio-checkout-page className="fixed inset-0 z-[9999] min-h-dvh overflow-y-auto bg-[#05050b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_-8%,rgba(168,85,247,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.026),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 text-sm font-black text-white/75 transition active:scale-[0.98] hover:bg-white/[0.06]"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-black text-white/70">
            <Lock size={14} /> Secure checkout
          </div>
        </header>

        <section className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-purple-200/70">Ryfio checkout</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.08em] sm:text-5xl">Finish your order</h1>
        </section>

        <nav className="mb-6 grid grid-cols-3 gap-2 rounded-full border border-white/10 bg-white/[0.025] p-1">
          {[
            ["shipping", "Shipping"],
            ["review", "Review"],
            ["payment", "Payment"],
          ].map(([id, label], index) => {
            const active = step === id;
            const done = index < stepIndex;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === "shipping") setStep("shipping");
                  if (id === "review" && shippingComplete) setStep("review");
                  if (id === "payment" && shippingComplete && items.length > 0) setStep("payment");
                }}
                className={`flex h-11 items-center justify-center gap-2 rounded-full text-xs font-black transition ${
                  active ? "bg-white text-[#080812]" : done ? "text-purple-100" : "text-white/40"
                }`}
              >
                {done ? <Check size={14} /> : <span className="grid h-5 w-5 place-items-center rounded-full border border-current text-[10px]">{index + 1}</span>}
                {label}
              </button>
            );
          })}
        </nav>

        {error && <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div>}

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            {step === "shipping" && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-8 border-b border-white/10 pb-5">
                  <h2 className="text-2xl font-black tracking-[-0.06em]">Shipping details</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/45">Type your street and choose the right result. The checkout fills city, postal code and country when the API can detect them.</p>
                </div>

                <div className="space-y-7">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Mail size={13} /> Email</span>
                      <input className={fieldClass} type="email" autoComplete="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">Full name</span>
                      <input className={fieldClass} autoComplete="name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Your name" />
                    </label>
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Phone size={13} /> Phone</span>
                      <div className="flex gap-2">
                        <select className="h-12 w-[102px] rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-black text-white outline-none focus:border-purple-300/80" value={form.phoneCountry} onChange={(e) => updateField("phoneCountry", e.target.value)} aria-label="Phone country code">
                          {COUNTRY_DIALS.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}
                        </select>
                        <input className={fieldClass} inputMode="tel" autoComplete="tel-national" value={form.phone} onChange={(e) => updateField("phone", e.target.value.replace(/[^\d\s]/g, ""))} placeholder="912 345 678" />
                      </div>
                    </label>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">Country</span>
                      <select className={selectClass} value={form.country} onChange={(e) => updateField("country", e.target.value)} autoComplete="country-name">
                        {COUNTRY_DIALS.map((item) => <option key={item.country} value={item.country}>{item.country}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Search size={13} /> Postal code</span>
                      <div className="relative">
                        <input className={`${fieldClass} pr-9`} autoComplete="postal-code" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} placeholder={getPostalPlaceholder(form.country)} />
                        {addressSearching && <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 animate-spin text-white/35" size={16} />}
                      </div>
                    </label>

                    {addressSuggestion && (
                      <button type="button" onClick={() => applyAddressSuggestion()} className="sm:col-span-2 rounded-2xl border border-purple-400/15 bg-purple-500/[0.07] px-4 py-3 text-left text-xs font-bold text-purple-100 transition active:scale-[0.99] hover:bg-purple-500/10">
                        Use detected address: <span className="text-white">{addressSuggestion.label}</span>
                      </button>
                    )}

                    <label className="sm:col-span-2">
                      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-white/55"><span>Street and door number</span><span className="text-[10px] text-white/35">Smart autocomplete</span></span>
                      <div className="relative">
                        <input className={`${fieldClass} pr-9`} autoComplete="street-address" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Start typing your street" />
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
                      <span className="mb-2 block text-xs font-black text-white/55">Apartment optional</span>
                      <input className={fieldClass} autoComplete="address-line2" value={form.apartment} onChange={(e) => updateField("apartment", e.target.value)} placeholder="Floor, apartment, building" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">City</span>
                      <input className={fieldClass} autoComplete="address-level2" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
                    </label>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/40">Shipping method</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { id: "standard", title: "Standard", desc: "Balanced price", price: 4.99 },
                        { id: "express", title: "Express", desc: "Faster delivery", price: 9.99 },
                      ].map((method) => {
                        const active = form.shippingMethod === method.id;
                        return (
                          <button key={method.id} type="button" onClick={() => updateField("shippingMethod", method.id)} className={`rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] ${active ? "border-purple-300/50 bg-purple-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black">{method.title}</span>
                              <span className="text-sm font-black text-purple-100">{money(method.price)}</span>
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-white/40">{method.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <h2 className="text-2xl font-black tracking-[-0.06em]">Review products</h2>
                    <p className="mt-2 text-sm font-medium text-white/45">Change color, size and quantity before payment.</p>
                  </div>
                  <button type="button" onClick={() => router.push("/stepcategory")} className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/60 hover:bg-white/[0.05] sm:block">Add more</button>
                </div>

                {loading ? (
                  <div className="grid h-64 place-items-center text-sm font-semibold text-white/45"><span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Loading cart...</span></div>
                ) : items.length === 0 ? (
                  <EmptyCart onAdd={() => router.push("/stepcategory")} />
                ) : (
                  <div className="divide-y divide-white/10">
                    {items.map((item) => {
                      const variants = getItemVariants(item);
                      const colors = Array.from(new Map(variants.map((variant) => [variantColor(variant) || "", variant])).values()).filter((variant) => variantColor(variant));
                      const sizes = Array.from(new Map(variants.map((variant) => [variantSize(variant) || "", variant])).values()).filter((variant) => variantSize(variant));
                      const current = getCurrentVariant(item);
                      const currentColor = current ? variantColor(current) : item.color;
                      const currentSize = current ? variantSize(current) : item.size;
                      const quantity = Math.max(1, Number(item.quantity) || 1);
                      const price = Math.max(0, Number(item.price) || 0);
                      const busy = updatingItemId === item.id || removingItemId === item.id;

                      return (
                        <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[92px_minmax(0,1fr)]">
                          <div className="h-[92px] w-[92px] overflow-hidden rounded-3xl bg-white/[0.045]">
                            {item.image ? <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-purple-300"><ShoppingBag size={24} /></div>}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-base font-black leading-5">{item.title}</p>
                                <p className="mt-1 text-xs font-bold text-white/35">{[item.color, item.size].filter(Boolean).join(" / ") || "Custom product"}</p>
                              </div>
                              <button type="button" onClick={() => removeItem(item.id)} disabled={busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/42 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-40" aria-label="Remove item">
                                {removingItemId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                              </button>
                            </div>

                            {colors.length > 0 && (
                              <div className="mt-4">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Color</p>
                                <div className="flex flex-wrap gap-2">
                                  {colors.map((variant) => {
                                    const color = variantColor(variant);
                                    const active = color === currentColor;
                                    return (
                                      <button key={variantId(variant)} type="button" title={color || "Color"} disabled={busy} onClick={() => changeVariantByColor(item, color)} className={`grid h-9 w-9 place-items-center rounded-full border transition active:scale-95 disabled:opacity-45 ${active ? "border-white" : "border-white/15"}`}>
                                        <span className="h-6 w-6 rounded-full border border-black/15" style={{ backgroundColor: variantHex(variant) }} />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {sizes.length > 0 && (
                              <div className="mt-4">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Variant / size</p>
                                <div className="flex flex-wrap gap-2">
                                  {sizes.map((variant) => {
                                    const size = variantSize(variant);
                                    const active = size === currentSize;
                                    return (
                                      <button key={variantId(variant)} type="button" disabled={busy} onClick={() => changeVariantBySize(item, size)} className={`min-w-12 rounded-full border px-3 py-2 text-xs font-black transition active:scale-95 disabled:opacity-45 ${active ? "border-white bg-white text-[#080812]" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"}`}>
                                        {size}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {variants.length === 0 && (
                              <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-semibold text-white/35">No editable variants returned by the product variant API.</p>
                            )}

                            <div className="mt-5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => changeQuantity(item.id, quantity - 1)} disabled={quantity <= 1 || busy} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-white/70 transition active:scale-95 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Decrease quantity"><Minus size={14} /></button>
                                <span className="grid h-9 min-w-10 place-items-center rounded-full bg-white/[0.06] px-2 text-xs font-black">{quantity}</span>
                                <button type="button" onClick={() => changeQuantity(item.id, quantity + 1)} disabled={busy} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-white/70 transition active:scale-95 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Increase quantity"><Plus size={14} /></button>
                              </div>
                              <span className="text-base font-black text-purple-100">{money(price * quantity)}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === "payment" && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-8 border-b border-white/10 pb-5">
                  <h2 className="text-2xl font-black tracking-[-0.06em]">Payment</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/45">You are one step away. Confirm the total and continue to your payment provider.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/15 text-purple-200"><CreditCard size={21} /></div>
                      <div>
                        <p className="text-sm font-black">Card / Apple Pay / Google Pay</p>
                        <p className="mt-1 text-xs font-semibold text-white/40">Handled by your checkout route and payment provider.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Shipping to</p>
                        <p className="mt-2 text-sm font-black">{form.fullName}</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-white/45">{form.address}{form.apartment ? `, ${form.apartment}` : ""}<br />{form.postalCode} {form.city}<br />{form.country}</p>
                      </div>
                      <button type="button" onClick={() => setStep("shipping")} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/[0.05]">Edit</button>
                    </div>
                  </div>

                  <button type="button" disabled={!canPay || submitting || loading || Boolean(updatingItemId) || Boolean(removingItemId)} onClick={handleCheckout} className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-purple-600 text-sm font-black text-white shadow-[0_0_26px_rgba(147,51,234,0.25)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating checkout...</> : <><Lock size={16} /> Pay now {money(total)}</>}
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/70">Summary</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">{totalItems} item{totalItems === 1 ? "" : "s"}</h2>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-purple-600/15 text-purple-200"><ShoppingBag size={18} /></div>
              </div>

              <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white/50">Subtotal</span><span className="font-black">{money(subtotal)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-semibold text-white/50"><Truck size={15} /> Shipping</span><span className="font-black">{money(shipping)}</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex items-end justify-between gap-4"><span className="text-sm font-semibold text-white/50">Total</span><span className="text-3xl font-black tracking-[-0.06em]">{money(total)}</span></div>
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

      <div className="fixed inset-x-0 bottom-0 z-[10000] border-t border-white/10 bg-[#05050b]/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Total</p>
            <p className="text-xl font-black tracking-[-0.05em]">{money(total)}</p>
          </div>
          {step === "payment" ? (
            <button type="button" disabled={!canPay || submitting || loading || Boolean(updatingItemId) || Boolean(removingItemId)} onClick={handleCheckout} className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full bg-purple-600 px-5 text-sm font-black text-white disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Pay now"}
            </button>
          ) : (
            <button type="button" disabled={(step === "shipping" && !shippingComplete) || (step === "review" && items.length === 0)} onClick={goNext} className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#080812] disabled:opacity-40">
              Continue <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyCart({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-[24px] bg-white/[0.06] text-purple-300">
        <Package size={27} />
      </div>
      <p className="text-lg font-black tracking-[-0.04em]">Empty cart</p>
      <button type="button" onClick={onAdd} className="mt-4 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black transition active:scale-[0.98]">
        Add products
      </button>
    </div>
  );
}
