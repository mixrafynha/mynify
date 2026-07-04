import type { createSupabaseServer } from "@/lib/supabase-server";
import {
  buildR2DesignKey,
  cleanDataUrls,
  dataUrlToBuffer,
  isDataImage,
  sideValue,
} from "./image-utils";
import type { DesignAssetKind, DesignSide } from "./image-utils";
import { uploadBufferToR2, type R2UploadResult } from "./r2";

export function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return (value ?? fallback) as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function arrayValue(value: unknown) {
  const parsed = parseJsonIfString<unknown>(value, value);
  return Array.isArray(parsed) ? parsed : [];
}

function objectValue<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  const parsed = parseJsonIfString<unknown>(value, value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as T)
    : fallback;
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function extractR2KeyFromPublicUrl(value: unknown) {
  if (!isHttpUrl(value)) return null;

  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    // Ryfio public R2 URLs are stored as /users/{userId}/...
    // Keep this permissive so old/new public domains both resolve to the same key.
    const usersIndex = pathname.indexOf("users/");
    if (usersIndex >= 0) return pathname.slice(usersIndex);

    return pathname || null;
  } catch {
    return null;
  }
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? null;
}

function getNested(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return null;
    return (current as Record<string, unknown>)[key] ?? null;
  }, value);
}

function pickSideImage(args: {
  body: any;
  incomingDesignData: any;
  incomingSides: any;
  incomingPrintFiles: any;
  incomingMockups: any;
  side: DesignSide;
  kind: "print" | "mockup" | "editor";
}) {
  const { body, incomingDesignData, incomingSides, incomingPrintFiles, incomingMockups, side, kind } = args;

  const sideData = incomingSides?.[side] || incomingDesignData?.sides?.[side] || {};
  const upperSide = side === "front" ? "Front" : "Back";

  if (kind === "print") {
    return firstValue(
      getNested(incomingPrintFiles, [side, "url"]),
      getNested(incomingPrintFiles, [side, "publicUrl"]),
      getNested(incomingPrintFiles, [side, "dataUrl"]),
      sideValue(incomingPrintFiles, side),
      body[`print${upperSide}`],
      body[`printFile${upperSide}`],
      body[`printImage${upperSide}`],
      body[`production${upperSide}`],
      getNested(body, ["printFiles", side]),
      getNested(body, ["print_files", side]),
      sideData.printFile,
      sideData.printFileUrl,
      sideData.printImage,
      sideData.productionFileUrl,
      sideData.designImage,
      sideData.designImageUrl,
      sideData.editorFileUrl,
    );
  }

  if (kind === "mockup") {
    return firstValue(
      getNested(incomingMockups, [side, "url"]),
      getNested(incomingMockups, [side, "publicUrl"]),
      getNested(incomingMockups, [side, "dataUrl"]),
      sideValue(incomingMockups, side),
      body[`mockup${upperSide}`],
      body[`mockupImage${upperSide}`],
      body[`mockupUrl${upperSide}`],
      body[`preview${upperSide}`],
      body[`previewImage${upperSide}`],
      body[`previewMockup${upperSide}`],
      body[`generatedMockup${upperSide}`],
      getNested(body, ["mockups", side]),
      getNested(body, ["mockupFiles", side]),
      getNested(body, ["previewData", side, "mockup"]),
      getNested(body, ["previewData", side, "mockupImage"]),
      getNested(body, ["previewData", side, "image"]),
      getNested(body, ["previews", side]),
      sideData.mockup,
      sideData.mockupImage,
      sideData.previewImage,
      sideData.preview,
      sideData.mockupUrl,
    );
  }

  return firstValue(
    sideData.editorImage,
    sideData.editorFile,
    sideData.editorFileUrl,
    sideData.designImage,
    sideData.designImageUrl,
    body[`editor${upperSide}`],
    body[`editorImage${upperSide}`],
    body[`designImage${upperSide}`],
    getNested(body, ["editor", side]),
    getNested(body, ["editorFiles", side]),
  );
}

function pickSideKey(args: {
  body: any;
  incomingDesignData: any;
  incomingSides: any;
  incomingPrintFiles: any;
  incomingMockups: any;
  side: DesignSide;
  kind: "print" | "mockup" | "editor";
}) {
  const { body, incomingDesignData, incomingSides, incomingPrintFiles, incomingMockups, side, kind } = args;
  const sideData = incomingSides?.[side] || incomingDesignData?.sides?.[side] || {};
  const upperSide = side === "front" ? "Front" : "Back";

  if (kind === "print") {
    return firstValue(
      getNested(incomingPrintFiles, ["keys", side]),
      getNested(incomingPrintFiles, [side, "key"]),
      getNested(incomingPrintFiles, [side, "storageKey"]),
      getNested(body, ["printFiles", "keys", side]),
      getNested(body, ["print_files", "keys", side]),
      body[`print${upperSide}Key`],
      body[`printFile${upperSide}Key`],
      sideData.printFileKey,
      sideData.storageKey,
      getNested(incomingDesignData, ["production", "fileDiagnostics", side, "storageKey"]),
    );
  }

  if (kind === "mockup") {
    return firstValue(
      getNested(incomingMockups, ["keys", side]),
      getNested(incomingMockups, [side, "key"]),
      getNested(incomingMockups, [side, "storageKey"]),
      getNested(body, ["mockups", "keys", side]),
      getNested(body, ["mockupFiles", "keys", side]),
      body[`mockup${upperSide}Key`],
      body[`mockupImage${upperSide}Key`],
      sideData.mockupKey,
    );
  }

  return firstValue(
    getNested(body, ["editorFiles", "keys", side]),
    body[`editor${upperSide}Key`],
    body[`editorImage${upperSide}Key`],
    sideData.editorFileKey,
    sideData.designImageKey,
  );
}

function getSelectedColor(body: any, incomingDesignData: any) {
  const value = firstValue(
    body.selectedColor,
    body.selected_color,
    body.productColor,
    body.product_color,
    body.variantColor,
    body.variant_color,
    incomingDesignData.selectedColor,
    incomingDesignData.productColor,
  );

  if (value && typeof value === "object") return value;

  const hex = firstValue(
    body.colorHex,
    body.color,
    body.mockupColor,
    body.selectedColorHex,
    incomingDesignData.mockupColor,
    incomingDesignData.color,
  );

  const name = firstValue(
    body.colorName,
    body.selectedColorName,
    body.productColorName,
  );

  return hex || name ? { hex, name } : null;
}

function getSelectedVariant(body: any, incomingDesignData: any) {
  const raw = firstValue(
    body.selectedVariant,
    body.selected_variant,
    body.productVariant,
    body.product_variant,
    body.variant,
    incomingDesignData.selectedVariant,
  );

  const rawVariant = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const variantId = firstValue(
    rawVariant.variantId,
    rawVariant.id,
    body.variantId,
    body.variant_id,
    body.selectedVariantId,
    body.selected_variant_id,
    body.productVariantId,
    body.product_variant_id,
  );
  const size = firstValue(rawVariant.size, body.size, body.selectedSize, body.variantSize);
  const sku = firstValue(rawVariant.sku, body.sku, body.variantSku);
  const gelatoProductUid = firstValue(
    rawVariant.gelatoProductUid,
    rawVariant.gelato_product_uid,
    rawVariant.productUid,
    rawVariant.product_uid,
    body.gelatoProductUid,
    body.gelato_product_uid,
    body.productUid,
    body.product_uid,
    incomingDesignData.gelatoProductUid,
    incomingDesignData.gelato_product_uid,
    incomingDesignData.productUid,
    incomingDesignData.product_uid,
  );
  const gelatoVariantUid = firstValue(
    rawVariant.gelatoVariantUid,
    rawVariant.gelato_variant_uid,
    body.gelatoVariantUid,
    body.gelato_variant_uid,
    incomingDesignData.gelatoVariantUid,
    incomingDesignData.gelato_variant_uid,
  );

  if (!variantId && !size && !sku && !gelatoProductUid && !gelatoVariantUid && !Object.keys(rawVariant).length) {
    return null;
  }

  return {
    ...rawVariant,
    id: firstValue(rawVariant.id, variantId),
    variantId,
    size,
    sku,
    productUid: gelatoProductUid,
    product_uid: gelatoProductUid,
    gelatoProductUid,
    gelato_product_uid: gelatoProductUid,
    gelatoVariantUid,
    gelato_variant_uid: gelatoVariantUid,
  };
}

type UploadDesignImageArgs = {
  userId: string;
  designId: string;
  side: DesignSide;
  kind: DesignAssetKind;
  dataUrl: unknown;
  storageKey?: unknown;
};

export async function uploadDesignImageToR2(
  args: UploadDesignImageArgs,
): Promise<R2UploadResult> {
  if (isHttpUrl(args.dataUrl)) {
    const existingKey =
      typeof args.storageKey === "string" && args.storageKey.trim()
        ? args.storageKey.trim().replace(/^\/+/, "")
        : extractR2KeyFromPublicUrl(args.dataUrl);

    return { key: existingKey, url: args.dataUrl };
  }

  if (!isDataImage(args.dataUrl)) {
    return { key: null, url: null };
  }

  const { buffer, mimeType, extension } = dataUrlToBuffer(args.dataUrl);
  const key = buildR2DesignKey({
    userId: args.userId,
    designId: args.designId,
    kind: args.kind,
    side: args.side,
    extension,
  });

  return uploadBufferToR2({
    key,
    buffer,
    contentType: mimeType,
  });
}

export async function getBaseProduct(args: {
  supabase: ReturnType<typeof createSupabaseServer>;
  baseProductId: string;
}) {
  let productQuery = args.supabase
    .from("products")
    .select(`
      id,
      title,
      description,
      price,
      currency,
      image,
      images,
      category,
      slug
    `);

  productQuery = isUuid(args.baseProductId)
    ? productQuery.eq("id", args.baseProductId)
    : productQuery.or(`slug.eq.${args.baseProductId},category.eq.${args.baseProductId}`);

  const { data, error } = await productQuery.maybeSingle();

  if (error || !data) {
    return {
      baseProduct: null,
      productError: error || new Error("Base product not found"),
    };
  }

  return { baseProduct: data, productError: null };
}

export async function buildUserProductSavePayload(args: {
  body: any;
  userId: string;
  designId: string;
  baseProduct: any;
}) {
  const { body, userId, designId, baseProduct } = args;

  const incomingDesignData = objectValue<any>(body.design_data || body.designData, {});
  const incomingPrintFiles = objectValue<any>(body.printFiles || body.print_files, {});
  const incomingMockups = objectValue<any>(body.mockups || body.mockupFiles, {});
  const incomingSides = objectValue<any>(body.sides || incomingDesignData.sides, {});

  const frontElements = arrayValue(
    body.designFront || body.design_front || incomingSides?.front?.elements,
  );
  const backElements = arrayValue(
    body.designBack || body.design_back || incomingSides?.back?.elements,
  );

  const frontPrintSource = pickSideImage({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "front",
    kind: "print",
  });
  const backPrintSource = pickSideImage({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "back",
    kind: "print",
  });
  const frontMockupSource = pickSideImage({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "front",
    kind: "mockup",
  });
  const backMockupSource = pickSideImage({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "back",
    kind: "mockup",
  });
  const frontEditorSource = pickSideImage({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "front",
    kind: "editor",
  });
  const backEditorSource = pickSideImage({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "back",
    kind: "editor",
  });

  const frontPrintKey = pickSideKey({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "front",
    kind: "print",
  });
  const backPrintKey = pickSideKey({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "back",
    kind: "print",
  });
  const frontMockupKey = pickSideKey({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "front",
    kind: "mockup",
  });
  const backMockupKey = pickSideKey({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "back",
    kind: "mockup",
  });
  const frontEditorKey = pickSideKey({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "front",
    kind: "editor",
  });
  const backEditorKey = pickSideKey({
    body,
    incomingDesignData,
    incomingSides,
    incomingPrintFiles,
    incomingMockups,
    side: "back",
    kind: "editor",
  });

  const printFront = await uploadDesignImageToR2({
    userId,
    designId,
    side: "front",
    kind: "print",
    dataUrl: frontPrintSource,
    storageKey: frontPrintKey,
  });

  const printBack = await uploadDesignImageToR2({
    userId,
    designId,
    side: "back",
    kind: "print",
    dataUrl: backPrintSource,
    storageKey: backPrintKey,
  });

  const editorFront = await uploadDesignImageToR2({
    userId,
    designId,
    side: "front",
    kind: "editor",
    dataUrl: frontEditorSource || frontPrintSource,
    storageKey: frontEditorKey || frontPrintKey,
  });

  const editorBack = await uploadDesignImageToR2({
    userId,
    designId,
    side: "back",
    kind: "editor",
    dataUrl: backEditorSource || backPrintSource,
    storageKey: backEditorKey || backPrintKey,
  });

  const uploadedMockupFront = await uploadDesignImageToR2({
    userId,
    designId,
    side: "front",
    kind: "mockups",
    dataUrl: frontMockupSource,
    storageKey: frontMockupKey,
  });

  const uploadedMockupBack = await uploadDesignImageToR2({
    userId,
    designId,
    side: "back",
    kind: "mockups",
    dataUrl: backMockupSource,
    storageKey: backMockupKey,
  });

  // mockups must be real product mockups/previews only.
  // Do not fallback to transparent print files here, otherwise the cart thumbnail looks wrong.
  const mockupFront = {
    key: uploadedMockupFront.key,
    url: uploadedMockupFront.url || null,
  };
  const mockupBack = {
    key: uploadedMockupBack.key,
    url: uploadedMockupBack.url || null,
  };

  const productMarkup = Number(body.markup || 0);
  const basePrice = Number(baseProduct.price || 0);
  const finalPrice = basePrice + productMarkup;

  const printBox = objectValue<any>(body.printBox || body.print_box, {
    front: incomingSides?.front?.printBox || incomingDesignData?.sides?.front?.printBox || null,
    back: incomingSides?.back?.printBox || incomingDesignData?.sides?.back?.printBox || null,
  });

  const safeArea = objectValue<any>(body.safeArea || body.safe_area, {
    front: incomingSides?.front?.safeArea || incomingDesignData?.sides?.front?.safeArea || null,
    back: incomingSides?.back?.safeArea || incomingDesignData?.sides?.back?.safeArea || null,
  });

  const selectedColor = getSelectedColor(body, incomingDesignData);
  const selectedVariant = getSelectedVariant(body, incomingDesignData);

  const designData = cleanDataUrls({
    schemaVersion: body.schemaVersion || incomingDesignData.schemaVersion || 4,
    productId: baseProduct.id,
    category: baseProduct.category || body.category || incomingDesignData.category || null,
    color: body.color || body.mockupColor || incomingDesignData.color || null,
    mockupColor: body.mockupColor || body.color || incomingDesignData.mockupColor || null,
    selectedColor,
    selectedVariant,
    productUid: selectedVariant?.productUid || incomingDesignData.productUid || incomingDesignData.product_uid || null,
    product_uid: selectedVariant?.product_uid || incomingDesignData.product_uid || incomingDesignData.productUid || null,
    gelatoProductUid: selectedVariant?.gelatoProductUid || incomingDesignData.gelatoProductUid || incomingDesignData.gelato_product_uid || null,
    gelato_product_uid: selectedVariant?.gelato_product_uid || incomingDesignData.gelato_product_uid || incomingDesignData.gelatoProductUid || null,
    gelatoVariantUid: selectedVariant?.gelatoVariantUid || incomingDesignData.gelatoVariantUid || incomingDesignData.gelato_variant_uid || null,
    gelato_variant_uid: selectedVariant?.gelato_variant_uid || incomingDesignData.gelato_variant_uid || incomingDesignData.gelatoVariantUid || null,
    status: body.status || incomingDesignData.status || "draft",
    sides: {
      front: {
        ...(incomingDesignData?.sides?.front || {}),
        side: "front",
        elements: frontElements,
        printBox: printBox.front || null,
        safeArea: safeArea.front || null,
        designImage: null,
        designImageUrl: editorFront.url || null,
        editorFileUrl: editorFront.url || null,
        printFileKey: printFront.key || null,
        printFileUrl: printFront.url || null,
        mockupKey: mockupFront.key || null,
        mockupUrl: mockupFront.url || null,
      },
      back: {
        ...(incomingDesignData?.sides?.back || {}),
        side: "back",
        elements: backElements,
        printBox: printBox.back || null,
        safeArea: safeArea.back || null,
        designImage: null,
        designImageUrl: editorBack.url || null,
        editorFileUrl: editorBack.url || null,
        printFileKey: printBack.key || null,
        printFileUrl: printBack.url || null,
        mockupKey: mockupBack.key || null,
        mockupUrl: mockupBack.url || null,
      },
    },
    production: incomingDesignData.production || body.production || null,
  }) as any;

  const bestPreviewImage =
    mockupFront.url ||
    mockupBack.url ||
    baseProduct.image ||
    editorFront.url ||
    editorBack.url ||
    printFront.url ||
    printBack.url ||
    null;

  const baseImages = Array.isArray(baseProduct.images) ? baseProduct.images : [];

  return {
    id: designId,
    user_id: userId,
    base_product_id: baseProduct.id,
    title: body.title || baseProduct.title,
    description: body.description ?? baseProduct.description ?? null,
    price: basePrice,
    currency: baseProduct.currency || "USD",
    image: bestPreviewImage,
    images: Array.from(
      new Set([
        mockupFront.url,
        mockupBack.url,
        ...baseImages,
      ].filter(Boolean)),
    ),
    category: baseProduct.category || body.category || null,
    slug: `${baseProduct.slug || "product"}-${designId.slice(0, 8)}`,
    design_front: frontElements,
    design_back: backElements,
    design_data: designData,
    print_files: {
      front: printFront.url,
      back: printBack.url,
      keys: {
        front: printFront.key,
        back: printBack.key,
      },
    },
    mockups: {
      front: mockupFront.url,
      back: mockupBack.url,
      keys: {
        front: uploadedMockupFront.key,
        back: uploadedMockupBack.key,
      },
    },
    print_box: printBox,
    safe_area: safeArea,
    design_image_url: editorFront.url || editorBack.url || null,
    ai_mockup_url: mockupFront.url || mockupBack.url || null,
    ai_mockup_images: [mockupFront.url, mockupBack.url].filter(Boolean),
    markup: productMarkup,
    final_price: finalPrice,
    status: body.status || "draft",
    cart_status: body.cartStatus || body.cart_status || "in_cart",
    is_active: true,
    design_version: body.schemaVersion || incomingDesignData.schemaVersion || 4,
    updated_at: new Date().toISOString(),
  };
}
