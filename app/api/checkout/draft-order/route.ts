import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { buildGelatoCheckoutQuotePayload, resolveCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { normalizeShippingMethods, type NormalizedShippingMethod } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { resolveGelatoPrintFiles, type CartItem, type CartVariant } from "@/app/checkout/_lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DraftBody = {
  cartItemIds?: string[];
  address?: {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
  };
  shippingMethod?: {
    id: string;
    code?: string | null;
    shipmentMethodUid?: string | null;
    name: string;
    price: number;
    currency: string;
  };
};

type CartRow = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  user_product_id: string | null;
  design_id: string | null;
  quantity: number | null;
  selected_variant: Record<string, unknown> | null;
  title: string;
};

type ProductRow = {
  id: string;
  gelato_product_uid: string | null;
};

type VariantRow = {
  id: string;
  sku: string | null;
  size: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
  name?: string | null;
};

type UserProductRow = {
  id: string;
  user_id: string | null;
  gelato_product_uid: string | null;
  design_data: Record<string, unknown> | null;
  print_files: Record<string, unknown> | null;
  mockups: Record<string, unknown> | null;
};

type GelatoFile = { type: string; url: string };

const conflict = (
  code: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.error("[checkout:draft-conflict]", {
    code,
    message,
    ...(details ?? {}),
  });

  return NextResponse.json(
    {
      success: false,
      code,
      message,
      details: details ?? null,
    },
    { status: 409 },
  );
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "Customer", lastName: "." };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "." };
}

function normalizeAddress(body: DraftBody) {
  const address = body.address ?? {};
  const fullName = cleanText(address.fullName);
  const split = fullName ? splitFullName(fullName) : { firstName: "Customer", lastName: "." };
  const countryCode = (cleanText(address.countryCode) || "").toUpperCase();
  return {
    firstName: split.firstName,
    lastName: split.lastName,
    email: cleanText(address.email),
    phone: cleanText(address.phone),
    addressLine1: cleanText(address.addressLine1),
    addressLine2: cleanText(address.addressLine2) || undefined,
    city: cleanText(address.city),
    state: cleanText(address.state) || undefined,
    postalCode: cleanText(address.postalCode),
    countryCode: resolveCountryCode(countryCode) ?? countryCode,
  };
}

function hashIdempotencyKey(input: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function resolveVariantId(row: CartRow, userProduct: UserProductRow | null) {
  const selectedVariant = row.selected_variant && typeof row.selected_variant === "object" ? row.selected_variant : null;
  const designRecord =
    userProduct?.design_data && typeof userProduct.design_data === "object"
      ? (userProduct.design_data as Record<string, unknown>)
      : null;
  const selectedVariantRecord =
    designRecord && typeof designRecord["selectedVariant"] === "object"
      ? (designRecord["selectedVariant"] as Record<string, unknown>)
      : null;
  return firstString(
    row.variant_id,
    selectedVariant?.id,
    designRecord ? designRecord["variantId"] : null,
    selectedVariantRecord ? selectedVariantRecord["id"] : null,
    selectedVariant ? (selectedVariant.sku as string) : null,
  );
}

function resolveProductUid(variant: VariantRow | null, row: CartRow, userProduct: UserProductRow | null, product: ProductRow | null | undefined) {
  const selectedVariant = row.selected_variant && typeof row.selected_variant === "object" ? row.selected_variant : null;
  const designData = userProduct?.design_data && typeof userProduct.design_data === "object" ? userProduct.design_data : null;
  return firstString(
    variant?.gelato_product_uid,
    selectedVariant?.gelato_product_uid,
    selectedVariant?.gelatoProductUid,
    userProduct?.gelato_product_uid,
    designData ? (designData.gelatoProductUid as string) : null,
    designData ? (designData.gelato_product_uid as string) : null,
    product?.gelato_product_uid,
  );
}

function collectFiles(value: unknown): GelatoFile[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const files: GelatoFile[] = [];
  const push = (type: string, url: unknown) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) return;
    const normalizedType = type.trim().toLowerCase() === "front" ? "default" : type.trim().toLowerCase();
    if (!files.some((entry) => entry.type === normalizedType && entry.url === url.trim())) {
      files.push({ type: normalizedType, url: url.trim() });
    }
  };
  if (Array.isArray(record.files)) {
    for (const entry of record.files) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, unknown>;
      push(String(item.type ?? item.side ?? "default"), item.url ?? item.fileUrl ?? item.printFileUrl ?? item.print_file_url);
    }
  }
  if (record.front) push("front", record.front);
  if (record.back) push("back", record.back);
  if (record.print_files && typeof record.print_files === "object") {
    const pf = record.print_files as Record<string, unknown>;
    push("front", pf.front);
    push("back", pf.back);
  }
  return files;
}

function asUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.url === "string" && record.url.trim()) return record.url.trim();
  if (typeof record.fileUrl === "string" && record.fileUrl.trim()) return record.fileUrl.trim();
  if (typeof record.printFileUrl === "string" && record.printFileUrl.trim()) return record.printFileUrl.trim();
  return null;
}

function buildProductionFiles(printFiles: Record<string, unknown> | null | undefined) {
  const record = printFiles && typeof printFiles === "object" ? printFiles : {};
  const seen = new Set<string>();
  const files: GelatoFile[] = [];
  const push = (type: "default" | "back", value: unknown) => {
    const url = asUrl(value);
    if (!url || url.includes("/mockups/") || seen.has(`${type}:${url}`) || seen.has(url)) return;
    seen.add(`${type}:${url}`);
    seen.add(url);
    files.push({ type, url });
  };

  push("default", record.front);
  push("default", record.default);
  push("default", record.front_url);
  push("back", record.back);
  push("back", record.back_url);

  return files;
}

function determineRequiredSides(userProduct: UserProductRow | null) {
  const designData = userProduct?.design_data && typeof userProduct.design_data === "object" ? (userProduct.design_data as Record<string, unknown>) : null;
  const frontElements = designData?.sides && typeof designData.sides === "object"
    ? (designData.sides as Record<string, unknown>).front && typeof (designData.sides as Record<string, unknown>).front === "object"
      ? ((designData.sides as Record<string, unknown>).front as Record<string, unknown>).elements
      : null
    : null;
  const backElements = designData?.sides && typeof designData.sides === "object"
    ? (designData.sides as Record<string, unknown>).back && typeof (designData.sides as Record<string, unknown>).back === "object"
      ? ((designData.sides as Record<string, unknown>).back as Record<string, unknown>).elements
      : null
    : null;
  const frontHasDesign = Array.isArray(frontElements) && frontElements.length > 0;
  const backHasDesign = Array.isArray(backElements) && backElements.length > 0;
  return { frontHasDesign, backHasDesign };
}

function log(event: string, data?: Record<string, unknown>) {
  console.info(event, data ?? {});
}

function gelatoRequestPayload(input: {
  idempotencyKey: string;
  currency: string;
  shippingMethod: NormalizedShippingMethod;
  address: ReturnType<typeof normalizeAddress>;
  items: Array<{ cartItemId: string; userProductId: string | null; productUid: string; quantity: number; files: GelatoFile[] }>;
  email: string;
}) {
  return {
    orderType: "draft" as const,
    orderReferenceId: input.idempotencyKey,
    customerReferenceId: input.email,
    currency: input.currency,
    shipmentMethodUid:
      input.shippingMethod.shipmentMethodUid ??
      input.shippingMethod.code ??
      input.shippingMethod.id,
    shippingAddress: {
      firstName: input.address.firstName,
      lastName: input.address.lastName,
      addressLine1: input.address.addressLine1,
      addressLine2: input.address.addressLine2,
      city: input.address.city,
      state: input.address.state,
      postCode: input.address.postalCode,
      country: input.address.countryCode,
      email: input.address.email,
      phone: input.address.phone ?? "",
    },
    items: input.items.map((item) => ({
      itemReferenceId: item.cartItemId,
      productUid: item.productUid,
      quantity: item.quantity,
      files: item.files,
      metadata: [
        { key: "cartItemId", value: item.cartItemId },
        { key: "userProductId", value: item.userProductId ?? "" },
      ].filter((entry) => entry.value),
    })),
    metadata: [
      { key: "source", value: "ryfio_checkout" },
      { key: "shippingMethodId", value: input.shippingMethod.id },
      { key: "shippingMethodCode", value: input.shippingMethod.code ?? "" },
    ].filter((entry) => entry.value),
  };
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();
    const body = (await req.json().catch(() => null)) as DraftBody | null;
    const cartItemIds = Array.from(new Set((body?.cartItemIds ?? []).filter(isUuid)));
    const shippingMethodInput = body?.shippingMethod ?? null;
    const address = normalizeAddress(body ?? {});

    console.info("[checkout:draft:01-request]", {
      cartItemCount: Array.isArray(body?.cartItemIds) ? body.cartItemIds.length : 0,
      hasAddress: Boolean(body?.address),
      hasShippingMethod: Boolean(body?.shippingMethod),
      selectedShippingMethod: body?.shippingMethod
        ? {
            id: body.shippingMethod.id ?? null,
            code: body.shippingMethod.code ?? null,
            shipmentMethodUid: body.shippingMethod.shipmentMethodUid ?? null,
            name: body.shippingMethod.name ?? null,
            price: body.shippingMethod.price ?? null,
            currency: body.shippingMethod.currency ?? null,
          }
        : null,
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[checkout:draft:02-auth-failed]", { message: authError.message ?? "Unknown auth error" });
    }
    console.info("[checkout:draft:02-auth]", {
      authenticated: Boolean(authData.user?.id),
      userIdSuffix: authData.user?.id ? authData.user.id.slice(-8) : null,
    });
    if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!cartItemIds.length) return NextResponse.json({ code: "MISSING_CART_ITEMS", success: false }, { status: 400 });
    if (!shippingMethodInput?.id || !shippingMethodInput.name || !shippingMethodInput.currency) {
      return NextResponse.json({ code: "MISSING_SHIPPING_METHOD", success: false }, { status: 400 });
    }
    if (!address.firstName || !address.lastName || !address.email || !address.addressLine1 || !address.city || !address.postalCode || !address.countryCode) {
      return NextResponse.json({ code: "ADDRESS_INVALID", success: false }, { status: 400 });
    }

    const { data: cartRows, error: cartError } = await supabase
      .from("cart_items")
      .select("id, user_id, product_id, variant_id, user_product_id, design_id, quantity, selected_variant, title")
      .eq("user_id", authData.user.id)
      .in("id", cartItemIds);
    if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 });
    if ((cartRows ?? []).length !== cartItemIds.length) return NextResponse.json({ error: "CART_OWNERSHIP_INVALID" }, { status: 403 });

    console.info("[checkout:draft:03-cart-items]", {
      requestedCount: cartItemIds.length,
      loadedCount: cartRows?.length ?? 0,
      items: (cartRows ?? []).map((item) => ({
        cartItemId: item.id,
        productId: item.product_id ?? null,
        userProductId: item.user_product_id ?? null,
        variantId: item.variant_id ?? null,
        sku: null,
        size: null,
        quantity: item.quantity ?? null,
        hasSelectedVariant: Boolean(item.selected_variant),
      })),
    });

    const userProductIds = Array.from(
      new Set(
        (cartRows ?? [])
          .map((item) => item.user_product_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    );
    const designIds = Array.from(new Set((cartRows ?? []).map((row) => row.design_id).filter((value): value is string => Boolean(value))));
    const productIds = Array.from(new Set((cartRows ?? []).map((row) => row.product_id)));
    const variantHints = Array.from(new Set((cartRows ?? []).map((row) => row.variant_id).filter((value): value is string => Boolean(value))));

    const productRowsPromise = supabase.from("products").select("id, gelato_product_uid").in("id", productIds);
    const variantRowsPromise = supabase.from("product_variants").select("id, sku, size, product_color_id, gelato_product_uid, name").in("id", variantHints);
    const userProductRowsPromise = userProductIds.length
      ? supabase
          .from("user_products")
          .select("id, user_id, design_data, print_files, mockups")
          .eq("user_id", authData.user.id)
          .in("id", userProductIds)
      : Promise.resolve({ data: [] as UserProductRow[], error: null });

    const [{ data: productRows }, { data: variantRows }, userProductResult] = await Promise.all([
      productRowsPromise,
      variantRowsPromise,
      userProductRowsPromise,
    ]);
    const userProductRows = "data" in userProductResult ? userProductResult.data : [];
    const userProductRowsError = "error" in userProductResult ? userProductResult.error : null;

    if (userProductRowsError) {
      console.error("[checkout:draft:user-products-query-failed]", {
        message: userProductRowsError.message,
        code: userProductRowsError.code,
        requestedCount: userProductIds.length,
      });
      return NextResponse.json(
        {
          success: false,
          code: "USER_PRODUCTS_QUERY_FAILED",
          message: "Unable to load user products for checkout draft.",
        },
        { status: 500 },
      );
    }

    const productMap = new Map((productRows ?? []).map((row) => [(row as ProductRow).id, row as ProductRow]));
    const variantMap = new Map((variantRows ?? []).map((row) => [(row as VariantRow).id, row as VariantRow]));
    const userProductById = new Map((userProductRows ?? []).map((row) => [(row as UserProductRow).id, row as UserProductRow]));

    const resolvedItems: Array<{ cartItemId: string; userProductId: string | null; productUid: string; quantity: number; files: GelatoFile[] }> = [];
    let subtotal = 0;
    const quoteCurrency = (body as { currency?: string | null } | null)?.currency?.trim() || "EUR";

    for (const cartRow of cartRows ?? []) {
      const userProductId = cartRow.user_product_id;
      const userProduct =
        typeof userProductId === "string"
          ? userProductById.get(userProductId) ?? null
          : null;
      const legacyDesignUserProduct = !userProduct && cartRow.design_id ? userProductById.get(cartRow.design_id) ?? null : null;
      const resolvedUserProduct = userProduct ?? legacyDesignUserProduct;
      console.info("[checkout:draft:user-product-resolution]", {
        cartItemId: cartRow.id,
        requestedUserProductId: cartRow.user_product_id ?? null,
        found: Boolean(resolvedUserProduct),
        resolvedUserProductId: resolvedUserProduct?.id ?? null,
        loadedUserProductsCount: userProductRows?.length ?? 0,
        loadedUserProductIds: (userProductRows ?? []).map((item) => item.id),
      });
      const variantId = resolveVariantId(cartRow as CartRow, resolvedUserProduct);
      const fallbackVariant = cartRow.variant_id ? variantMap.get(cartRow.variant_id) : undefined;
      const variant = variantId ? variantMap.get(variantId) ?? fallbackVariant ?? null : fallbackVariant ?? null;
      if (!variantId || !variant) {
        console.error("[checkout:draft:04-variant-failed]", {
          cartItemId: cartRow.id,
          productId: cartRow.product_id ?? null,
          variantId: cartRow.variant_id ?? null,
          sku: cartRow.selected_variant && typeof cartRow.selected_variant === "object" ? (cartRow.selected_variant as Record<string, unknown>).sku ?? null : null,
          size: cartRow.selected_variant && typeof cartRow.selected_variant === "object" ? (cartRow.selected_variant as Record<string, unknown>).size ?? null : null,
          selectedVariantKeys:
            cartRow.selected_variant && typeof cartRow.selected_variant === "object" ? Object.keys(cartRow.selected_variant) : [],
        });
        return conflict("MISSING_VARIANT", "Unable to resolve a variant for this cart item.", { cartItemId: cartRow.id });
      }

      const product = productMap.get(cartRow.product_id) ?? null;
      const productUid = resolveProductUid(variant, cartRow as CartRow, userProduct, product);
      if (!productUid) {
        return conflict("MISSING_PRODUCT_UID", "Unable to resolve the Gelato product UID for this cart item.", { cartItemId: cartRow.id });
      }

      const userDesignData = userProduct?.design_data && typeof userProduct.design_data === "object"
        ? (userProduct.design_data as Record<string, unknown>)
        : null;
      const userSelectedVariant = userDesignData?.selectedVariant && typeof userDesignData.selectedVariant === "object"
        ? (userDesignData.selectedVariant as Record<string, unknown>)
        : null;

      const resolutionSource =
        variant?.gelato_product_uid
          ? "variant"
          : cartRow.selected_variant && typeof cartRow.selected_variant === "object" && (cartRow.selected_variant as Record<string, unknown>).gelato_product_uid
            ? "selected_variant"
            : userProduct?.gelato_product_uid
              ? "user_product"
              : product?.gelato_product_uid
                ? "product"
                : "missing";
      console.info("[checkout:draft:04-variant-resolution]", {
        cartItemId: cartRow.id,
        originalVariantId: cartRow.variant_id ?? null,
        selectedVariantId: cartRow.selected_variant && typeof cartRow.selected_variant === "object" ? (cartRow.selected_variant as Record<string, unknown>).id ?? null : null,
        userProductVariantId: userDesignData?.variantId ?? userSelectedVariant?.id ?? null,
        resolvedVariantId: variant?.id ?? null,
        resolutionSource,
        sku: variant?.sku ?? cartRow.selected_variant?.sku ?? null,
        size: variant?.size ?? cartRow.selected_variant?.size ?? null,
        gelatoProductUidPresent: Boolean(productUid),
        gelatoProductUidPrefix: typeof productUid === "string" ? productUid.slice(0, 45) : null,
      });

      const designData = resolvedUserProduct?.design_data && typeof resolvedUserProduct.design_data === "object"
        ? (resolvedUserProduct.design_data as Record<string, unknown>)
        : null;
      const frontElements = designData?.sides && typeof designData.sides === "object" && (designData.sides as Record<string, unknown>).front && typeof (designData.sides as Record<string, unknown>).front === "object"
        ? ((designData.sides as Record<string, unknown>).front as Record<string, unknown>).elements
        : null;
      const backElements = designData?.sides && typeof designData.sides === "object" && (designData.sides as Record<string, unknown>).back && typeof (designData.sides as Record<string, unknown>).back === "object"
        ? ((designData.sides as Record<string, unknown>).back as Record<string, unknown>).elements
        : null;
      const frontHasDesign = Array.isArray(frontElements) && frontElements.length > 0;
      const backHasDesign = Array.isArray(backElements) && backElements.length > 0;
      const printFilesRecord = resolvedUserProduct?.print_files && typeof resolvedUserProduct.print_files === "object"
        ? (resolvedUserProduct.print_files as Record<string, unknown>)
        : {};
      const mockupsRecord = resolvedUserProduct?.mockups && typeof resolvedUserProduct.mockups === "object"
        ? (resolvedUserProduct.mockups as Record<string, unknown>)
        : {};
      const printFilesFinal = buildProductionFiles(printFilesRecord);
      const frontPrintFile = printFilesFinal.find((file) => file.type === "default")?.url ?? null;
      const backPrintFile = printFilesFinal.find((file) => file.type === "back")?.url ?? null;
      console.info("[checkout:draft:production-files]", {
        cartItemId: cartRow.id,
        printFilesFound: {
          front: asUrl(printFilesRecord.front) ?? asUrl(printFilesRecord.default) ?? asUrl(printFilesRecord.front_url) ?? null,
          back: asUrl(printFilesRecord.back) ?? asUrl(printFilesRecord.back_url) ?? null,
        },
        mockupsFound: {
          front: asUrl(mockupsRecord.front) ?? asUrl(mockupsRecord.front_url) ?? null,
          back: asUrl(mockupsRecord.back) ?? asUrl(mockupsRecord.back_url) ?? null,
        },
        filesSentToGelato: [
          ...printFilesFinal,
        ],
      });
      console.info("[checkout:draft:05-print-files]", {
        cartItemId: cartRow.id,
        userProductId: resolvedUserProduct?.id ?? null,
        frontHasDesign,
        backHasDesign,
        printFilesKeys: Object.keys(printFilesRecord),
        frontExists: Boolean(frontPrintFile),
        backExists: Boolean(backPrintFile),
        frontProtocol: typeof frontPrintFile === "string" ? frontPrintFile.split(":")[0] : null,
        backProtocol: typeof backPrintFile === "string" ? backPrintFile.split(":")[0] : null,
      });

      if (frontHasDesign && !frontPrintFile) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: ["front"],
        });
      }
      if (backHasDesign && !backPrintFile) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: ["back"],
        });
      }
      if (!frontPrintFile && !backPrintFile) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: frontHasDesign ? ["front"] : [],
        });
      }

      const quantity = Math.max(1, Number(cartRow.quantity) || 1);
      const containsMockupPath = printFilesFinal.some((file) => file.url.includes("/mockups/"));
      if (containsMockupPath) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: [],
        });
      }
      resolvedItems.push({ cartItemId: cartRow.id, userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null, productUid, quantity, files: printFilesFinal });
      subtotal += 0;
    }

    const quoteItems = resolvedItems.map((item) => ({
      itemReferenceId: item.cartItemId,
      productUid: item.productUid,
      quantity: item.quantity,
      printFiles: item.files,
    }));

    console.info("[checkout:draft:06-quote-items]", {
      count: quoteItems.length,
      items: quoteItems.map((item) => ({
        itemReferenceId: item.itemReferenceId ?? null,
        productUidPresent: Boolean(item.productUid),
        productUidPrefix: typeof item.productUid === "string" ? item.productUid.slice(0, 50) : null,
        quantity: item.quantity,
        printFilesCount: Array.isArray(item.printFiles) ? item.printFiles.length : 0,
        printFileTypes: Array.isArray(item.printFiles) ? item.printFiles.map((file) => file.type) : [],
        printFileProtocols: Array.isArray(item.printFiles)
          ? item.printFiles.map((file) => (typeof file.url === "string" ? file.url.split(":")[0] : null))
          : [],
      })),
    });

    console.info("[checkout:draft:07-address]", {
      countryCode: address.countryCode ?? null,
      postalCodeLength: address.postalCode?.length ?? 0,
      cityPresent: Boolean(address.city),
      addressLine1Present: Boolean(address.addressLine1),
      statePresent: Boolean(address.state),
      emailPresent: Boolean(address.email),
      phonePresent: Boolean(address.phone),
    });

    const quotePayload = buildGelatoCheckoutQuotePayload({
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress: {
        ...address,
        countryCode: address.countryCode,
      },
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: quoteCurrency,
    });

    const safeQuotePayload = {
      ...quotePayload,
      shippingAddress: quotePayload.recipient
        ? {
            country: quotePayload.recipient.countryIsoCode ?? null,
            postCodePresent: Boolean(quotePayload.recipient.postcode),
            cityPresent: Boolean(quotePayload.recipient.city),
            addressLine1Present: Boolean(quotePayload.recipient.addressLine1),
          }
        : null,
      products: Array.isArray(quotePayload.products)
        ? quotePayload.products.map((item) => ({
            itemReferenceId: item.itemReferenceId ?? null,
            productUid: item.productUid ?? null,
            quantity: item.quantity ?? null,
            pdfUrlPresent: Boolean(item.pdfUrl),
          }))
        : [],
    };

    console.info("[checkout:draft:08-gelato-quote-payload]", JSON.stringify(safeQuotePayload, null, 2));

    const quote = await resolveCheckoutQuote({
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress: {
        ...address,
        countryCode: address.countryCode,
      },
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: quoteCurrency,
    });

    if (process.env.NODE_ENV !== "production") {
      const rawQuote = quote.rawQuote && typeof quote.rawQuote === "object" ? (quote.rawQuote as Record<string, unknown>) : null;
      const rawData = rawQuote?.data && typeof rawQuote.data === "object" ? (rawQuote.data as Record<string, unknown>) : null;
      console.info("[checkout:draft:11-quote-shape]", {
        responseKeys: rawQuote ? Object.keys(rawQuote) : [],
        dataKeys: rawData ? Object.keys(rawData) : [],
        shippingMethodsCount: quote.shippingOptions.length,
      });
    }

    log("[checkout:draft-quote]", {
      available: quote.available,
      retryable: quote.retryable,
      reason: quote.reason ?? null,
      shippingMethodsCount: quote.shippingOptions.length,
    });

    console.info("[checkout:draft:09-gelato-http]", {
      status: quote.httpStatus,
      ok: quote.httpStatus ? quote.httpStatus >= 200 && quote.httpStatus < 300 : null,
      contentType: quote.contentType,
      bodyLength: quote.bodyLength,
    });

    if (quote.errorCode || quote.errorMessage || quote.requestId || quote.details) {
      console.error("[checkout:draft:10-gelato-error]", {
        httpStatus: quote.httpStatus,
        code: quote.errorCode ?? null,
        message: quote.errorMessage ?? null,
        requestId: quote.requestId ?? null,
        details: quote.details ?? null,
        responseKeys: quote.responseKeys,
      });
    }

    if (quote.retryable) {
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_QUOTE_FAILED",
          message: "Shipping could not be recalculated for the draft order.",
        },
        { status: 503 },
      );
    }

    if (!quote.available || quote.shippingOptions.length === 0) {
      return conflict(
        "INVALID_QUOTE_RESPONSE",
        "Gelato did not return shipping methods for the validated cart and address.",
        {
          responseKeys: quote.responseKeys,
          quoteReason: quote.quoteReason ?? quote.reason ?? null,
          quoteItemCount: quoteItems.length,
        },
      );
    }

    const shippingMethods = normalizeShippingMethods(quote.shippingOptions);
    for (const method of shippingMethods) {
      console.info("[checkout:draft:11-shipping-method]", {
        id: method.id,
        code: method.code ?? null,
        shipmentMethodUid: method.shipmentMethodUid ?? null,
        name: method.name,
        price: method.price,
        currency: method.currency,
      });
    }
    const matched =
      shippingMethods.find(
        (method) =>
          shippingMethodInput.shipmentMethodUid &&
          method.shipmentMethodUid &&
          method.shipmentMethodUid === shippingMethodInput.shipmentMethodUid,
      ) ??
      shippingMethods.find((method) => method.code && shippingMethodInput.code && method.code === shippingMethodInput.code) ??
      shippingMethods.find((method) => method.id === shippingMethodInput.id) ??
      shippingMethods.find(
        (method) =>
          method.name.trim().toLowerCase() === shippingMethodInput.name.trim().toLowerCase() &&
          method.currency === shippingMethodInput.currency,
      ) ??
      null;

    console.info("[checkout:draft:12-shipping-match]", {
      selectedId: shippingMethodInput.id ?? null,
      selectedCode: shippingMethodInput.code ?? null,
      selectedShipmentMethodUid: shippingMethodInput.shipmentMethodUid ?? null,
      availableCount: shippingMethods.length,
      matched: Boolean(matched),
      matchedId: matched?.id ?? null,
      matchedCode: matched?.code ?? null,
      matchedShipmentMethodUid: matched?.shipmentMethodUid ?? null,
    });

    if (!matched) {
      return conflict("SHIPPING_METHOD_EXPIRED", "The selected shipping method is no longer available.", {
        selectedId: shippingMethodInput.id,
        selectedCode: shippingMethodInput.code ?? null,
        availableIds: shippingMethods.map((method) => method.id),
        availableCodes: shippingMethods.map((method) => method.code ?? null),
      });
    }

    const selectedMinor = Math.round(Number(shippingMethodInput.price) * 100);
    const validatedMinor = Math.round(Number(matched.price) * 100);
    const priceChanged =
      selectedMinor !== validatedMinor ||
      matched.currency.toUpperCase() !== shippingMethodInput.currency.toUpperCase();
    if (priceChanged) {
      return conflict("SHIPPING_METHOD_CHANGED", "The selected shipping price has changed.", {
        selectedId: shippingMethodInput.id,
        selectedCode: shippingMethodInput.code ?? null,
        selectedPrice: shippingMethodInput.price,
        validatedPrice: matched.price,
        selectedCurrency: shippingMethodInput.currency,
        validatedCurrency: matched.currency,
      });
    }

    const idempotencyKey = hashIdempotencyKey({
      userId: authData.user.id,
      cartItemIds: [...cartItemIds].sort(),
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      shippingMethodId: shippingMethodInput.id,
    });

    const { data: existingDraft } = await supabase
      .from("checkout_drafts")
      .select("id, gelato_draft_order_id, shipping_method, subtotal, shipping_amount, total, currency")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingDraft?.gelato_draft_order_id) {
      return NextResponse.json({
        success: true,
        draftOrderId: existingDraft.id,
        gelatoDraftOrderId: existingDraft.gelato_draft_order_id,
        shippingMethod: shippingMethodInput,
        subtotal: existingDraft.subtotal ?? 0,
        shipping: existingDraft.shipping_amount ?? matched.price,
        total: existingDraft.total ?? matched.price,
        currency: existingDraft.currency ?? matched.currency,
      });
    }

    const gelatoPayload = gelatoRequestPayload({
      idempotencyKey,
      currency: quotePayload.order.currencyIsoCode,
      shippingMethod: matched,
      address,
      items: resolvedItems,
      email: authData.user.email ?? authData.user.id,
    });

    console.info("[checkout:draft:13-create-start]", {
      itemCount: gelatoPayload.items.length,
      shipmentMethodUidPresent: Boolean(gelatoPayload.shipmentMethodUid),
      currency: gelatoPayload.currency,
    });

    log("[checkout:variant-resolution]", { itemCount: resolvedItems.length });
    log("[checkout:shipping-validation]", { shippingMethodId: matched.id, shippingMethodCode: matched.code ?? null });

    const gelatoApiKey = process.env.GELATO_API_KEY?.trim();
    if (!gelatoApiKey) return NextResponse.json({ success: false, code: "GELATO_DRAFT_FAILED" }, { status: 500 });

    const gelatoResponse = await fetch(new URL("/v4/orders", process.env.GELATO_API_BASE_URL?.trim() || "https://order.gelatoapis.com"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": gelatoApiKey },
      body: JSON.stringify(gelatoPayload),
      cache: "no-store",
    });

    const gelatoStatus = gelatoResponse.status;
    const gelatoContentType = gelatoResponse.headers.get("content-type");
    const gelatoRawText = await gelatoResponse.text();
    console.info("[checkout:draft:15-body-read-start]");
    console.info("[checkout:draft:15-body-read-finished]", {
      bodyLength: gelatoRawText.length,
      preview: process.env.NODE_ENV !== "production" ? gelatoRawText.slice(0, 500) : undefined,
    });
    let gelatoBody: unknown = null;
    console.info("[checkout:draft:16-json-parse-start]");
    try {
      gelatoBody = gelatoRawText ? JSON.parse(gelatoRawText) : null;
    } catch (error) {
      console.error("[checkout:draft:16-json-parse-error]", error);
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_DRAFT_INVALID_RESPONSE",
          message: "Gelato returned an invalid Draft Order response.",
        },
        { status: 502 },
      );
    }
    console.info("[checkout:draft:16-json-parse-success]", {
      keys:
        gelatoBody && typeof gelatoBody === "object" && !Array.isArray(gelatoBody)
          ? Object.keys(gelatoBody as Record<string, unknown>)
          : [],
    });
    console.info("[checkout:draft:16-response-shape]", {
      bodyType: Array.isArray(gelatoBody) ? "array" : gelatoBody === null ? "null" : typeof gelatoBody,
      topLevelKeys:
        gelatoBody && typeof gelatoBody === "object" && !Array.isArray(gelatoBody)
          ? Object.keys(gelatoBody as Record<string, unknown>)
          : [],
      arrayLength: Array.isArray(gelatoBody) ? gelatoBody.length : null,
      firstItemKeys:
        Array.isArray(gelatoBody) && gelatoBody[0] && typeof gelatoBody[0] === "object"
          ? Object.keys(gelatoBody[0] as Record<string, unknown>)
          : [],
    });
    const gelatoError = gelatoBody && typeof gelatoBody === "object" ? (gelatoBody as Record<string, unknown>) : null;
    if (!gelatoResponse.ok) {
      console.error("[checkout:draft:10-gelato-error]", {
        httpStatus: gelatoStatus,
        code: gelatoError?.code ?? null,
        message: gelatoError?.message ?? null,
        requestId: gelatoError?.requestId ?? null,
        details: gelatoError?.details ?? null,
        responseKeys: gelatoError ? Object.keys(gelatoError) : [],
      });
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_QUOTE_FAILED",
          message: typeof gelatoError?.message === "string" ? gelatoError.message : "Gelato quote failed.",
          gelatoCode: gelatoError?.code ?? null,
          gelatoRequestId: gelatoError?.requestId ?? null,
          gelatoDetails: gelatoError?.details ?? null,
        },
        { status: 502 },
      );
    }

    function extractGelatoOrderId(body: unknown): string | null {
      const candidates: unknown[] = [];

      const collect = (value: unknown) => {
        if (!value || typeof value !== "object") return;

        const row = value as Record<string, unknown>;
        candidates.push(row.id, row.orderId, row.order_id, row.draftOrderId, row.orderReferenceId);

        if (row.order && typeof row.order === "object") {
          const order = row.order as Record<string, unknown>;
          candidates.push(order.id, order.orderId, order.order_id, order.orderReferenceId);
        }

        if (row.data && typeof row.data === "object") {
          const data = row.data as Record<string, unknown>;
          candidates.push(data.id, data.orderId, data.order_id, data.draftOrderId, data.orderReferenceId);
        }

        if (row.orders && Array.isArray(row.orders)) {
          for (const order of row.orders) collect(order);
        }
      };

      if (Array.isArray(body)) {
        for (const item of body) collect(item);
      } else {
        collect(body);
      }

      const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
      return typeof found === "string" ? found.trim() : null;
    }

    console.info("[checkout:draft:17-id-resolution-start]");
    const gelatoDraftOrderId = extractGelatoOrderId(gelatoBody);
    const gelatoOrderReferenceId = (gelatoResponse as any)?.orderReferenceId ?? (gelatoBody as any)?.orderReferenceId ?? null;
    console.info("[checkout:draft:17-id-resolution]", {
      gelatoDraftOrderId,
      orderId: (gelatoBody as Record<string, unknown> | null)?.id ?? null,
      externalId: (gelatoBody as Record<string, unknown> | null)?.orderId ?? null,
      reference: (gelatoBody as Record<string, unknown> | null)?.orderReferenceId ?? null,
      gelatoDraftOrderIdPresent: Boolean(gelatoDraftOrderId),
    });
    if (!gelatoDraftOrderId) {
      console.error("[checkout:draft:17-id-missing]", gelatoBody);
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_DRAFT_ID_MISSING",
          message: "Gelato created the draft but did not return a recognized order ID.",
        },
        { status: 502 },
      );
    }
    const draftRow = {
      user_id: authData.user.id,
      cart_item_ids: cartItemIds,
      idempotency_key: idempotencyKey,
      status: "draft",
      gelato_draft_order_id: gelatoDraftOrderId,
      order_reference_id: gelatoOrderReferenceId ?? idempotencyKey,
      selected_shipping_method: {
        id: matched.id,
        code: matched.code,
        name: matched.name,
        price: matched.price,
        currency: matched.currency,
      },
      shipping_address: address,
      subtotal,
      shipping_amount: matched.price,
      total: subtotal + matched.price,
      currency: matched.currency,
      gelato_response: {
        id: gelatoDraftOrderId,
        status: gelatoStatus,
      },
      updated_at: new Date().toISOString(),
    };

    console.info("[checkout:draft:18-persist-start]", {
      table: "checkout_drafts",
      userIdPresent: Boolean(authData.user.id),
      gelatoDraftOrderIdPresent: Boolean(gelatoDraftOrderId),
      cartItemCount: cartItemIds.length,
      idempotencyKeyPresent: Boolean(idempotencyKey),
      currency: matched.currency,
    });
    console.info("[checkout:draft:18-row]", {
      keys: Object.keys(draftRow),
      draftOrderIdPresent: Boolean((draftRow as { draft_order_id?: unknown }).draft_order_id),
      gelatoDraftOrderIdPresent: Boolean(draftRow.gelato_draft_order_id),
    });

    console.info("[checkout:draft:19-insert-start]");
    const { data: savedDraft, error: saveError } = await supabase
      .from("checkout_drafts")
      .upsert(draftRow, { onConflict: "idempotency_key" })
      .select("id, gelato_draft_order_id, status")
      .single();

    console.info("[checkout:draft:19-persist-result]", {
      hasData: Boolean(savedDraft),
      data: savedDraft,
      draftOrderId: savedDraft?.id ?? null,
      gelatoDraftOrderId: savedDraft?.gelato_draft_order_id ?? null,
      status: savedDraft?.status ?? null,
      error: saveError
        ? {
            code: saveError.code ?? null,
            message: saveError.message ?? null,
            details: saveError.details ?? null,
            hint: saveError.hint ?? null,
          }
        : null,
    });

    if (saveError || !savedDraft) {
      console.error("[checkout:draft:persist-failed]", {
        code: saveError?.code ?? null,
        message: saveError?.message ?? null,
        details: saveError?.details ?? null,
        hint: saveError?.hint ?? null,
      });
      const isMissingTable =
        saveError?.code === "42P01" ||
        /does not exist/i.test(saveError?.message ?? "") ||
        /does not exist/i.test(saveError?.details ?? "") ||
        /relation .*checkout_drafts/i.test(saveError?.message ?? "");
      return NextResponse.json(
        isMissingTable
          ? {
              success: false,
              code: "CHECKOUT_DRAFTS_TABLE_MISSING",
              message: "The checkout draft storage is not configured.",
            }
          : {
              success: false,
              code: "DRAFT_PERSIST_FAILED",
              message: "The draft was created but could not be saved.",
            },
        { status: isMissingTable ? 500 : 500 },
      );
    }

    log("[checkout:draft-created]", { draftOrderId: savedDraft.id });

    console.info("[checkout:draft:20-success-response]", {
      checkoutDraftId: savedDraft?.id ?? null,
      gelatoDraftOrderId,
    });

    return NextResponse.json({
      success: true,
      draftOrderId: savedDraft.id,
      gelatoDraftOrderId: savedDraft.gelato_draft_order_id ?? gelatoDraftOrderId,
      shippingMethod: {
        id: matched.id,
        code: matched.code,
        name: matched.name,
        price: matched.price,
        currency: matched.currency,
      },
      subtotal,
      shipping: matched.price,
      total: subtotal + matched.price,
      currency: matched.currency,
    });
  } catch (error) {
    console.error("[checkout:draft:99-unhandled]", {
      name: error instanceof Error ? error.name : null,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      {
        success: false,
        code: "GELATO_DRAFT_FAILED",
        message: error instanceof Error ? error.message : "Unexpected checkout draft error.",
      },
      { status: 500 },
    );
  }
}
