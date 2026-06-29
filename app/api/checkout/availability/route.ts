import { NextResponse } from "next/server";

type AvailabilityItem = {
  itemId?: string;
  title?: string;
  productId?: string;
  variantId?: string | null;
  color?: string | null;
  size?: string | null;
  quantity?: number;
};

const DEFAULT_SHIPPING_METHODS = [
  { id: "standard", title: "Standard", price: 4.99, estimatedDays: "Estimated shipping" },
  { id: "express", title: "Express", price: 9.99, estimatedDays: "Faster shipping" },
];

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const country = safeText(body?.country);
    const countryIso = safeText(body?.countryIso).toUpperCase() || null;
    const items = Array.isArray(body?.items) ? (body.items as AvailabilityItem[]) : [];

    if (!country && !countryIso) {
      return NextResponse.json({
        configured: false,
        available: true,
        country,
        countryIso,
        shippingMethods: DEFAULT_SHIPPING_METHODS,
        unavailableItems: [],
        message: "Select a delivery country to estimate availability.",
      });
    }

    const endpoint = process.env.PRODUCT_AVAILABILITY_URL?.trim();
    const apiKey = process.env.PRODUCT_AVAILABILITY_API_KEY?.trim();

    if (endpoint) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ country, countryIso, items }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return NextResponse.json(
          {
            configured: true,
            available: false,
            country,
            countryIso,
            shippingMethods: [],
            unavailableItems: items.map((item) => ({
              itemId: item.itemId || item.productId || crypto.randomUUID(),
              title: item.title || "Product",
              productId: item.productId || "",
              variantId: item.variantId ?? null,
              color: item.color ?? null,
              size: item.size ?? null,
              quantity: Math.max(1, Number(item.quantity) || 1),
              available: false,
              reason: data?.error || "Availability check failed",
            })),
            message: data?.error || "Availability check failed",
          },
          { status: 200 },
        );
      }

      return NextResponse.json({
        configured: true,
        available: data?.available !== false,
        country: data?.country || country,
        countryIso: data?.countryIso || countryIso,
        shippingMethods: Array.isArray(data?.shippingMethods) ? data.shippingMethods : DEFAULT_SHIPPING_METHODS,
        unavailableItems: Array.isArray(data?.unavailableItems) ? data.unavailableItems : [],
        message: data?.message || null,
      });
    }

    return NextResponse.json({
      configured: false,
      available: true,
      country,
      countryIso,
      shippingMethods: DEFAULT_SHIPPING_METHODS,
      unavailableItems: [],
      message: null,
    });
  } catch {
    return NextResponse.json({
      configured: false,
      available: true,
      shippingMethods: DEFAULT_SHIPPING_METHODS,
      unavailableItems: [],
      message: null,
    });
  }
}
