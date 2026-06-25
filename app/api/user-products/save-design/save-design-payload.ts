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
      sideValue(incomingPrintFiles, side),
      body[`print${upperSide}`],
      body[`printFile${upperSide}`],
      body[`printImage${upperSide}`],
      body[`production${upperSide}`],
      getNested(body, ["printFiles", side]),
      getNested(body, ["print_files", side]),
      sideData.printFile,
      sideData.printImage,
      sideData.designImage,
    );
  }

  if (kind === "mockup") {
    return firstValue(
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
    sideData.designImage,
    body[`editor${upperSide}`],
    body[`editorImage${upperSide}`],
    body[`designImage${upperSide}`],
    getNested(body, ["editor", side]),
    getNested(body, ["editorFiles", side]),
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
  const value = firstValue(
    body.selectedVariant,
    body.selected_variant,
    body.productVariant,
    body.product_variant,
    body.variant,
    incomingDesignData.selectedVariant,
  );

  if (value && typeof value === "object") return value;

  const id = firstValue(body.variantId, body.variant_id, body.productVariantId, body.product_variant_id);
  const size = firstValue(body.size, body.selectedSize, body.variantSize);
  const sku = firstValue(body.sku, body.variantSku);

  return id || size || sku ? { id, size, sku } : null;
}

type UploadDesignImageArgs = {
  userId: string;
  designId: string;
  side: DesignSide;
  kind: DesignAssetKind;
  dataUrl: unknown;
};

export async function uploadDesignImageToR2(
  args: UploadDesignImageArgs,
): Promise<R2UploadResult> {
  if (isHttpUrl(args.dataUrl)) {
    return { key: null, url: args.dataUrl };
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

  const printFront = await uploadDesignImageToR2({
    userId,
    designId,
    side: "front",
    kind: "print",
    dataUrl: frontPrintSource,
  });

  const printBack = await uploadDesignImageToR2({
    userId,
    designId,
    side: "back",
    kind: "print",
    dataUrl: backPrintSource,
  });

  const editorFront = await uploadDesignImageToR2({
    userId,
    designId,
    side: "front",
    kind: "editor",
    dataUrl: frontEditorSource || frontPrintSource,
  });

  const editorBack = await uploadDesignImageToR2({
    userId,
    designId,
    side: "back",
    kind: "editor",
    dataUrl: backEditorSource || backPrintSource,
  });

  const uploadedMockupFront = await uploadDesignImageToR2({
    userId,
    designId,
    side: "front",
    kind: "mockups",
    dataUrl: frontMockupSource,
  });

  const uploadedMockupBack = await uploadDesignImageToR2({
    userId,
    designId,
    side: "back",
    kind: "mockups",
    dataUrl: backMockupSource,
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
        printFileUrl: printFront.url || null,
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
        printFileUrl: printBack.url || null,
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
    images: [
      mockupFront.url,
      mockupBack.url,
      editorFront.url,
      editorBack.url,
      printFront.url,
      printBack.url,
      ...baseImages,
    ].filter(Boolean),
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
