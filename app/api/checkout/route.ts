import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { convertMoneyToCents, normalizeCheckoutCurrency } from "./currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
};

type VariantRow = {
  id: string;
  price: number | string | null;
  stock: number | null;
  size: string | null;
  sku: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
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

  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    if (requestedCartItemIds.length > 50) {
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
    if (requestedCartItemIds.length > 0) {
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
        .in("id", requestedCartItemIds);

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

      if (cartItems.length !== requestedCartItemIds.length) {
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
          .select("id, title, price, currency")
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

      const productMap = new Map(
        ((productRows ?? []) as ProductRow[]).map((product) => [
          product.id,
          product,
        ]),
      );

     const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

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
      }> = [];

      let checkoutCurrency: string | null = null;

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
        const officialPrice = Number(variant?.price ?? product.price);

        if (!Number.isFinite(officialPrice) || officialPrice <= 0) {
          return NextResponse.json(
            {
              error: `Invalid official price for ${product.title}`,
            },
            { status: 400 },
          );
        }

        const baseCurrency = normalizeBaseCurrency(product.currency).toUpperCase();
        const currency = normalizeCheckoutCurrency(cartItem.currency);

        if (
          checkoutCurrency !== null &&
          checkoutCurrency !== currency
        ) {
          return NextResponse.json(
            {
              error:
                "All products in one checkout must use the same currency",
            },
            { status: 400 },
          );
        }

        checkoutCurrency = currency;

        let unitAmount: number;
        try {
          unitAmount = convertMoneyToCents(
            officialPrice,
            baseCurrency,
            currency,
          );
        } catch (conversionError) {
          console.error("CHECKOUT_CURRENCY_CONVERSION_ERROR", {
            productId: product.id,
            baseCurrency,
            currency,
            message:
              conversionError instanceof Error
                ? conversionError.message
                : "Unknown conversion error",
          });

          return NextResponse.json(
            { error: "Currency conversion is temporarily unavailable" },
            { status: 503 },
          );
        }

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

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: firstItem.product_id,
          product_title:
            orderItems.length === 1
              ? firstItem.title
              : `${orderItems.length} products`,
          product_price: totalAmount / 100,
          product_currency: checkoutCurrency ?? "eur",
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
        line_items: stripeLineItems,

        metadata: {
          order_id: order.id,
          user_id: user.id,
          source: "ryfio_checkout",
          cart_item_ids: requestedCartItemIds.join(",").slice(0, 500),
          item_count: String(orderItems.length),
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

    const currency = normalizeBaseCurrency(product.currency);

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