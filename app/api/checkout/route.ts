import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { calculateSellingPrice } from "@/lib/gelato/pricing";
import { getGelatoCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { resolveGelatoPrintFiles } from "@/app/checkout/_lib/checkout";

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
  profit_markup_percentage?: number | string | null;
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
};

type VariantMarketRow = {
  product_variant_id: string;
  country_code: string;
  currency: string;
  is_available: boolean;
  product_price: number | string | null;
  quantity: number;
};

type UserProductRow = {
  id: string;
  print_files: Record<string, unknown> | null;
  mockups: Record<string, unknown> | null;
  design_data: Record<string, unknown> | null;
};

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function normalizeBaseCurrency(value: unknown): string {
  const currency =
    typeof value === "string" ? value.trim().toLowerCase() : "eur";

  // Adiciona aqui outras moedas quando forem oficialmente suportadas.
  const allowedCurrencies = new Set(["eur", "usd", "gbp", "cad"]);

  return allowedCurrencies.has(currency) ? currency : "eur";
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
  if (parts.length <= 1) return { firstName: parts[0] || "Customer", lastName: "." };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "." };
}

function buildShippingRecipient(body: CheckoutBody) {
  const customer = body.customer ?? {};
  const fullName = normalizeAddressField(customer.fullName);
  const fromFullName = fullName ? splitFullName(fullName) : null;
  const email = normalizeAddressField(customer.email);
  const phone = normalizeAddressField(customer.phone)?.replace(/\s+/g, "");
  const countryCode = resolveCheckoutCountryCode(body);

  return {
    firstName: normalizeAddressField(customer.firstName) ?? fromFullName?.firstName ?? "Customer",
    lastName: normalizeAddressField(customer.lastName) ?? fromFullName?.lastName ?? ".",
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

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

export async function POST(req: Request) {
  let createdOrderId: string | null = null;
  const stripe = getStripeClient();

  try {
    const token = getBearerToken(req);
    const cookieHeaderPresent = Boolean(req.headers.get("cookie"));

    console.info("[checkout:final:01-auth-start]", {
      cookieHeaderPresent,
      authorizationHeaderPresent: Boolean(token),
    });

    // The checkout UI authenticates with the Supabase session cookie.
    // Keep Bearer-token support for older clients, but do not require it.
    const authResult = token
      ? await supabase.auth.getUser(token)
      : await createSupabaseServer().auth.getUser();

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
          selected_shipping_method: { id?: string | null; code?: string | null; name?: string | null; price?: number | null; currency?: string | null } | null;
          shipping_address: Record<string, unknown> | null;
        }
      | null = null;

    if (body.draftOrderId) {
      const { data: draftRow, error: draftError } = await supabase
        .from("checkout_drafts")
        .select("cart_item_ids, selected_shipping_method, shipping_address")
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

      if (cartError) {
        console.error("CHECKOUT_CART_ERROR", {
          code: cartError.code,
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

      const { data: productRows, error: productsError } =
        await supabase
          .from("products")
          .select("id, title, price, currency, profit_markup_percentage")
          .in("id", productIds);

      if (productsError) {
        console.error("CHECKOUT_PRODUCTS_ERROR", {
          code: productsError.code,
        });

        return NextResponse.json(
          { error: "Failed to load products" },
          { status: 500 },
        );
      }

      let variants: VariantRow[] = [];

      if (variantIds.length > 0) {
        const { data: variantRows, error: variantsError } =
          await supabase
            .from("product_variants")
            .select(`
              id,
              price,
              stock,
              size,
              sku,
              product_color_id,
              gelato_product_uid
            `)
            .in("id", variantIds);

        if (variantsError) {
          console.error("CHECKOUT_VARIANTS_ERROR", {
            code: variantsError.code,
          });

          return NextResponse.json(
            { error: "Failed to load product variants" },
            { status: 500 },
          );
        }

        variants = (variantRows ?? []) as VariantRow[];
      }

      const userProductIds = [
        ...new Set(
          cartItems
            .map((item) => item.user_product_id ?? item.design_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const { data: userProductRows, error: userProductsError } = userProductIds.length
        ? await supabase
            .from("user_products")
            .select("id, print_files, mockups, design_data")
            .in("id", userProductIds)
        : { data: [], error: null };

      if (userProductsError) {
        return NextResponse.json(
          { error: "Failed to load design assets" },
          { status: 500 },
        );
      }

      const shippingCountryCode = resolveCheckoutCountryCode(body);
      let variantMarkets: VariantMarketRow[] = [];

      if (variantIds.length > 0 && shippingCountryCode) {
        const { data: marketRows, error: marketsError } = await supabase
          .from("gelato_variant_markets")
          .select("product_variant_id, country_code, currency, is_available, product_price, quantity")
          .in("product_variant_id", variantIds)
          .eq("country_code", shippingCountryCode)
          .eq("quantity", 1);

        if (marketsError) {
          console.error("CHECKOUT_VARIANT_MARKETS_ERROR", {
            code: marketsError.code,
          });

          return NextResponse.json(
            { error: "Failed to validate Gelato variant markets" },
            { status: 500 },
          );
        }

        variantMarkets = (marketRows ?? []) as VariantMarketRow[];
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
      const variantMarketMap = new Map(
        variantMarkets.map((market) => [market.product_variant_id, market]),
      );

    type StripeSessionParams = NonNullable<
      Parameters<typeof stripe.checkout.sessions.create>[0]
    >;

    type StripeLineItem = NonNullable<
      StripeSessionParams["line_items"]
    >[number];

      const stripeLineItems: StripeLineItem[] = [];
      const gelatoQuoteItems: Array<{
        itemReferenceId: string;
        productUid: string;
        files: Array<{ type: string; url: string }>;
        printFiles: Array<{ type: string; url: string }>;
        quantity: number;
      }> = [];
      let totalShippingFromGelato: number | null = null;
      let selectedShippingOptionId = normalizeAddressField(body.shipping?.method)?.toLowerCase() ?? null;
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
      }> = [];

      // Ryfio checkout is EUR-only. Mixed stored currency labels are ignored;
      // official numeric prices are charged as EUR without runtime FX conversion.
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
          ? variantMap.get(cartItem.variant_id)
          : null;

        if (cartItem.variant_id && !variant) {
          return NextResponse.json(
            {
              error: `Variant not found for cart item ${cartItem.id}`,
            },
            { status: 404 },
          );
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
         * PREÇO OFICIAL:
         * 1. product_variants.price, quando existe e é válido;
         * 2. products.price como fallback.
         *
         * cart_items.price é deliberadamente ignorado.
         * Qualquer price enviado pelo editor/browser também é ignorado.
         */
        let officialPrice = Number(variant?.price ?? product.price);
        let officialBaseCurrency = normalizeBaseCurrency(product.currency).toUpperCase();
        const gelatoMarket = variant?.gelato_product_uid && shippingCountryCode
          ? variantMarketMap.get(variant.id)
          : null;

        if (variant?.gelato_product_uid && !shippingCountryCode) {
          return NextResponse.json(
            {
              error: "Delivery country is required to validate Gelato availability.",
              variantId: variant.id,
            },
            { status: 400 },
          );
        }

        if (variant?.gelato_product_uid && shippingCountryCode) {
          if (!gelatoMarket) {
            return NextResponse.json(
              {
                error: "Selected variant is not available for this destination.",
                variantId: variant.id,
                countryCode: shippingCountryCode,
              },
              { status: 409 },
            );
          }

          const sellingPrice = calculateSellingPrice({
            productionCost: gelatoMarket.product_price,
            markupPercentage: product.profit_markup_percentage,
          });

          if (sellingPrice === null) {
            return NextResponse.json(
              {
                error: "Invalid Gelato production cost for selected variant.",
                variantId: variant.id,
                countryCode: shippingCountryCode,
              },
              { status: 400 },
            );
          }

          officialPrice = sellingPrice;
          officialBaseCurrency = normalizeBaseCurrency(gelatoMarket.currency).toUpperCase();

          const userProductKey = cartItem.user_product_id ?? cartItem.design_id;
          const userProduct = userProductKey ? userProductMap.get(userProductKey) ?? null : null;
          const printFilesSource = userProduct
            ? {
                id: cartItem.id,
                print_files: userProduct.print_files,
                printFiles: userProduct.print_files,
                mockups: userProduct.mockups,
                design_data: userProduct.design_data,
                designData: userProduct.design_data,
                production: userProduct.design_data,
                product: {
                  print_files: userProduct.print_files,
                  printFiles: userProduct.print_files,
                  mockups: userProduct.mockups,
                  design_data: userProduct.design_data,
                  production: userProduct.design_data,
                },
              }
            : { id: cartItem.id, product: {}, production: null, print_files: null, printFiles: null, mockups: null, design_data: null, designData: null };

          const printFiles = resolveGelatoPrintFiles(printFilesSource as never);
          const productUid = variant.gelato_product_uid;

          if (!printFiles.length) {
            return NextResponse.json(
              {
                error: "Missing print file for Gelato checkout.",
                variantId: variant.id,
              },
              { status: 400 },
            );
          }

          if (!productUid) {
            return NextResponse.json(
              {
                error: "Missing Gelato product UID for selected variant.",
                variantId: variant.id,
              },
              { status: 400 },
            );
          }

          gelatoQuoteItems.push({
            itemReferenceId: cartItem.id,
            productUid,
            files: printFiles,
            printFiles,
            quantity,
          });
        }

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
          conversionRequired: false,
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

        stripeLineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: product.title,
              ...(description ? { description } : {}),
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
        });
      }

      const shippingAddress = draftShippingAddress
        ? {
            firstName: normalizeAddressField(draftShippingAddress.firstName) || "Customer",
            lastName: normalizeAddressField(draftShippingAddress.lastName) || ".",
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
      const shippingMethod = draftShippingMethod?.id || normalizeAddressField(body.shipping?.method)?.toLowerCase() || "standard";

      const gelatoQuoteResult = gelatoQuoteItems.length
        ? await getGelatoCheckoutQuote({
            productUid: gelatoQuoteItems[0].productUid,
            quantity: gelatoQuoteItems[0].quantity,
            shippingAddress,
            printFiles: gelatoQuoteItems[0].files,
            items: gelatoQuoteItems,
            currencyIsoCode: checkoutCurrency,
            customerReferenceId: user.id,
            orderReferenceId: createdOrderId ?? `ryfio-checkout-${Date.now()}`,
          })
        : {
            available: true,
            retryable: false,
            productCost: null,
            productCurrency: null,
            shippingOptions: [],
            reason: null,
          };

      if (!gelatoQuoteResult.available) {
        const status = gelatoQuoteResult.retryable ? 503 : 400;
        return NextResponse.json(
          {
            ok: false,
            retryable: gelatoQuoteResult.retryable,
            code: gelatoQuoteResult.retryable ? "GELATO_TEMPORARILY_UNAVAILABLE" : "PRODUCT_NOT_AVAILABLE_FOR_ADDRESS",
            message: gelatoQuoteResult.retryable
              ? "Shipping could not be calculated. Please try again."
              : "This product cannot be delivered to this address.",
            reason: gelatoQuoteResult.reason,
          },
          { status },
        );
      }

      const selectedQuoteOption =
        gelatoQuoteResult.shippingOptions.find((option) => option.serviceType === shippingMethod) ??
        gelatoQuoteResult.shippingOptions.find((option) => option.id === shippingMethod) ??
        gelatoQuoteResult.shippingOptions[0] ??
        null;

      if (!selectedQuoteOption) {
        return NextResponse.json(
          {
            ok: false,
            retryable: false,
            code: "PRODUCT_NOT_AVAILABLE_FOR_ADDRESS",
            message: "This product cannot be delivered to this address.",
          },
          { status: 400 },
        );
      }

      totalShippingFromGelato = selectedQuoteOption.price;

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
      const shippingAmount = totalShippingFromGelato
        ? moneyToCents(totalShippingFromGelato) ?? 0
        : 0;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: firstItem.product_id,
          product_title:
            orderItems.length === 1
              ? firstItem.title
              : `${orderItems.length} products`,
          product_price: (totalAmount + shippingAmount) / 100,
          product_currency: checkoutCurrency.toLowerCase(),
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("CHECKOUT_ORDER_CREATE_ERROR", {
          code: orderError?.code,
        });

        return NextResponse.json(
          { error: "Failed to create order" },
          { status: 500 },
        );
      }

      createdOrderId = order.id;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
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
          order_id: order.id,
          user_id: user.id,
          source: "ryfio_checkout",
          cart_item_ids: requestedCartItemIds.join(",").slice(0, 500),
          item_count: String(orderItems.length),
          shipping_option_id: selectedQuoteOption.id,
          shipping_price: String(selectedQuoteOption.price),
          shipping_currency: selectedQuoteOption.currency,
          shipping_country: shippingCountryCode ?? "",
          quote_checked_at: new Date().toISOString(),
        },

        payment_intent_data: {
          metadata: {
            order_id: order.id,
            user_id: user.id,
            source: "ryfio_checkout",
          },
        },

        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cancel?order_id=${order.id}`,
      });

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          stripe_session_id: session.id,
        })
        .eq("id", order.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("CHECKOUT_ORDER_UPDATE_ERROR", {
          code: updateError.code,
        });

        throw new Error("Failed to associate Stripe session");
      }

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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
