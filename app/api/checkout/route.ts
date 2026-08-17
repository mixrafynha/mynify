import Stripe from "stripe";
import { NextResponse } from "next/server";
import { hasVisiblePrintElements, resolveSecondPrintCharge } from "@/lib/gelato/second-print-price";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { checkGelatoRegionalAvailability } from "@/lib/gelato/regional-availability";
import { isInvalidGelatoShippingMethodUid } from "@/lib/gelato/shipping-methods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

type CheckoutBody = {
  // Novo formato seguro vindo do carrinho.
  cartItemIds?: string[];
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    countryIso?: string | null;
    address?: string | null;
    apartment?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    fullName?: string | null;
  };
  shipping?: {
    method?: string | null;
  };
  draftOrderId?: string | null;

  // Compatibilidade temporária com o checkout antigo.
  id?: string;
};

type CartItemRow = {
  id: string;
  user_id: string | null;
  product_id: string;
  variant_id: string | null;
  user_product_id: string | null;
  design_id: string | null;
  title: string;
  quantity: number | null;
  currency: string | null;
  size: string | null;
  color: string | null;
  sku: string | null;
};

type ProductRow = {
  id: string;
  title: string;
  price: number | string | null;
  currency: string | null;
  image: string | null;
  images: string[] | null;
};

type VariantRow = {
  id: string;
  price: number | string | null;
  stock: number | null;
  size: string | null;
  sku: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
  gelato_variant_uid: string | null;
  gelato_attributes: Record<string, unknown> | null;
  color_hex?: string | null;
  color_visual?: Record<string, unknown> | null;
};

type ProductColorOwnershipRow = {
  id: string;
  product_id: string | null;
};

type UserProductRow = {
  id: string;
  price: number | string | null;
  markup: number | string | null;
  final_price: number | string | null;
  currency: string | null;
  image: string | null;
  mockups: Record<string, unknown> | null;
  design_data: Record<string, unknown> | null;
};

type PersistedCheckoutOrder = {
  id: string;
  stripe_session_id: string | null;
};

function asPublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!/^https:\/\//i.test(url)) return null;
  return url;
}

function resolveStripeImage(userProduct: UserProductRow | null, product: ProductRow): string | null {
  const mockups = userProduct?.mockups && typeof userProduct.mockups === "object"
    ? userProduct.mockups as Record<string, unknown>
    : null;

  return (
    asPublicImageUrl(mockups?.checkout_thumbnail_url) ??
    asPublicImageUrl(mockups?.checkout_thumbnail_front_url) ??
    asPublicImageUrl(mockups?.front) ??
    asPublicImageUrl(mockups?.front_url) ??
    asPublicImageUrl(userProduct?.image) ??
    asPublicImageUrl(product.image) ??
    (Array.isArray(product.images) ? product.images.map(asPublicImageUrl).find(Boolean) ?? null : null)
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function normalizeBaseCurrency(_value: unknown): string {
  return "eur";
}

function moneyToCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", "."));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const cents = Math.round((numeric + Number.EPSILON) * 100);

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return null;
  }

  return cents;
}

function safeQuantity(value: unknown): number | null {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 100
  ) {
    return null;
  }

  return quantity;
}

function resolveCheckoutCountryCode(body: CheckoutBody): string | null {
  return (
    resolveCountryCode(body.customer?.countryIso) ??
    resolveCountryCode(body.customer?.country) ??
    null
  );
}

function normalizeAddressField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "" };
}

function buildShippingRecipient(body: CheckoutBody) {
  const customer = body.customer ?? {};
  const fullName = normalizeAddressField(customer.fullName);
  const fromFullName = fullName ? splitFullName(fullName) : null;
  const email = normalizeAddressField(customer.email);
  const phone = normalizeAddressField(customer.phone)?.replace(/\s+/g, "");
  const countryCode = resolveCheckoutCountryCode(body);

  return {
    firstName: normalizeAddressField(customer.firstName) ?? fromFullName?.firstName ?? "",
    lastName: normalizeAddressField(customer.lastName) ?? fromFullName?.lastName ?? "",
    addressLine1: normalizeAddressField(customer.address) ?? "",
    addressLine2: normalizeAddressField(customer.apartment) ?? undefined,
    city: normalizeAddressField(customer.city) ?? "",
    state: normalizeAddressField(customer.state) ?? undefined,
    postalCode: normalizeAddressField(customer.postalCode) ?? "",
    countryCode: countryCode ?? "",
    email: email ?? undefined,
    phone: phone ?? undefined,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function userProductHasSecondPrint(userProduct: UserProductRow | null): boolean {
  if (!userProduct) return false;
  const designData = asRecord(userProduct.design_data);
  const sides = asRecord(designData.sides);
  const front = asRecord(sides.front);
  const back = asRecord(sides.back);
  return hasVisiblePrintElements(front.elements) && hasVisiblePrintElements(back.elements);
}

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

function elapsedSince(startedAt: number) {
  return Date.now() - startedAt;
}

function logCheckoutPerf(stage: string, startedAt: number, extra?: Record<string, unknown>) {
  console.info("[checkout-perf]", {
    stage,
    durationMs: elapsedSince(startedAt),
    ...(extra ?? {}),
  });
}

function isInvalidSelectedShippingMethod(input: {
  shipmentMethodUid: string | null;
  serviceType?: string | null;
  code?: string | null;
}) {
  const uid = normalizeAddressField(input.shipmentMethodUid)?.toLowerCase() ?? "";
  const serviceType = normalizeAddressField(input.serviceType);
  const code = normalizeAddressField(input.code);
  return isInvalidGelatoShippingMethodUid(uid) || (uid.startsWith("api_") && !serviceType && !code);
}

export async function POST(req: Request) {
  let createdOrderId: string | null = null;
  const totalStartedAt = Date.now();
  const timings = {
    authMs: 0,
    cartLoadMs: 0,
    productsMs: 0,
    userProductsMs: 0,
    variantsMs: 0,
    availabilityMs: 0,
    quotePreparationMs: 0,
    idempotencyMs: 0,
    gelatoMs: 0,
    persistMs: 0,
    ordersLookupMs: 0,
    persistOrderRpcMs: 0,
    ordersUpdateStripeSessionIdMs: 0,
    totalMs: 0,
  };
  const stripe = getStripeClient();

  try {
    const token = getBearerToken(req);
    const cookieHeaderPresent = Boolean(req.headers.get("cookie"));
    const requestStartedAt = Date.now();

    console.info("[checkout:final:01-auth-start]", {
      cookieHeaderPresent,
      authorizationHeaderPresent: Boolean(token),
    });

    // The checkout UI authenticates with the Supabase session cookie.
    // Keep Bearer-token support for older clients, but do not require it.
    const authStartedAt = Date.now();
    const cookieSupabase = token ? null : createSupabaseServer();
    const authResult = token
      ? await supabase.auth.getUser(token)
      : await cookieSupabase!.auth.getUser();
    timings.authMs += elapsedSince(authStartedAt);
    logCheckoutPerf("auth_done", authStartedAt);

    const user = authResult.data.user;
    const userError = authResult.error;

    console.info("[checkout:final:02-auth-result]", {
      authenticated: Boolean(user?.id),
      userIdSuffix: user?.id ? user.id.slice(-8) : null,
      authSource: token ? "bearer" : "cookie",
      error: userError?.message ?? null,
    });

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Your session expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    let body: CheckoutBody;

    try {
      body = (await req.json()) as CheckoutBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const requestedCartItemIds = Array.isArray(body.cartItemIds)
      ? [...new Set(body.cartItemIds.filter(isUuid))]
      : [];
    let draftCheckout:
      | {
          cart_item_ids: string[] | null;
          gelato_draft_order_id: string | null;
          selected_shipping_method: { id?: string | null; code?: string | null; shipmentMethodUid?: string | null; name?: string | null; price?: number | null; currency?: string | null } | null;
          shipping_address: Record<string, unknown> | null;
          subtotal: number | null;
          shipping_amount: number | null;
          total: number | null;
          currency: string | null;
        }
      | null = null;

    if (body.draftOrderId) {
      const draftStartedAt = Date.now();
      const { data: draftRow, error: draftError } = await supabase
        .from("checkout_drafts")
        .select("cart_item_ids, gelato_draft_order_id, selected_shipping_method, shipping_address, subtotal, shipping_amount, total, currency")
        .eq("id", body.draftOrderId)
        .eq("user_id", user.id)
        .maybeSingle();
      console.info("[checkout:final:03-draft-resolution]", {
        draftOrderId: body.draftOrderId,
        found: Boolean(draftRow),
        ownerMatches: Boolean(draftRow),
        error: draftError?.message ?? null,
      });

      if (draftError) {
        return NextResponse.json(
          { success: false, code: "DRAFT_LOAD_FAILED", message: "Failed to load draft order." },
          { status: 500 },
        );
      }
      logCheckoutPerf("draft_load_done", draftStartedAt, {
        draftOrderId: body.draftOrderId,
        found: Boolean(draftRow),
      });

      if (!draftRow) {
        return NextResponse.json(
          { success: false, code: "DRAFT_NOT_FOUND", message: "The prepared order could not be found." },
          { status: 404 },
        );
      }

      draftCheckout = draftRow;
    }

    const effectiveCartItemIds =
      draftCheckout?.cart_item_ids?.length
        ? [...new Set(draftCheckout.cart_item_ids.filter(isUuid))]
        : requestedCartItemIds;
    const draftShippingMethod = draftCheckout?.selected_shipping_method ?? null;
    const draftShippingAddress = draftCheckout?.shipping_address ?? null;

    if (effectiveCartItemIds.length > 50) {
      return NextResponse.json(
        { error: "Too many cart items" },
        { status: 400 },
      );
    }

    /*
     * FLUXO NOVO:
     * O cliente envia apenas cartItemIds.
     * Nunca utilizamos cart_items.price para cobrar.
     */
    if (effectiveCartItemIds.length > 0) {
      const cartStartedAt = Date.now();
      const { data: cartRows, error: cartError } = await supabase
        .from("cart_items")
        .select(`
          id,
          user_id,
          product_id,
          variant_id,
          user_product_id,
          design_id,
          title,
          quantity,
          currency,
          size,
          color,
          sku
        `)
        .eq("user_id", user.id)
        .in("id", effectiveCartItemIds);
      timings.cartLoadMs += elapsedSince(cartStartedAt);
      logCheckoutPerf("cart_load_done", cartStartedAt, {
        itemCount: effectiveCartItemIds.length,
      });

      if (cartError) {
        console.error("CHECKOUT_CART_ERROR", {
          code: cartError?.code ?? null,
          message: cartError?.message ?? null,
          details: cartError?.details ?? null,
          hint: cartError?.hint ?? null,
        });

        return NextResponse.json(
          { error: "Failed to load cart" },
          { status: 500 },
        );
      }

      const cartItems = (cartRows ?? []) as CartItemRow[];
      if (cartItems.length !== effectiveCartItemIds.length) {
        return NextResponse.json(
          {
            error:
              "One or more cart items do not exist or do not belong to you",
          },
          { status: 403 },
        );
      }

      const productIds = [
        ...new Set(cartItems.map((item) => item.product_id)),
      ];

      const variantIds = [
        ...new Set(
          cartItems
            .map((item) => item.variant_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const productsStartedAt = Date.now();
      const productsPromise = supabase
        .from("products")
        .select("id, title, price, currency, image, images")
        .in("id", productIds);
      let productsQueryMs = 0;
      const trackedProductsPromise = productsPromise.then((result) => {
        productsQueryMs = elapsedSince(productsStartedAt);
        return result;
      });

      const variantsStartedAt = Date.now();
      const variantsPromise = variantIds.length > 0
        ? supabase
            .from("product_variants")
            .select(`
              id,
              price,
              stock,
              size,
              sku,
              product_color_id,
              gelato_product_uid,
              gelato_attributes
            `)
            .in("id", variantIds)
        : Promise.resolve({ data: [] as VariantRow[], error: null });
      let variantsQueryMs = 0;
      const trackedVariantsPromise = variantsPromise.then((result) => {
        variantsQueryMs = elapsedSince(variantsStartedAt);
        return result;
      });

      const userProductIds = [
        ...new Set(
          cartItems
            .map((item) => item.user_product_id ?? item.design_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const userProductsStartedAt = Date.now();
      const userProductsPromise = userProductIds.length
        ? supabase
            .from("user_products")
            .select("id, price, markup, final_price, currency, image, mockups, design_data")
            .in("id", userProductIds)
        : Promise.resolve({ data: [] as UserProductRow[], error: null });
      let userProductsQueryMs = 0;
      const trackedUserProductsPromise = userProductsPromise.then((result) => {
        userProductsQueryMs = elapsedSince(userProductsStartedAt);
        return result;
      });

      const [
        { data: productRows, error: productsError },
        { data: variantRows, error: variantsError },
        { data: userProductRows, error: userProductsError },
      ] = await Promise.all([trackedProductsPromise, trackedVariantsPromise, trackedUserProductsPromise]);
      const parallelLoadMs = Math.max(
        productsQueryMs,
        variantsQueryMs,
        userProductsQueryMs,
      );
      timings.productsMs += productsQueryMs;
      timings.variantsMs += variantsQueryMs;
      timings.userProductsMs += userProductsQueryMs;
      logCheckoutPerf("catalog_batch_done", productsStartedAt, {
        productCount: productIds.length,
        variantCount: variantIds.length,
        userProductCount: userProductIds.length,
        productsQueryMs,
        variantsQueryMs,
        userProductsQueryMs,
        parallelLoadMs,
      });

      const userProductsPayloadBytes = Buffer.byteLength(
        JSON.stringify(userProductRows ?? []),
        "utf8",
      );
      console.info("[checkout:final:user-products-payload]", {
        userProductCount: userProductIds.length,
        userProductsPayloadBytes,
      });

      if (productsError) {
        console.error("CHECKOUT_PRODUCTS_ERROR", {
          code: productsError.code,
        });

        return NextResponse.json(
          { error: "Failed to load products" },
          { status: 500 },
        );
      }

      if (variantsError) {
        console.error("CHECKOUT_VARIANTS_ERROR", {
          code: variantsError.code,
        });

        return NextResponse.json(
          { error: "Failed to load product variants" },
          { status: 500 },
        );
      }

      const variants = (variantRows ?? []) as VariantRow[];

      if (userProductsError) {
        return NextResponse.json(
          { error: "Failed to load design assets" },
          { status: 500 },
        );
      }

      const variantColorIds = [
        ...new Set(
          variants
            .map((variant) => variant.product_color_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const shippingCountryCode = resolveCheckoutCountryCode(body);
      const productColorsStartedAt = Date.now();
      const productColorsPromise = variantColorIds.length > 0
        ? supabase
            .from("product_colors")
            .select("id, product_id")
            .in("id", variantColorIds)
        : Promise.resolve({ data: [] as ProductColorOwnershipRow[], error: null });
      const availabilityStartedAt = Date.now();
      const availabilityResults = new Map<string, Awaited<ReturnType<typeof checkGelatoRegionalAvailability>>>();
      const availabilityPromise = Promise.all(
        variants.map(async (variant) => {
          const result = await checkGelatoRegionalAvailability({
            variantId: variant.id,
            countryCode: shippingCountryCode ?? "",
            gelatoApiKey: process.env.GELATO_API_KEY?.trim() ?? null,
            resolveVariant: async () => variant,
          });
          availabilityResults.set(variant.id, result);
        }),
      );

      const [{ data: productColorRows, error: productColorsError }] = await Promise.all([
        productColorsPromise,
        availabilityPromise,
      ]);
      timings.availabilityMs += elapsedSince(availabilityStartedAt);
      logCheckoutPerf("availability_done", availabilityStartedAt, {
        variantCount: variants.length,
      });
      logCheckoutPerf("product_colors_done", productColorsStartedAt, {
        colorCount: variantColorIds.length,
      });

      if (productColorsError) {
        console.error("CHECKOUT_PRODUCT_COLORS_ERROR", {
          code: productColorsError.code,
        });

        return NextResponse.json(
          { error: "Failed to validate product variants" },
          { status: 500 },
        );
      }
      const productMap = new Map(
        ((productRows ?? []) as ProductRow[]).map((product) => [
          product.id,
          product,
        ]),
      );
      const userProductMap = new Map(
        ((userProductRows ?? []) as UserProductRow[]).map((row) => [row.id, row]),
      );

      const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
      const productColorProductMap = new Map(
        ((productColorRows ?? []) as ProductColorOwnershipRow[]).map((color) => [
          color.id,
          color.product_id,
        ]),
      );

      for (const cartItem of cartItems) {
        if (!cartItem.variant_id) continue;

        const variant = variantMap.get(cartItem.variant_id) ?? null;
        const variantProductId = variant?.product_color_id
          ? productColorProductMap.get(variant.product_color_id) ?? null
          : null;

        if (!variant || !variantProductId || variantProductId !== cartItem.product_id) {
          console.warn("[checkout:final:invalid-product-variant]", {
            cartItemId: cartItem.id,
            productId: cartItem.product_id,
            variantId: cartItem.variant_id,
            productColorId: variant?.product_color_id ?? null,
          });

          return NextResponse.json(
            {
              success: false,
              code: "INVALID_PRODUCT_VARIANT",
              message: "One or more cart items are invalid.",
            },
            { status: 400 },
          );
        }
      }

    type StripeSessionParams = NonNullable<
      Parameters<typeof stripe.checkout.sessions.create>[0]
    >;

    type StripeLineItem = NonNullable<
      StripeSessionParams["line_items"]
    >[number];

      const stripeLineItems: StripeLineItem[] = [];
      const orderItems: Array<{
        cart_item_id: string;
        product_id: string;
        variant_id: string | null;
        user_product_id: string | null;
        design_id: string | null;
        title: string;
        quantity: number;
        unit_amount: number;
        currency: string;
        size: string | null;
        color: string | null;
        sku: string | null;
        gelato_product_uid: string | null;
        image: string | null;
      }> = [];

      // Ryfio checkout is EUR-only. Mixed stored currency labels are ignored;
      // official numeric prices are charged directly as EUR.
      const checkoutCurrency = "EUR";
      for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.product_id);

        if (!product) {
          return NextResponse.json(
            {
              error: `Product not found for cart item ${cartItem.id}`,
            },
            { status: 404 },
          );
        }

        const quantity = safeQuantity(cartItem.quantity);

        if (!quantity) {
          return NextResponse.json(
            {
              error: `Invalid quantity for cart item ${cartItem.id}`,
            },
            { status: 400 },
          );
        }

        const variant = cartItem.variant_id
          ? variantMap.get(cartItem.variant_id) ?? null
          : null;
        if (cartItem.variant_id && !variant) {
          return NextResponse.json(
            {
              error: `Variant not found for cart item ${cartItem.id}`,
            },
            { status: 404 },
          );
        }

        if (variant) {
          const regionalAvailability = availabilityResults.get(variant.id) ?? {
            status: "unknown" as const,
            gelatoStatus: null,
          };

          console.info("[checkout:availability:item]", {
            cartItemId: cartItem.id,
            variantId: variant.id,
            gelatoProductUid: variant.gelato_product_uid ?? null,
            countryCode: shippingCountryCode,
          });
          console.info("[checkout:availability:result]", {
            cartItemId: cartItem.id,
            variantId: variant.id,
            countryCode: shippingCountryCode,
            gelatoStatus: regionalAvailability.gelatoStatus,
            status: regionalAvailability.status,
          });

          if (regionalAvailability.status === "unavailable" || regionalAvailability.status === "unknown") {
            console.info("[checkout:availability:blocked]", {
              countryCode: shippingCountryCode,
              unavailableCount: 1,
            });
            return NextResponse.json(
              {
                error: "PRODUCT_UNAVAILABLE",
                unavailableItems: [
                  {
                    cartItemId: cartItem.id,
                    variantId: variant.id,
                    title: cartItem.title,
                    size: variant.size ?? null,
                    color: cartItem.color ?? null,
                  },
                ],
              },
              { status: 409 },
            );
          }
        }

        if (
          variant &&
          variant.stock !== null &&
          variant.stock < quantity
        ) {
          return NextResponse.json(
            {
              error: `Not enough stock for ${product.title}`,
            },
            { status: 409 },
          );
        }

        /*
         * PREÇO OFICIAL FINAL:
         * - a variante atual é sempre a fonte do preço base no checkout;
         * - se existir artwork real no back, o suplemento vem do printPricing Gelato
         *   da variante atual e do país de entrega;
         * - user_products.final_price e markup não são usados como fonte de preço.
         * Nunca usamos cart_items.price nem preço enviado pelo browser.
         */
        const userProductKey = cartItem.user_product_id ?? cartItem.design_id;
        const userProduct = userProductKey ? userProductMap.get(userProductKey) ?? null : null;
        const currentVariantBasePrice = Number(variant?.price ?? userProduct?.price ?? product.price);
        const hasSecondPrint = userProductHasSecondPrint(userProduct);
        const dynamicSecondPrintCharge = resolveSecondPrintCharge({
          hasFrontDesign: true,
          hasBackDesign: hasSecondPrint,
        });

        const officialPrice = currentVariantBasePrice + (dynamicSecondPrintCharge ?? 0);
        const officialBaseCurrency = "EUR";

        console.info("[checkout:final:price-resolution]", {
          cartItemId: cartItem.id,
          variantId: variant?.id ?? null,
          variantBasePrice: Number.isFinite(currentVariantBasePrice) ? currentVariantBasePrice : null,
          userProductId: userProduct?.id ?? null,
          storedFinalPrice: userProduct?.final_price ?? null,
          hasSecondPrint,
          dynamicSecondPrintCharge,
          printPricingCountryCode: shippingCountryCode,
          officialPrice: Number.isFinite(officialPrice) ? officialPrice : null,
          policy: "current_variant_plus_fixed_second_print_fee_eur",
        });

        if (!Number.isFinite(officialPrice) || officialPrice <= 0) {
          return NextResponse.json(
            {
              error: `Invalid official price for ${product.title}`,
            },
            { status: 400 },
          );
        }

        const baseCurrency = officialBaseCurrency;
        const currency = checkoutCurrency;
        const unitAmount = moneyToCents(officialPrice);

        if (!unitAmount) {
          return NextResponse.json(
            { error: `Invalid official price for ${product.title}` },
            { status: 400 },
          );
        }

        console.info("[checkout:final:currency-resolution]", {
          productId: product.id,
          storedCurrency: cartItem.currency ?? product.currency ?? null,
          officialBaseCurrency: baseCurrency,
          checkoutCurrency,
          policy: "eur_only_numeric_price",
        });

        const size = variant?.size ?? cartItem.size;
        const sku = variant?.sku ?? cartItem.sku;

        const description = [
          cartItem.color ? `Color: ${cartItem.color}` : null,
          size ? `Size: ${size}` : null,
          sku ? `SKU: ${sku}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        const stripeImage = resolveStripeImage(userProduct, product);

        console.info("[checkout:final:stripe-image]", {
          cartItemId: cartItem.id,
          userProductId: userProduct?.id ?? null,
          imagePresent: Boolean(stripeImage),
          imageSource: stripeImage?.includes("/mockups/") ? "user_product_mockup" : stripeImage ? "product_fallback" : null,
        });

        stripeLineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: product.title,
              ...(description ? { description } : {}),
              ...(stripeImage ? { images: [stripeImage] } : {}),
              metadata: {
                product_id: product.id,
                cart_item_id: cartItem.id,
                ...(cartItem.variant_id
                  ? { variant_id: cartItem.variant_id }
                  : {}),
                ...(cartItem.design_id
                  ? { design_id: cartItem.design_id }
                  : {}),
              },
            },
            unit_amount: unitAmount,
          },
          quantity,
        });

        orderItems.push({
          cart_item_id: cartItem.id,
          product_id: product.id,
          variant_id: cartItem.variant_id,
          user_product_id: cartItem.user_product_id,
          design_id: cartItem.design_id,
          title: product.title,
          quantity,
          unit_amount: unitAmount,
          currency,
          size,
          color: cartItem.color,
          sku,
          gelato_product_uid:
            variant?.gelato_product_uid ?? null,
          image: stripeImage,
        });
      }

      const shippingAddress = draftShippingAddress
        ? {
            firstName: normalizeAddressField(draftShippingAddress.firstName) || "",
            lastName: normalizeAddressField(draftShippingAddress.lastName) || "",
            addressLine1: normalizeAddressField(draftShippingAddress.addressLine1) || "",
            addressLine2: normalizeAddressField(draftShippingAddress.addressLine2) || undefined,
            city: normalizeAddressField(draftShippingAddress.city) || "",
            state: normalizeAddressField(draftShippingAddress.state) || undefined,
            postalCode: normalizeAddressField(draftShippingAddress.postalCode) || "",
            countryCode: resolveCountryCode(draftShippingAddress.countryCode) ?? normalizeAddressField(draftShippingAddress.countryCode) ?? "",
            email: normalizeAddressField(draftShippingAddress.email) || undefined,
            phone: normalizeAddressField(draftShippingAddress.phone) || undefined,
          }
        : buildShippingRecipient(body);
      const shipmentMethodUid = normalizeAddressField(draftShippingMethod?.shipmentMethodUid);

      if (!shipmentMethodUid) {
        return NextResponse.json(
          {
            success: false,
            code: "MISSING_SHIPMENT_METHOD_UID",
            message: "The prepared order has no valid shipping method.",
          },
          { status: 409 },
        );
      }
      if (
        isInvalidSelectedShippingMethod({
          shipmentMethodUid,
          serviceType: normalizeAddressField((draftShippingMethod as { serviceType?: unknown } | null)?.serviceType),
          code: draftShippingMethod?.code ?? null,
        })
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "CHECKOUT_SHIPPING_UNAVAILABLE",
            message: "The prepared order has no valid shipping method.",
          },
          { status: 409 },
        );
      }
      if (draftShippingMethod?.price === null || draftShippingMethod?.price === undefined) {
        return NextResponse.json(
          {
            success: false,
            code: "CHECKOUT_SHIPPING_UNAVAILABLE",
            message: "The prepared order has no valid shipping amount.",
          },
          { status: 409 },
        );
      }

      const draftShippingPriceRaw =
        draftCheckout?.shipping_amount ?? draftShippingMethod?.price ?? null;
      const draftShippingPrice = Number(draftShippingPriceRaw);
      const draftShippingCurrency =
        normalizeAddressField(draftCheckout?.currency) ??
        normalizeAddressField(draftShippingMethod?.currency) ??
        checkoutCurrency;

      if (!Number.isFinite(draftShippingPrice) || draftShippingPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_DRAFT_SHIPPING_AMOUNT",
            message: "The prepared order has no valid shipping amount.",
          },
          { status: 409 },
        );
      }

      if (draftShippingCurrency.toUpperCase() !== checkoutCurrency) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_DRAFT_CURRENCY",
            message: "The prepared order currency is invalid.",
          },
          { status: 409 },
        );
      }

      // The Gelato draft was already created successfully with this exact
      // shipmentMethodUid. Do not request a second quote here because Gelato
      // may regenerate shipping UIDs between quotes. Stripe must use the
      // server-persisted shipping method/amount from checkout_drafts.
      const selectedQuoteOption = {
        id: shipmentMethodUid,
        shipmentMethodUid,
        code: normalizeAddressField(draftShippingMethod?.code),
        name: normalizeAddressField(draftShippingMethod?.name) || "Shipping",
        price: draftShippingPrice,
        currency: checkoutCurrency,
      };

      console.info("[checkout:final:shipping-from-draft]", {
        draftOrderId: body.draftOrderId ?? null,
        shipmentMethodUid,
        name: selectedQuoteOption.name,
        price: selectedQuoteOption.price,
        currency: selectedQuoteOption.currency,
        policy: "reuse_successful_gelato_draft_shipping",
      });
      logCheckoutPerf("shipping_done", Date.now(), {
        source: "draft",
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ||
        new URL(req.url).origin;

      /*
       * A tabela orders atual parece estar orientada para um produto.
       * Guardamos uma encomenda principal e colocamos os itens no metadata.
       *
       * Quando criares order_items, estes dados devem passar para essa tabela.
       */
      const firstItem = orderItems[0];

      if (!firstItem) {
        return NextResponse.json(
          { error: "Cart is empty" },
          { status: 400 },
        );
      }

      const totalAmount = orderItems.reduce(
        (total, item) =>
          total + item.unit_amount * item.quantity,
        0,
      );
      // EUR-only checkout: use the validated numeric shipping amount as EUR.
      const shippingAmount = moneyToCents(selectedQuoteOption.price) ?? 0;

      const computedSubtotal = totalAmount / 100;
      const computedShipping = shippingAmount / 100;
      const computedTotal = (totalAmount + shippingAmount) / 100;

      const orderSnapshot = {
        user_id: user.id,
        product_id: firstItem.product_id,
        product_title:
          orderItems.length === 1
            ? firstItem.title
            : `${orderItems.length} products`,
        product_price: computedTotal,
        product_currency: "EUR",
        title:
          orderItems.length === 1
            ? firstItem.title
            : `${orderItems.length} products`,
        price: computedTotal,
        currency: "EUR",
        status: "pending",
        payment_status: "pending",
        gelato_status: "draft",
        checkout_draft_id: body.draftOrderId ?? null,
        gelato_draft_order_id: draftCheckout?.gelato_draft_order_id ?? null,
        subtotal: computedSubtotal,
        shipping_amount: computedShipping,
        total: computedTotal,
        shipping_address: draftShippingAddress ?? shippingAddress,
        shipping_method: draftShippingMethod ?? selectedQuoteOption,
        idempotency_key: body.draftOrderId
          ? `ryfio-checkout:${user.id}:${body.draftOrderId}`
          : null,
        updated_at: new Date().toISOString(),
      };

      let order: PersistedCheckoutOrder | null = null;

      if (body.draftOrderId) {
        const ordersLookupStartedAt = Date.now();
        const { data: existingOrder, error: existingOrderError } = await supabase
          .from("orders")
          .select("id, stripe_session_id, payment_status, status")
          .eq("checkout_draft_id", body.draftOrderId)
          .eq("user_id", user.id)
          .maybeSingle();
        timings.ordersLookupMs += elapsedSince(ordersLookupStartedAt);

        if (existingOrderError) {
          console.error("CHECKOUT_EXISTING_ORDER_LOOKUP_ERROR", {
            code: existingOrderError.code,
          });

          return NextResponse.json(
            { error: "Failed to check existing order" },
            { status: 500 },
          );
        }

        if (existingOrder) {
          if (existingOrder.payment_status === "paid") {
            return NextResponse.json(
              {
                success: false,
                code: "ORDER_ALREADY_PAID",
                message: "This checkout has already been paid.",
                orderId: existingOrder.id,
              },
              { status: 409 },
            );
          }

          if (existingOrder.stripe_session_id) {
            try {
              const existingSession = await stripe.checkout.sessions.retrieve(
                existingOrder.stripe_session_id,
              );

              if (
                existingSession.status === "open" &&
                existingSession.url
              ) {
                console.info("[checkout:final:reuse-stripe-session]", {
                  orderId: existingOrder.id,
                  stripeSessionId: existingSession.id,
                  draftOrderId: body.draftOrderId,
                });

                return NextResponse.json({
                  url: existingSession.url,
                  reused: true,
                  orderId: existingOrder.id,
                });
              }
            } catch (sessionLookupError) {
              console.warn("[checkout:final:reuse-stripe-session-failed]", {
                orderId: existingOrder.id,
                stripeSessionId: existingOrder.stripe_session_id,
                message:
                  sessionLookupError instanceof Error
                    ? sessionLookupError.message
                    : "Unknown Stripe session lookup error",
              });
            }
          }

        }
      }

      const orderItemRows = orderItems.map((item) => ({
        user_id: user.id,
        cart_item_id: item.cart_item_id,
        user_product_id: item.user_product_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        sku: item.sku,
        unit_price: item.unit_amount / 100,
        currency: "EUR",
        image: item.image,
        gelato_product_uid: item.gelato_product_uid,
      }));

      const persistCheckoutStartedAt = Date.now();
      const { data: persistedOrderRows, error: persistCheckoutError } = await supabase.rpc(
        "persist_checkout_order_with_items",
        {
          p_order: {
            ...orderSnapshot,
            created_at: new Date().toISOString(),
          },
          p_order_items: orderItemRows,
        },
      );
      timings.persistOrderRpcMs += elapsedSince(persistCheckoutStartedAt);

      if (persistCheckoutError || !Array.isArray(persistedOrderRows) || !persistedOrderRows[0]?.id) {
        console.error("CHECKOUT_ORDER_PERSIST_ERROR", {
          code: persistCheckoutError?.code,
        });

        return NextResponse.json(
          { error: "Failed to persist checkout order" },
          { status: 500 },
        );
      }

      order = persistedOrderRows[0] as PersistedCheckoutOrder;
      createdOrderId = order.id;

      console.info("[checkout:final:order-resolution]", {
        orderId: order.id,
        draftOrderId: body.draftOrderId ?? null,
        persistedAtomically: true,
      });

      if (order.stripe_session_id) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(order.stripe_session_id);

          if (existingSession.status === "open" && existingSession.url) {
            console.info("[checkout:final:reuse-stripe-session-after-persist]", {
              orderId: order.id,
              stripeSessionId: existingSession.id,
              draftOrderId: body.draftOrderId,
            });

            return NextResponse.json({
              url: existingSession.url,
              reused: true,
              orderId: order.id,
            });
          }
        } catch (sessionLookupError) {
          console.warn("[checkout:final:post-persist-session-lookup-failed]", {
            orderId: order.id,
            stripeSessionId: order.stripe_session_id,
            message:
              sessionLookupError instanceof Error
                ? sessionLookupError.message
                : "Unknown Stripe session lookup error",
          });
        }
      }

      const stripeIdempotencyKey = body.draftOrderId
        ? `ryfio-checkout:${user.id}:${body.draftOrderId}`
        : undefined;

      const stripeSessionStartedAt = Date.now();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        automatic_tax: { enabled: true },
        customer_email: user.email ?? undefined,
        line_items: [
          ...stripeLineItems,
          ...(shippingAmount > 0
            ? [
                {
                  price_data: {
                    currency: checkoutCurrency.toLowerCase(),
                    product_data: {
                      name: `Shipping (${selectedQuoteOption.name})`,
                    },
                    unit_amount: shippingAmount,
                  },
                  quantity: 1,
                } as StripeLineItem,
              ]
            : []),
        ],

        metadata: {
          type: "ryfio_order",
          order_id: order.id,
          user_id: user.id,
          checkout_draft_id: body.draftOrderId ?? "",
          gelato_draft_order_id: draftCheckout?.gelato_draft_order_id ?? "",
          source: "ryfio_checkout",
          cart_item_ids: effectiveCartItemIds.join(",").slice(0, 500),
          item_count: String(orderItems.length),
          shipping_option_id: selectedQuoteOption.id,
          shipping_price: String(selectedQuoteOption.price),
          shipping_currency: selectedQuoteOption.currency,
          shipping_country: shippingCountryCode ?? "",
          quote_checked_at: new Date().toISOString(),
        },

        payment_intent_data: {
          metadata: {
            type: "ryfio_order",
            order_id: order.id,
            user_id: user.id,
            checkout_draft_id: body.draftOrderId ?? "",
            gelato_draft_order_id: draftCheckout?.gelato_draft_order_id ?? "",
            source: "ryfio_checkout",
          },
        },

        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cancel?order_id=${order.id}`,
      }, stripeIdempotencyKey ? { idempotencyKey: stripeIdempotencyKey } : undefined);

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }
      const stripeSessionCreateMs = elapsedSince(stripeSessionStartedAt);
      logCheckoutPerf("stripe_session_done", stripeSessionStartedAt, {
        mode: "draft_or_fresh",
      });

      const persistSessionStartedAt = Date.now();
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          stripe_session_id: session.id,
          status: "stripe_session_created",
        })
        .eq("id", order.id)
        .eq("user_id", user.id);
      timings.ordersUpdateStripeSessionIdMs += elapsedSince(persistSessionStartedAt);
      timings.persistMs =
        timings.ordersLookupMs +
        timings.persistOrderRpcMs +
        timings.ordersUpdateStripeSessionIdMs;

      if (updateError) {
        console.error("CHECKOUT_ORDER_UPDATE_ERROR", {
          code: updateError.code,
        });

        throw new Error("Failed to associate Stripe session");
      }

      timings.totalMs = elapsedSince(totalStartedAt);
      console.info("[checkout:final:timings]", timings);
      console.info("[checkout:perf:summary]", {
        totalMs: elapsedSince(requestStartedAt),
        authMs: timings.authMs,
        cartLoadMs: timings.cartLoadMs,
        productsMs: timings.productsMs,
        userProductsMs: timings.userProductsMs,
        variantsMs: timings.variantsMs,
        availabilityMs: timings.availabilityMs,
        quotePreparationMs: timings.quotePreparationMs,
        idempotencyMs: timings.idempotencyMs,
        gelatoMs: timings.gelatoMs,
        persistMs: timings.persistMs,
        ordersLookupMs: timings.ordersLookupMs,
        persistOrderRpcMs: timings.persistOrderRpcMs,
        stripeSessionCreateMs,
        ordersUpdateStripeSessionIdMs: timings.ordersUpdateStripeSessionIdMs,
      });

      return NextResponse.json({
        url: session.url,
        reused: false,
        orderId: order.id,
      });
    }

    /*
     * COMPATIBILIDADE COM O FORMATO ANTIGO:
     * { id: productId }
     *
     * Continua seguro porque o preço é lido de products.
     * Remove este bloco depois de o frontend enviar cartItemIds.
     */
    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        {
          error: "cartItemIds or product id required",
        },
        { status: 400 },
      );
    }

    const productId = body.id.trim();

    if (!productId || productId.length > 128) {
      return NextResponse.json(
        { error: "Invalid product id" },
        { status: 400 },
      );
    }

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id, title, price, currency")
        .eq("id", productId)
        .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const unitAmount = moneyToCents(product.price);

    if (!unitAmount) {
      return NextResponse.json(
        { error: "Invalid official product price" },
        { status: 400 },
      );
    }

    const currency = "eur";

    const baseUrl =
      process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ||
      new URL(req.url).origin;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        product_id: product.id,
        product_title: product.title,
        product_price: unitAmount / 100,
        product_currency: currency,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    createdOrderId = order.id;

    const stripeSessionStartedAt = Date.now();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      automatic_tax: { enabled: true },
      customer_email: user.email ?? undefined,

      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: product.title,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],

      metadata: {
        order_id: order.id,
        user_id: user.id,
        product_id: product.id,
        source: "ryfio_checkout",
      },

      payment_intent_data: {
        metadata: {
          order_id: order.id,
          user_id: user.id,
          product_id: product.id,
          source: "ryfio_checkout",
        },
      },

      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel?order_id=${order.id}`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }
    logCheckoutPerf("stripe_session_done", stripeSessionStartedAt, {
      mode: "legacy_product",
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", order.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error("Failed to associate Stripe session");
    }

    return NextResponse.json({
      url: session.url,
      reused: false,
      orderId: order.id,
    });
  } catch (error: unknown) {
    console.error("CHECKOUT_ERROR", {
      message:
        error instanceof Error ? error.message : "Unknown error",
      orderId: createdOrderId,
    });

    /*
     * Não apagamos a order aqui.
     * Mantemos o registo pendente para auditoria e recuperação.
     */
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 },
    );
  }
}
