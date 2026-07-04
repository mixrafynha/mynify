import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

type CheckoutItem = {
  itemReferenceId?: string | null;
  id?: string | null;
  product_id?: string | null;
  user_product_id?: string | null;
  base_product_id?: string | null;
  variant_id?: string | null;
  title?: string | null;
  price?: number | string | null;
  unit_price?: number | string | null;
  unitPrice?: number | string | null;
  final_price?: number | string | null;
  finalPrice?: number | string | null;
  amount?: number | string | null;
  image?: string | null;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  product_color_id?: string | null;
  quantity?: number | string | null;
};

type CheckoutBody = {
  orderReferenceId?: string | null;
  currency?: string | null;
  customer?: {
    email?: string | null;
    fullName?: string | null;
    phone?: string | null;
    address?: string | null;
    apartment?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  shipping?: {
    method?: string | null;
    price?: number | string | null;
  };
  items?: CheckoutItem[];
};

type NormalizedCheckoutItem = CheckoutItem & {
  quantity: number;
  unitAmount: number;
  resolvedPrice: number;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-04-22.dahlia",
});

function parseMoney(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function moneyToCents(value: unknown): number {
  const number = parseMoney(value);
  if (number === null) return 0;
  return Math.round(number * 100);
}

function resolveItemPrice(item: CheckoutItem): number | null {
  return (
    parseMoney(item.price) ??
    parseMoney(item.unit_price) ??
    parseMoney(item.unitPrice) ??
    parseMoney(item.final_price) ??
    parseMoney(item.finalPrice) ??
    parseMoney(item.amount)
  );
}

function normalizeItem(item: CheckoutItem): NormalizedCheckoutItem {
  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const resolvedPrice = resolveItemPrice(item) ?? 0;
  const unitAmount = moneyToCents(resolvedPrice);

  return {
    ...item,
    quantity,
    resolvedPrice,
    unitAmount,
  };
}

function cleanText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function cleanMetadata(value: unknown): string {
  return cleanText(value).slice(0, 500);
}

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function invalidItemPayload(item: NormalizedCheckoutItem) {
  return {
    itemReferenceId: item.itemReferenceId ?? null,
    id: item.id ?? null,
    productId: item.product_id ?? null,
    userProductId: item.user_product_id ?? null,
    baseProductId: item.base_product_id ?? null,
    variantId: item.variant_id ?? null,
    title: item.title ?? null,
    size: item.size ?? null,
    sku: item.sku ?? null,
    quantity: item.quantity,
    receivedPriceFields: {
      price: item.price ?? null,
      unit_price: item.unit_price ?? null,
      unitPrice: item.unitPrice ?? null,
      final_price: item.final_price ?? null,
      finalPrice: item.finalPrice ?? null,
      amount: item.amount ?? null,
    },
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CheckoutBody | null;
    const items = Array.isArray(body?.items) ? body.items : [];
    const normalizedItems = items.map(normalizeItem);
    const validItems = normalizedItems.filter((item) => item.unitAmount > 0 && item.quantity > 0);
    const invalidItems = normalizedItems.filter((item) => item.unitAmount <= 0 || item.quantity <= 0);

    if (!items.length) {
      return NextResponse.json(
        {
          error: "Carrinho vazio.",
          details: "A API /api/checkout recebeu items vazio ou inválido.",
        },
        { status: 400 },
      );
    }

    if (!validItems.length || invalidItems.length) {
      return NextResponse.json(
        {
          error: "Itens sem preço válido no checkout.",
          details:
            "Cada item enviado para /api/checkout precisa de um preço unitário válido. Campos aceites: price, unit_price, unitPrice, final_price, finalPrice ou amount.",
          invalidItems: invalidItems.map(invalidItemPayload),
        },
        { status: 400 },
      );
    }

    const customer = body?.customer ?? {};
    const shipping = body?.shipping ?? {};
    const shippingPrice = moneyToCents(shipping.price);
    const baseUrl = siteUrl();

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: item.unitAmount,
        product_data: {
          name: cleanText(item.title, "Ryfio product"),
          images: item.image ? [item.image] : undefined,
          metadata: {
            itemReferenceId: cleanMetadata(item.itemReferenceId),
            cartItemId: cleanMetadata(item.id),
            productId: cleanMetadata(item.product_id),
            userProductId: cleanMetadata(item.user_product_id),
            baseProductId: cleanMetadata(item.base_product_id),
            variantId: cleanMetadata(item.variant_id),
            color: cleanMetadata(item.color),
            size: cleanMetadata(item.size),
            sku: cleanMetadata(item.sku),
            productColorId: cleanMetadata(item.product_color_id),
          },
        },
      },
    }));

    if (shippingPrice > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: shippingPrice,
          product_data: {
            name: shipping.method === "express" ? "Express shipping" : "Standard shipping",
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: cleanText(customer.email) || undefined,
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: {
        source: "ryfio_checkout",
        orderReferenceId: cleanMetadata(body?.orderReferenceId),
        currency: cleanMetadata(body?.currency || "EUR"),
        customerName: cleanMetadata(customer.fullName),
        customerEmail: cleanMetadata(customer.email),
        customerPhone: cleanMetadata(customer.phone),
        shippingMethod: cleanMetadata(shipping.method || "standard"),
        shippingAddress: cleanMetadata(customer.address),
        shippingApartment: cleanMetadata(customer.apartment),
        shippingCity: cleanMetadata(customer.city),
        shippingPostalCode: cleanMetadata(customer.postalCode),
        shippingCountry: cleanMetadata(customer.country),
      },
    });

    return NextResponse.json({ ok: true, url: session.url, checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error("CHECKOUT_STRIPE_ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar checkout Stripe." }, { status: 500 });
  }
}
