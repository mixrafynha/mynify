"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
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
  ShoppingBag,
  Trash2,
  Truck,
  User,
} from "lucide-react";

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

type GooglePrediction = {
  description: string;
  place_id: string;
};

declare global {
  interface Window {
    google?: any;
    __ryfioGoogleMapsLoading?: Promise<void>;
  }
}

const COUNTRY_DIALS = [
  { country: "Portugal", code: "+351", postalExample: "1000-001" },
  { country: "France", code: "+33", postalExample: "75001" },
  { country: "Spain", code: "+34", postalExample: "28001" },
  { country: "Germany", code: "+49", postalExample: "10115" },
  { country: "United Kingdom", code: "+44", postalExample: "SW1A 1AA" },
  { country: "United States", code: "+1", postalExample: "10001" },
];

const safeArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

const money = (value: number) => `€${value.toFixed(2)}`;

const inputClass =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/28 focus:border-purple-400/60 focus:bg-white/[0.07]";

const compactButton =
  "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70 transition active:scale-95 hover:bg-white/[0.08]";

function getCountryCode(country: string) {
  const match = COUNTRY_DIALS.find((item) => item.country === country);
  return match?.code ?? "+351";
}

function getPostalPlaceholder(country: string) {
  const match = COUNTRY_DIALS.find((item) => item.country === country);
  return match?.postalExample ?? "Postal code";
}

export default function CheckoutPage() {
  const router = useRouter();
  const postalLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const googleAutocompleteService = useRef<any>(null);
  const googlePlacesService = useRef<any>(null);
  const googleSessionToken = useRef<any>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [addressSuggestion, setAddressSuggestion] =
    useState<AddressSuggestion | null>(null);
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

  const shipping = subtotal > 0 ? 4.99 : 0;
  const total = subtotal + shipping;

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Error loading cart");
      setItems(safeArray<CartItem>(data?.items));
    } catch (err) {
      console.error("Erro ao carregar checkout:", err);
      setItems([]);
      setError("We could not load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) return;

    const loadGoogleMaps = async () => {
      if (window.google?.maps?.places) {
        setGoogleReady(true);
        return;
      }

      setGoogleLoading(true);

      try {
        if (!window.__ryfioGoogleMapsLoading) {
          window.__ryfioGoogleMapsLoading = new Promise<void>(
            (resolve, reject) => {
              const existingScript = document.querySelector<HTMLScriptElement>(
                'script[data-ryfio-google-places="true"]',
              );

              if (existingScript) {
                existingScript.addEventListener("load", () => resolve(), {
                  once: true,
                });
                existingScript.addEventListener(
                  "error",
                  () => reject(new Error("Google Places failed to load")),
                  { once: true },
                );
                return;
              }

              const script = document.createElement("script");
              script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
              script.async = true;
              script.defer = true;
              script.dataset.ryfioGooglePlaces = "true";
              script.onload = () => resolve();
              script.onerror = () =>
                reject(new Error("Google Places failed to load"));
              document.head.appendChild(script);
            },
          );
        }

        await window.__ryfioGoogleMapsLoading;
        if (!cancelled && window.google?.maps?.places) setGoogleReady(true);
      } catch (err) {
        console.warn("Google Places unavailable:", err);
      } finally {
        if (!cancelled) setGoogleLoading(false);
      }
    };

    loadGoogleMaps();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!googleReady || !window.google?.maps?.places) return;

    googleAutocompleteService.current =
      new window.google.maps.places.AutocompleteService();
    googlePlacesService.current = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );
    googleSessionToken.current =
      new window.google.maps.places.AutocompleteSessionToken();
  }, [googleReady]);

  const updateField = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "country" ? { phoneCountry: getCountryCode(value) } : null),
    }));
  };

  useEffect(() => {
    const postalCode = form.postalCode.trim();
    const countryCode = form.country.trim();

    if (postalLookupTimer.current) clearTimeout(postalLookupTimer.current);
    setAddressSuggestion(null);

    if (postalCode.replace(/\s|-/g, "").length < 4 || !countryCode) {
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
        const iso = countryMap[countryCode] ?? "PT";
        const normalizedPostal = postalCode.toUpperCase().replace(/\s+/g, "");
        const res = await fetch(
          `https://api.zippopotam.us/${iso}/${encodeURIComponent(normalizedPostal)}`,
          {
            cache: "force-cache",
          },
        );

        if (!res.ok) return;

        const data = await res.json();
        const place = Array.isArray(data?.places) ? data.places[0] : null;
        const city = place?.["place name"] || "";
        const state = place?.state || "";
        const country = data?.country || countryCode;

        if (city) {
          setAddressSuggestion({
            city,
            state,
            country,
            label: [city, state, country].filter(Boolean).join(", "),
          });
        }
      } catch (err) {
        console.warn("Postal lookup unavailable:", err);
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

    if (
      !googleReady ||
      !googleAutocompleteService.current ||
      query.length < 3
    ) {
      setAddressSuggestions([]);
      return;
    }

    addressLookupTimer.current = setTimeout(() => {
      setAddressSearching(true);

      googleAutocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ["address"],
          sessionToken: googleSessionToken.current,
        },
        (predictions: GooglePrediction[] | null, status: string) => {
          const ok = window.google?.maps?.places?.PlacesServiceStatus?.OK;

          if (status !== ok || !Array.isArray(predictions)) {
            setAddressSuggestions([]);
            setAddressSearching(false);
            return;
          }

          setAddressSuggestions(
            predictions.slice(0, 5).map((prediction) => ({
              label: prediction.description,
              placeId: prediction.place_id,
            })),
          );
          setAddressSearching(false);
        },
      );
    }, 260);

    return () => {
      if (addressLookupTimer.current) clearTimeout(addressLookupTimer.current);
    };
  }, [form.address, googleReady]);

  const applyAddressSuggestion = (suggestion = addressSuggestion) => {
    if (!suggestion) return;

    if (suggestion.placeId && googlePlacesService.current) {
      setAddressSearching(true);
      googlePlacesService.current.getDetails(
        {
          placeId: suggestion.placeId,
          fields: ["address_components", "formatted_address"],
          sessionToken: googleSessionToken.current,
        },
        (place: any, status: string) => {
          const ok = window.google?.maps?.places?.PlacesServiceStatus?.OK;

          if (status !== ok || !place) {
            setAddressSearching(false);
            return;
          }

          const components = Array.isArray(place.address_components)
            ? place.address_components
            : [];
          const get = (
            type: string,
            field: "long_name" | "short_name" = "long_name",
          ) =>
            components.find((component: any) =>
              component.types?.includes(type),
            )?.[field] || "";

          const streetNumber = get("street_number");
          const route = get("route");
          const city =
            get("locality") ||
            get("postal_town") ||
            get("administrative_area_level_2");
          const postalCode = get("postal_code");
          const country = get("country");
          const address =
            [route, streetNumber].filter(Boolean).join(" ") ||
            place.formatted_address ||
            suggestion.label;

          setForm((prev) => ({
            ...prev,
            address,
            city: city || prev.city,
            postalCode: postalCode || prev.postalCode,
            country: COUNTRY_DIALS.some((item) => item.country === country)
              ? country
              : prev.country,
            phoneCountry: COUNTRY_DIALS.some((item) => item.country === country)
              ? getCountryCode(country)
              : prev.phoneCountry,
          }));

          googleSessionToken.current =
            new window.google.maps.places.AutocompleteSessionToken();
          setAddressSuggestions([]);
          setAddressSuggestion(null);
          setAddressSearching(false);
        },
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      address: suggestion.address || prev.address,
      postalCode: suggestion.postalCode || prev.postalCode,
      city: suggestion.city || prev.city,
      country: COUNTRY_DIALS.some((item) => item.country === suggestion.country)
        ? suggestion.country || prev.country
        : prev.country,
    }));
    setAddressSuggestions([]);
    setAddressSuggestion(null);
  };

  const changeQuantity = async (itemId: string, nextQuantity: number) => {
    if (nextQuantity < 1 || updatingItemId || removingItemId) return;

    const previousItems = items;
    setUpdatingItemId(itemId);
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, quantity: nextQuantity } : item,
      ),
    );

    try {
      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity: nextQuantity }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error updating item");
    } catch (err) {
      console.error("Erro ao atualizar item:", err);
      setItems(previousItems);
      setError("Could not update this item. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
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
    } catch (err) {
      console.error("Erro ao remover item:", err);
      setItems(previousItems);
      setError("Could not remove this item. Please try again.");
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleCheckout = async () => {
    if (!items.length || submitting) return;

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
          items: items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
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

      router.push(
        data?.orderId
          ? `/checkout/success?order=${data.orderId}`
          : "/checkout/success",
      );
    } catch (err) {
      console.error("Erro ao criar checkout:", err);
      setError(
        "Checkout is not connected yet. Please check your /api/checkout route.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue =
    items.length > 0 &&
    form.email.trim() &&
    form.fullName.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    form.postalCode.trim() &&
    form.country.trim();

  return (
    <main
      data-ryfio-checkout-page
      className="fixed inset-0 z-[9999] min-h-dvh overflow-y-auto bg-[#03030a] text-white"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.13),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/80 transition active:scale-[0.98] hover:bg-white/[0.075]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-600 shadow-[0_0_34px_rgba(168,85,247,0.35)]">
              <ShoppingBag size={18} />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-200/70">
                Secure checkout
              </p>
              <p className="text-sm font-black text-white/85">Ryfio</p>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-purple-200/70">
            Almost done
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.08em] sm:text-5xl">
            Checkout
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/50">
            Confirm your shipping details, review your cart and finish your
            custom Ryfio order.
          </p>
        </section>

        {error && (
          <div className="mb-5 rounded-[22px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
            {error}
          </div>
        )}

        <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_430px]">
          <section className="space-y-5">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06] text-purple-200">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-[-0.04em]">
                    Contact details
                  </h2>
                  <p className="text-xs font-semibold text-white/40">
                    Receipt and delivery updates.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <label className="sm:col-span-2">
                  <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55">
                    <Mail size={13} /> Email
                  </span>
                  <input
                    className={inputClass}
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black text-white/55">
                    Full name
                  </span>
                  <input
                    className={inputClass}
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Your name"
                  />
                </label>

                <label>
                  <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55">
                    <Phone size={13} /> Phone
                  </span>
                  <div className="flex gap-2">
                    <select
                      className="h-12 w-[104px] rounded-2xl border border-white/10 bg-[#11111b] px-3 text-sm font-black text-white outline-none focus:border-purple-400/60"
                      value={form.phoneCountry}
                      onChange={(e) =>
                        updateField("phoneCountry", e.target.value)
                      }
                      aria-label="Phone country code"
                    >
                      {COUNTRY_DIALS.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.code}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputClass}
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={form.phone}
                      onChange={(e) =>
                        updateField(
                          "phone",
                          e.target.value.replace(/[^\d\s]/g, ""),
                        )
                      }
                      placeholder="912 345 678"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06] text-purple-200">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-[-0.04em]">
                    Smart shipping address
                  </h2>
                  <p className="text-xs font-semibold text-white/40">
                    Start typing your street with Google autocomplete, or use
                    postal code detection.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <label>
                  <span className="mb-2 block text-xs font-black text-white/55">
                    Country
                  </span>
                  <select
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#11111b] px-4 text-sm font-semibold text-white outline-none transition focus:border-purple-400/60"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    autoComplete="country-name"
                  >
                    {COUNTRY_DIALS.map((item) => (
                      <option key={item.country} value={item.country}>
                        {item.country}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 flex items-center gap-2 text-xs font-black text-white/55">
                    <Search size={13} /> Postal code
                  </span>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-10`}
                      autoComplete="postal-code"
                      value={form.postalCode}
                      onChange={(e) =>
                        updateField("postalCode", e.target.value)
                      }
                      placeholder={getPostalPlaceholder(form.country)}
                    />
                    {addressSearching && (
                      <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/40"
                        size={16}
                      />
                    )}
                  </div>
                </label>

                {addressSuggestion && (
                  <button
                    type="button"
                    onClick={() => applyAddressSuggestion()}
                    className="sm:col-span-2 rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-left text-xs font-bold text-purple-100 transition active:scale-[0.99] hover:bg-purple-500/15"
                  >
                    Use detected address:{" "}
                    <span className="text-white">
                      {addressSuggestion.label}
                    </span>
                  </button>
                )}

                <label className="sm:col-span-2">
                  <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-white/55">
                    <span>Street and door number</span>
                    <span className="text-[10px] text-white/35">
                      {googleReady
                        ? "Google autocomplete active"
                        : googleLoading
                          ? "Loading Google..."
                          : "Browser autofill fallback"}
                    </span>
                  </span>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-10`}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Start typing your street"
                    />
                    {addressSearching && (
                      <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/40"
                        size={16}
                      />
                    )}
                  </div>
                </label>

                {addressSuggestions.length > 0 && (
                  <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-[#10101a]">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId || suggestion.label}
                        type="button"
                        onClick={() => applyAddressSuggestion(suggestion)}
                        className="block w-full border-b border-white/10 px-4 py-3 text-left text-xs font-bold text-white/70 transition last:border-b-0 hover:bg-white/[0.06] hover:text-white"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                )}

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-xs font-black text-white/55">
                    Apartment optional
                  </span>
                  <input
                    className={inputClass}
                    autoComplete="address-line2"
                    value={form.apartment}
                    onChange={(e) => updateField("apartment", e.target.value)}
                    placeholder="Floor, apartment, building"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black text-white/55">
                    City
                  </span>
                  <input
                    className={inputClass}
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="City"
                  />
                </label>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-semibold leading-5 text-white/42">
                  Google Places works when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is
                  configured with Places API enabled. Postal code fallback still
                  works without it.
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b14]/95 shadow-2xl shadow-black/35 backdrop-blur-xl">
              <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/70">
                      Order summary
                    </p>
                    <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">
                      Your items
                    </h2>
                  </div>

                  <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white/10 px-2 text-xs font-black">
                    {totalItems}
                  </span>
                </div>
              </div>

              <div className="max-h-[390px] overflow-y-auto p-3 [scrollbar-width:thin]">
                {loading ? (
                  <div className="grid h-52 place-items-center text-sm font-semibold text-white/45">
                    <span className="flex items-center gap-2">
                      <Loader2 size={17} className="animate-spin" /> Loading
                      checkout...
                    </span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex h-52 flex-col items-center justify-center text-center">
                    <div className="mb-4 grid h-16 w-16 place-items-center rounded-[24px] bg-white/[0.06] text-purple-300">
                      <Package size={27} />
                    </div>
                    <p className="text-lg font-black tracking-[-0.04em]">
                      Empty cart
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/stepcategory")}
                      className="mt-4 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black transition active:scale-[0.98]"
                    >
                      Add products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const quantity = Math.max(1, Number(item.quantity) || 1);
                      const price = Math.max(0, Number(item.price) || 0);
                      const busy =
                        updatingItemId === item.id ||
                        removingItemId === item.id;

                      return (
                        <article
                          key={item.id}
                          className="flex gap-3 rounded-[22px] border border-white/10 bg-white/[0.045] p-3"
                        >
                          <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.06]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-purple-300">
                                <ShoppingBag size={21} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <p className="line-clamp-2 flex-1 text-sm font-black leading-5">
                                {item.title}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                disabled={busy}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white/42 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-40"
                                aria-label="Remove item"
                              >
                                {removingItemId === item.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {item.color && (
                                <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/55">
                                  {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/55">
                                  {item.size}
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(item.id, quantity - 1)
                                  }
                                  disabled={quantity <= 1 || busy}
                                  className={`${compactButton} disabled:cursor-not-allowed disabled:opacity-35`}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="grid h-9 min-w-10 place-items-center rounded-xl bg-white/[0.06] px-2 text-xs font-black">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(item.id, quantity + 1)
                                  }
                                  disabled={busy}
                                  className={`${compactButton} disabled:cursor-not-allowed disabled:opacity-35`}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <span className="text-sm font-black text-purple-100">
                                {money(price * quantity)}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-white/10 p-4 sm:p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white/50">Subtotal</span>
                  <span className="font-black">{money(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-white/50">
                    <Truck size={15} /> Shipping
                  </span>
                  <span className="font-black">{money(shipping)}</span>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-semibold text-white/50">
                    Total
                  </span>
                  <span className="text-3xl font-black tracking-[-0.06em]">
                    {money(total)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    !canContinue ||
                    submitting ||
                    loading ||
                    Boolean(updatingItemId) ||
                    Boolean(removingItemId)
                  }
                  onClick={handleCheckout}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 text-sm font-black text-white shadow-[0_0_38px_rgba(147,51,234,0.35)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Continue to payment
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold text-white/42">
                  <div className="flex items-center gap-1.5">
                    <Lock size={13} /> Secure payment
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <Check size={13} /> Editable cart
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
