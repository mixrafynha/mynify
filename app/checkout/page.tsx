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
  createCheckoutRequestPayload,
} from "./_lib/checkout";
import type {
  AddressSuggestion,
  CartItem,
  CartVariant,
  CheckoutForm,
  ProductAvailability,
  ProductAvailabilityItem,
  Step,
  CheckoutRequestPayload,
} from "./_lib/checkout";

type GelatoDraftTestResult = {
  ok?: boolean;
  requestPayload?: unknown;
  responsePayload?: unknown;
  headers?: Record<string, string>;
  status?: number;
  durationMs?: number;
};

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

function stringifyForDisplay(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function cleanUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolvePreviewImageSources(item: CartItem) {
  const designData = item.design_data ?? item.designData ?? {};
  const mockups =
    designData && typeof designData === "object" && !Array.isArray(designData) && designData.mockups && typeof designData.mockups === "object"
      ? (designData.mockups as Record<string, unknown>)
      : {};
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
    cleanUrl(mockups.checkout_thumbnail_url) ||
    cleanUrl(mockups.front) ||
    cleanUrl(frontSide.mockupUrl) ||
    cleanUrl(frontSide.mockup_url) ||
    cleanUrl(item.front_print_file_url) ||
    cleanUrl(item.frontPrintFileUrl) ||
    cleanUrl(item.image);

  const back =
    cleanUrl(mockups.checkout_thumbnail_url) ||
    cleanUrl(mockups.back) ||
    cleanUrl(backSide.mockupUrl) ||
    cleanUrl(backSide.mockup_url) ||
    cleanUrl(item.back_print_file_url) ||
    cleanUrl(item.backPrintFileUrl) ||
    cleanUrl(item.image);

  return { front, back };
}

export default function CheckoutPage() {
  const router = useRouter();
  const addressLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressAddressLookup = useRef(false);
  const selectedAddressLock = useRef("");
  const addressSessionToken = useRef(createAddressSessionToken());
  const availabilityLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState<Step>(() => readCheckoutStep());
  const [items, setItems] = useState<CartItem[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, CartVariant[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testingGelato, setTestingGelato] = useState(false);
  const [gelatoTestResult, setGelatoTestResult] = useState<GelatoDraftTestResult | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggestion, setAddressSuggestion] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      postalCode: "",
      country: "",
      shippingMethod: "standard",
    },
  );

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
  const selectedShippingMethod = validatedShippingMethods?.find((method) => method.id === form.shippingMethod);
  const shipping = subtotal > 0 ? selectedShippingMethod?.price ?? (form.shippingMethod === "express" ? 9.99 : 4.99) : 0;
  const totalBeforeTax = subtotal + shipping;
  const taxDisplay = form.country ? "Calculated at payment" : "Calculated after delivery country";
  const total = totalBeforeTax;
  const hasAvailabilityBlock = productAvailability.checked && productAvailability.configured && !productAvailability.available;
  const emailValid = isValidEmail(form.email);
  const phoneValidation = validatePhoneNumber(form.country, form.phoneCountry, form.phone);
  const phoneValid = phoneValidation.valid;

  const shippingComplete = Boolean(
    emailValid &&
      form.fullName.trim() &&
      phoneValid &&
      form.address.trim() &&
      form.city.trim() &&
      form.postalCode.trim() &&
      form.country.trim() &&
      !productAvailability.loading &&
      !hasAvailabilityBlock,
  );

  const canPay = shippingComplete && items.length > 0;

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

    const country = form.country.trim();
    const countryData = resolveCheckoutCountry(country);

    if (!country || !items.length) {
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

    availabilityLookupTimer.current = setTimeout(async () => {
      setProductAvailability((current) => ({ ...current, loading: true, message: null }));

      try {
        const res = await fetch("/api/checkout/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            country,
            countryIso: countryData?.iso ?? null,
            items: items.map((item) => ({
              itemId: item.id,
              title: item.title,
              productId: getCartProductId(item),
              variantId: item.variant_id ?? null,
              color: item.color ?? null,
              size: item.size ?? null,
              quantity: Math.max(1, Number(item.quantity) || 1),
            })),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Availability check failed");

        const methods = safeArray<{ id: string; title: string; price?: number | null; estimatedDays?: string | null }>(data?.shippingMethods);

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

        if (methods.length && !methods.some((method) => method.id === form.shippingMethod)) {
          setForm((prev) => ({ ...prev, shippingMethod: methods[0].id as CheckoutForm["shippingMethod"] }));
        }
      } catch {
        setProductAvailability({
          loading: false,
          checked: true,
          configured: false,
          available: true,
          country,
          countryIso: countryData?.iso ?? null,
          unavailableItems: [],
          message: "Delivery availability is temporarily estimated. Checkout will not block while live validation is not configured.",
        });
      }
    }, 350);

    return () => {
      if (availabilityLookupTimer.current) clearTimeout(availabilityLookupTimer.current);
    };
  }, [form.country, form.shippingMethod, items]);

  const updateField = (key: keyof CheckoutForm, value: string) => {
    if (key === "address") {
      selectedAddressLock.current = "";
      suppressAddressLookup.current = false;
      if (!addressSessionToken.current) addressSessionToken.current = createAddressSessionToken();
    }

    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "country" && value ? { phoneCountry: getCountryCode(value) } : null),
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

      setForm((prev) => ({
        ...prev,
        address: nextAddress,
        postalCode: resolved.postalCode || prev.postalCode,
        city: resolved.city || prev.city,
        country: nextCountry,
        phoneCountry: getCountryCode(nextCountry),
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
        body: JSON.stringify({ id: item.id, ...payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error updating item");
      const updatedItem = data?.item ?? data?.data;
      if (updatedItem) {
        setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...updatedItem } : entry)));
      }
    } catch {
      setItems(previousItems);
      setError("Could not update this item. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const changeVariant = async (item: CartItem, selected: CartVariant) => {
    if (removingItemId || updatingItemId === item.id) return;

    const nextColor = variantColor(selected) ?? item.color ?? null;
    const nextSize = variantSize(selected) ?? item.size ?? null;
    const nextVariantId = selected.id || selected.variant_id || item.variant_id || null;
    const customDesign = isCustomDesignItem(item);
    const secondPrintCharge = customSecondPrintCharge(item);
    const nextPrice = customDesign
      ? variantPrice(
          selected,
          Math.max(0, (Number(item.price) || 0) - secondPrintCharge),
        ) + secondPrintCharge
      : variantPrice(selected, Math.max(0, Number(item.price) || 0));
    const nextImage = customDesign
      ? item.image || variantImage(selected) || null
      : variantImage(selected) || item.image || null;
    const nextSku = variantSku(selected) || item.sku || null;
    const nextProductColorId = variantProductColorId(selected) || item.product_color_id || null;

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              variant_id: nextVariantId,
              color: nextColor,
              size: nextSize,
              price: nextPrice,
              image: nextImage,
              sku: nextSku,
              product_color_id: nextProductColorId,
            }
          : entry,
      ),
    );

    await updateCartItem(item, {
      variantId: nextVariantId,
      variant_id: nextVariantId,
      product_color_id: nextProductColorId,
      color: nextColor,
      size: nextSize,
      sku: nextSku,
      image: nextImage,
      price: nextPrice,
    });
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


  const buildLiveCheckoutPayload = () =>
    createCheckoutRequestPayload(
      form,
      items.map((item) => ({
        ...item,
        selectedVariant: item.selectedVariant ?? getCurrentVariant(item),
      })),
      shipping,
    );

  const handleCheckout = async () => {
    if (!canPay || submitting) return;
    if (hasAvailabilityBlock) {
      setError("Some products are not available for this delivery country. Change country or product variant before paying.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLiveCheckoutPayload()),
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

  const handleGelatoDraftOrderTest = async () => {
    if (!canPay || submitting || testingGelato || loading || updatingItemId || removingItemId) return;
    if (hasAvailabilityBlock) {
      setError("Some products are not available for this delivery country. Change country or product variant before testing Gelato.");
      return;
    }

    const requestPayload: CheckoutRequestPayload = buildLiveCheckoutPayload();
    const startedAt = performance.now();

    setTestingGelato(true);
    setError(null);
    setGelatoTestResult(null);

    try {
      const res = await fetch("/api/gelato/draft-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(requestPayload),
      });

      const data = (await res.json().catch(() => null)) as GelatoDraftTestResult | null;
      const durationMs = Math.round(performance.now() - startedAt);
      const nextResult: GelatoDraftTestResult = data ?? { ok: false, status: res.status, durationMs };

      setGelatoTestResult({ ...nextResult, durationMs: nextResult.durationMs ?? durationMs, status: nextResult.status ?? res.status });
    } catch (cause) {
      const durationMs = Math.round(performance.now() - startedAt);
      const message = cause instanceof Error ? cause.message : "Gelato Draft Order request failed";
      const nextResult: GelatoDraftTestResult = {
        ok: false,
        requestPayload,
        responsePayload: { error: message },
        headers: {},
        status: 0,
        durationMs,
      };

      setGelatoTestResult(nextResult);
    } finally {
      setTestingGelato(false);
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
                      <input className={fieldClass} type="email" autoComplete="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(form.email.trim()) && !emailValid} />
                      {form.email.trim() && !emailValid && <span className="mt-2 block text-xs font-bold text-red-200/85">Enter a valid email address.</span>}
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">Full name</span>
                      <input className={fieldClass} autoComplete="name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Your name" />
                    </label>
                    <label>
                      <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55"><Phone size={13} /> Phone</span>
                      <div className="flex gap-2">
                        <select className="h-12 w-[102px] rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-black text-white outline-none focus:border-purple-300/80 [&_option]:bg-[#0b0b13] [&_option]:text-white" value={form.phoneCountry} onChange={(e) => updateField("phoneCountry", e.target.value)} aria-label="Phone country code" style={{ colorScheme: "dark" }}>
                          {GELATO_COUNTRIES.map((item) => <option key={`${item.iso}-${item.code}`} value={item.code} className="bg-[#0b0b13] text-white">{item.code} · {item.iso}</option>)}
                        </select>
                        <input className={fieldClass} inputMode="tel" autoComplete="tel-national" required value={form.phone} onChange={(e) => updatePhone(e.target.value)} placeholder={phoneValidation.rule.example} aria-invalid={Boolean(form.phone.trim()) && !phoneValid} />
                      </div>
                      {form.phone.trim() && !phoneValid && <span className="mt-2 block text-xs font-bold text-red-200/85">Enter a valid phone number for {form.phoneCountry}.</span>}
                    </label>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-white/55">
                        <span>Delivery country</span>
                        {productAvailability.loading ? <span className="flex items-center gap-1 text-[10px] text-white/35"><Loader2 size={11} className="animate-spin" /> checking</span> : null}
                      </span>
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
                      <span className="mb-2 block text-xs font-black text-white/55">Apartment, floor, door or company — optional</span>
                      <input className={fieldClass} autoComplete="address-line2" value={form.apartment} onChange={(e) => updateField("apartment", e.target.value)} placeholder="Apartment, floor, door, building, company" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-black text-white/55">City</span>
                      <input className={fieldClass} autoComplete="address-level2" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
                    </label>

                    {productAvailability.checked && form.country && hasAvailabilityBlock && (
                      <div className="sm:col-span-2 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs font-bold leading-5 text-red-100">
                        <p>Some products or variants in your cart are not available for {form.country}.</p>
                        {productAvailability.unavailableItems.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-red-100/80">
                            {productAvailability.unavailableItems.map((item) => <li key={item.itemId}>{item.title}{item.reason ? ` — ${item.reason}` : ""}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/40">Shipping method</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(validatedShippingMethods || [
                        { id: "standard", title: "Standard", estimatedDays: "Balanced price", price: 4.99 },
                        { id: "express", title: "Express", estimatedDays: "Faster delivery", price: 9.99 },
                      ]).map((method) => {
                        const active = form.shippingMethod === method.id;
                        return (
                          <button key={method.id} type="button" onClick={() => updateField("shippingMethod", method.id)} className={`rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] ${active ? "border-purple-300/50 bg-purple-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black">{method.title}</span>
                              <span className="text-sm font-black text-purple-100">{typeof method.price === "number" ? money(method.price) : "Calculated"}</span>
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-white/40">{method.estimatedDays || (productAvailability.configured ? "Verified shipping method" : "Estimated shipping")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button type="button" disabled={!shippingComplete} onClick={goNext} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#080812] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 lg:hidden">
                    {step === "shipping" ? "Continue to review" : "Continue"} <ArrowRight size={15} />
                  </button>
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
                      const current = getCurrentVariant(item);
                      const currentColor = current ? variantColor(current) : item.color;
                      const currentSize = current ? variantSize(current) : item.size;
                      const quantity = Math.max(1, Number(item.quantity) || 1);
                      const customDesign = isCustomDesignItem(item);
                      const secondPrintCharge = customSecondPrintCharge(item);
                      const price = customDesign
                        ? Math.max(0, Number(item.price) || 0)
                        : variantPrice(current, Math.max(0, Number(item.price) || 0));
                      const busy = updatingItemId === item.id || removingItemId === item.id;
                      const previewImages = resolvePreviewImageSources(item);
                      const currentSku = variantSku(current) || item.sku || null;
                      const currentStock = current ? variantStock(current) : null;

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

                      const sizeChoices = (currentColor ? variants.filter((variant) => variantColor(variant) === currentColor) : variants);
                      const visibleSizes = Array.from(
                        sizeChoices.reduce((map, variant) => {
                          const size = variantSize(variant);
                          if (!size) return map;
                          const existing = map.get(size);
                          const preferNew = !existing || (variantColor(variant) === currentColor && variantStock(variant) > variantStock(existing));
                          if (preferNew) map.set(size, variant);
                          return map;
                        }, new Map<string, CartVariant>()),
                      ).map(([, variant]) => variant);

                      return (
                        <article key={item.id} className="py-5">
                          <div className="grid grid-cols-[132px_1fr] gap-4 sm:grid-cols-[168px_1fr] sm:gap-6">
  <ProductPreviewImage
    title={item.title}
    frontImage={previewImages.front}
    backImage={previewImages.back}
  />

                            <div className="min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-[15px] font-black leading-5 sm:text-base">{item.title}</p>
                                  <p className="mt-1 text-xs font-bold text-white/35">{[currentColor, currentSize].filter(Boolean).join(" / ") || "Custom product"}</p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-white/35 sm:text-[11px]">
                                    <span>Variant price {money(Math.max(0, price - secondPrintCharge))}</span>
                                    {secondPrintCharge > 0 ? <span className="text-purple-200">Second print side +{money(secondPrintCharge)}</span> : null}
                                    <span>Excl. tax</span>
                                    {currentSku ? <span>SKU {currentSku}</span> : null}
                                    {typeof currentStock === "number" && currentStock > 0 ? <span>{currentStock} in stock</span> : null}
                                  </div>
                                </div>
                                <button type="button" onClick={() => removeItem(item.id)} disabled={busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/42 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-40" aria-label="Remove item">
                                  {removingItemId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                </button>
                              </div>

                              {colorGroups.length > 0 && (
                                <div className="mt-3">
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Color</p>
                                    {currentColor ? <span className="text-[11px] font-bold text-white/45">{currentColor} · {money(price)}</span> : null}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {colorGroups.map(({ color, variant }) => {
                                      const active = color === currentColor;
                                      const available = isVariantAvailable(variant);
                                      const optionPrice = customDesign
                                        ? variantPrice(variant, Math.max(0, price - secondPrintCharge)) + secondPrintCharge
                                        : variantPrice(variant, price);
                                      return (
                                        <button key={`${color}-${variantId(variant)}`} type="button" title={`${color} · ${money(optionPrice)}`} aria-label={`Select ${color}`} disabled={busy || !available} onClick={() => changeVariantByColor(item, color)} className={`group grid h-10 w-10 place-items-center rounded-full border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "border-white bg-white/12 ring-2 ring-white/25" : "border-white/15 hover:border-white/35"}`}>
                                          <span className="h-7 w-7 rounded-full border border-black/25" style={{ backgroundColor: variantHex(variant) }} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {visibleSizes.length > 0 && (
                                <div className="mt-3">
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Size</p>
                                    {currentSize ? <span className="text-[11px] font-bold text-white/45">{currentSize} · {money(price)}</span> : null}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {visibleSizes.map((variant) => {
                                      const size = variantSize(variant);
                                      const active = size === currentSize;
                                      const available = isVariantAvailable(variant);
                                      const optionPrice = customDesign
                                        ? variantPrice(variant, Math.max(0, price - secondPrintCharge)) + secondPrintCharge
                                        : variantPrice(variant, price);
                                      return (
                                        <button key={variantId(variant)} type="button" disabled={busy || !available} onClick={() => changeVariantBySize(item, size)} className={`min-w-12 rounded-2xl border px-2.5 py-1.5 text-center transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "border-white bg-white text-[#080812]" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"}`}>
                                          <span className="block text-xs font-black leading-4">{size}</span>
                                          <span className="block text-[9px] font-black leading-3 opacity-70">{money(optionPrice)}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {colorGroups.length === 0 && currentColor && (
                                <div className="mt-3">
                                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Color</p>
                                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/70">{currentColor}</span>
                                </div>
                              )}

                              {visibleSizes.length === 0 && currentSize && (
                                <div className="mt-3">
                                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Size</p>
                                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/70">{currentSize}</span>
                                </div>
                              )}

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <button type="button" onClick={() => changeQuantity(item.id, quantity - 1)} disabled={quantity <= 1 || busy} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-white/70 transition active:scale-95 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Decrease quantity"><Minus size={14} /></button>
                                  <span className="grid h-9 min-w-10 place-items-center rounded-full bg-white/[0.06] px-2 text-xs font-black">{quantity}</span>
                                  <button type="button" onClick={() => changeQuantity(item.id, quantity + 1)} disabled={busy} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-white/70 transition active:scale-95 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Increase quantity"><Plus size={14} /></button>
                                </div>
                                <div className="text-right">
                                  <span className="block text-base font-black text-purple-100">{money(price * quantity)}</span>
                                  <span className="block text-[10px] font-bold text-white/35">excl. tax</span>
                                </div>
                              </div>
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
                  <p className="mt-2 text-sm font-medium leading-6 text-white/45">You are one step away. Confirm the total and continue to payment.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/15 text-purple-200"><CreditCard size={21} /></div>
                      <div>
                        <p className="text-sm font-black">Card payment</p>
                        <p className="mt-1 text-xs font-semibold text-white/40">Handled by your secure checkout route.</p>
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

                  <button type="button" disabled={!canPay || submitting || testingGelato || loading || Boolean(updatingItemId) || Boolean(removingItemId)} onClick={handleGelatoDraftOrderTest} className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-purple-600 text-sm font-black text-white shadow-[0_0_26px_rgba(147,51,234,0.25)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                    {testingGelato ? <><Loader2 size={16} className="animate-spin" /> Testing Gelato...</> : <>Test Gelato</>}
                  </button>

                  {gelatoTestResult ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 text-xs font-semibold leading-5 text-white/60">
                      {gelatoTestResult.ok ? (
                        <div className="space-y-2">
                          <p className="text-sm font-black text-emerald-200">Draft Order created successfully</p>
                          <p>Draft Order ID: {String(getObjectValue(gelatoTestResult.responsePayload, ["id", "orderId", "draftOrderId"]) ?? "Not returned")}</p>
                          <p>Gelato Status: {String(getObjectValue(gelatoTestResult.responsePayload, ["status", "gelatoStatus"]) ?? "Not returned")}</p>
                          <p>Fulfillment Status: {String(getObjectValue(gelatoTestResult.responsePayload, ["fulfillmentStatus", "fulfillment_status"]) ?? "Not returned")}</p>
                          <p>Country: {form.country}</p>
                          <p>Variant: {items.map((item) => [item.color, item.size].filter(Boolean).join(" / ") || item.variant_id || item.title).join(", ")}</p>
                          <p>SKU: {items.map((item) => item.sku || "Not returned").join(", ")}</p>
                          <p>Print Provider: {String(getObjectValue(gelatoTestResult.responsePayload, ["printProvider", "print_provider", "printProviderName"]) ?? "Not returned")}</p>
                          <p>Production Country: {String(getObjectValue(gelatoTestResult.responsePayload, ["productionCountry", "production_country"]) ?? "Not returned")}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-black text-red-200">Gelato rejected the Draft Order</p>
                          <p>HTTP status: {gelatoTestResult.status ?? "Unknown"}</p>
                          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-white/70">{stringifyForDisplay(gelatoTestResult.responsePayload ?? gelatoTestResult)}</pre>
                        </div>
                      )}
                    </div>
                  ) : null}

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
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white/50">Products</span><span className="font-black">{money(subtotal)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-semibold text-white/50"><Truck size={15} /> Shipping</span><span className="font-black">{money(shipping)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white/50">Tax</span><span className="text-right text-xs font-black text-white/45">{taxDisplay}</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex items-end justify-between gap-4"><span className="text-sm font-semibold text-white/50">Total before tax</span><span className="text-3xl font-black tracking-[-0.06em]">{money(totalBeforeTax)}</span></div>
                <p className="pt-1 text-[10px] font-semibold leading-4 text-white/32">Applicable tax is calculated from the delivery country at payment.</p>
              </div>

              <div className="mt-5 hidden lg:block">
                {step === "payment" ? (
                  <button type="button" disabled={!canPay || submitting || loading || Boolean(updatingItemId) || Boolean(removingItemId)} onClick={handleCheckout} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-5 text-sm font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Pay now {money(total)}</>}
                  </button>
                ) : (
                  <button type="button" disabled={(step === "shipping" && !shippingComplete) || (step === "review" && items.length === 0)} onClick={goNext} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#080812] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                    {step === "shipping" ? "Continue to review" : "Continue"} <ArrowRight size={15} />
                  </button>
                )}
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
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Total before tax</p>
            <p className="text-xl font-black tracking-[-0.05em]">{money(totalBeforeTax)}</p>
            <p className="text-[10px] font-bold text-white/32">Tax calculated at payment</p>
          </div>
          {step === "payment" ? (
            <button type="button" disabled={!canPay || submitting || loading || Boolean(updatingItemId) || Boolean(removingItemId)} onClick={handleCheckout} className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full bg-purple-600 px-5 text-sm font-black text-white disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Pay now"}
            </button>
          ) : (
            <button type="button" disabled={(step === "shipping" && !shippingComplete) || (step === "review" && items.length === 0)} onClick={goNext} className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#080812] disabled:opacity-40">
              {step === "shipping" ? "Continue to review" : "Continue"} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
