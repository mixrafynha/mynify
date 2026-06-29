import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AvailabilityBody = {
  country?: string;
  countryIso?: string | null;
  items?: Array<{
    itemId?: string;
    title?: string;
    productId?: string;
    variantId?: string | null;
    color?: string | null;
    size?: string | null;
    quantity?: number;
  }>;
};

const DEFAULT_SHIPPING_METHODS = [
  { id: "standard", title: "Standard", price: 4.99, estimatedDays: "Estimated after Gelato validation" },
  { id: "express", title: "Express", price: 9.99, estimatedDays: "Estimated after Gelato validation" },
];

function cleanBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function normalizeAvailabilityResponse(data: any, body: AvailabilityBody) {
  const unavailableItems = Array.isArray(data?.unavailableItems)
    ? data.unavailableItems
    : Array.isArray(data?.items)
      ? data.items.filter((item: any) => item?.available === false)
      : [];

  const shippingMethods = Array.isArray(data?.shippingMethods)
    ? data.shippingMethods.map((method: any) => ({
        id: String(method.id ?? method.code ?? method.name ?? "standard"),
        title: String(method.title ?? method.name ?? method.id ?? "Shipping"),
        price: typeof method.price === "number" ? method.price : typeof method.amount === "number" ? method.amount : null,
        estimatedDays: method.estimatedDays ?? method.eta ?? method.deliveryTime ?? null,
      }))
    : DEFAULT_SHIPPING_METHODS;

  return {
    configured: true,
    available: data?.available !== false && unavailableItems.length === 0,
    country: data?.country ?? body.country ?? null,
    countryIso: data?.countryIso ?? body.countryIso ?? null,
    shippingMethods,
    unavailableItems,
    message: data?.message ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AvailabilityBody;
    const country = body.country?.trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!country) {
      return NextResponse.json({ error: "Missing country" }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "Missing cart items" }, { status: 400 });
    }

    const customAvailabilityUrl = process.env.GELATO_AVAILABILITY_URL?.trim();
    const gelatoApiKey = process.env.GELATO_API_KEY?.trim();

    if (customAvailabilityUrl) {
      const res = await fetch(customAvailabilityUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(gelatoApiKey ? { Authorization: `Bearer ${gelatoApiKey}` } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return NextResponse.json(
          {
            configured: true,
            available: false,
            country,
            countryIso: body.countryIso ?? null,
            shippingMethods: [],
            unavailableItems: items.map((item) => ({
              itemId: item.itemId,
              title: item.title,
              productId: item.productId,
              variantId: item.variantId,
              color: item.color,
              size: item.size,
              quantity: item.quantity ?? 1,
              available: false,
              reason: data?.error || "Gelato availability check failed",
            })),
            message: data?.error || "Gelato availability check failed",
          },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );
      }

      return NextResponse.json(normalizeAvailabilityResponse(data, body), {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const gelatoBaseUrl = process.env.GELATO_API_BASE_URL?.trim();

    if (gelatoApiKey && gelatoBaseUrl) {
      const res = await fetch(`${cleanBaseUrl(gelatoBaseUrl)}/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gelatoApiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        return NextResponse.json(normalizeAvailabilityResponse(data, body), {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    // Development-safe fallback.
    // Do not block checkout while the real Gelato product availability endpoint is not connected yet.
    // The frontend receives a valid availability response with no warning message.
    return NextResponse.json(
      {
        configured: false,
        available: true,
        country,
        countryIso: body.countryIso ?? null,
        shippingMethods: DEFAULT_SHIPPING_METHODS,
        unavailableItems: [],
        message: null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Availability check failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
