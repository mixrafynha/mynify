import { createSupabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_GELATO_PRODUCT_BASE_URL = "https://product.gelatoapis.com";
const SEARCH_PAGE_SIZE = 100;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type GelatoCatalogListItem = {
  catalogUid: string;
  title: string;
};

export type GelatoCatalogAttributeValue = {
  productAttributeValueUid: string;
  title: string;
};

export type GelatoCatalogAttribute = {
  productAttributeUid: string;
  title: string;
  values: GelatoCatalogAttributeValue[];
};

export type GelatoCatalog = {
  catalogUid: string;
  title: string;
  productAttributes: GelatoCatalogAttribute[];
};

export type GelatoCatalogSearchProduct = {
  productUid: string;
  attributes: Record<string, string>;
  dimensions?: Record<string, { value: number; measureUnit: string }>;
  weight?: { value: number; measureUnit: string };
};

export type GelatoCatalogSearchResponse = {
  products: GelatoCatalogSearchProduct[];
  hits?: {
    attributeHits?: Record<string, Record<string, number>>;
  };
};

export type CatalogSyncFilters = Record<string, string[]>;

type ProductRow = {
  id: string;
  image: string | null;
};

type ExistingColorRow = {
  id: string;
  product_id: string;
  color: string | null;
  color_hex: string | null;
  mockup_front: string | null;
  mockup_back: string | null;
  thumbnail: string | null;
  position: number | null;
  gelato_color_key: string | null;
  gelato_sync_status: string | null;
};

type ExistingVariantRow = {
  id: string;
  product_color_id: string;
  size: string | null;
  sku: string | null;
  stock: number | null;
  price: number | string | null;
  name: string | null;
  gelato_product_uid: string | null;
  gelato_variant_uid: string | null;
  gelato_variant_key: string | null;
  gelato_sync_status: string | null;
};

type DerivedVariantEntry = ReturnType<typeof variantKeyFromProduct> & {
  product: GelatoCatalogSearchProduct;
};

export type SyncCatalogInput = {
  productId: string;
  catalogUid: string;
  attributeFilters?: CatalogSyncFilters;
};

export type SyncCatalogResult = {
  productId: string;
  catalogUid: string;
  catalogTitle: string;
  filters: CatalogSyncFilters;
  productsFetched: number;
  colorsCreated: number;
  colorsUpdated: number;
  colorsDeactivated: number;
  variantsCreated: number;
  variantsUpdated: number;
  variantsDeactivated: number;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function getGelatoProductBaseUrl(): string {
  return cleanBaseUrl(
    process.env.GELATO_PRODUCT_API_BASE_URL?.trim() ||
      process.env.GELATO_API_PRODUCT_BASE_URL?.trim() ||
      DEFAULT_GELATO_PRODUCT_BASE_URL,
  );
}

function getGelatoApiKey(): string {
  const apiKey = process.env.GELATO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing GELATO_API_KEY.");
  }
  return apiKey;
}

async function gelatoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getGelatoProductBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": getGelatoApiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const payloadRecord = isPlainObject(payload) ? payload : null;
    const message =
      cleanString(payloadRecord?.message) ||
      cleanString(payloadRecord?.error) ||
      `Gelato request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

function normalizeFilters(value: unknown): CatalogSyncFilters {
  if (!isPlainObject(value)) return {};

  const entries = Object.entries(value).flatMap(([attributeUid, rawValues]) => {
    if (!Array.isArray(rawValues)) return [];
    const values = rawValues
      .map((entry) => cleanString(entry))
      .filter((entry): entry is string => Boolean(entry));

    return values.length > 0 ? [[attributeUid, [...new Set(values)]]] : [];
  });

  return Object.fromEntries(entries);
}

function validateCatalogUid(catalogUid: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/i.test(catalogUid)) {
    throw new Error("Invalid catalogUid.");
  }
}

function validateProductUid(productUid: string) {
  if (!/^[a-z0-9][a-z0-9._-]{2,255}$/i.test(productUid)) {
    throw new Error(`Invalid productUid: ${productUid}`);
  }
}

function buildAttributeTitleMap(
  catalog: GelatoCatalog,
): Map<string, GelatoCatalogAttribute> {
  return new Map(
    catalog.productAttributes.map((attribute) => [
      attribute.productAttributeUid,
      attribute,
    ]),
  );
}

export function validateAttributeFilters(
  catalog: GelatoCatalog,
  filters: CatalogSyncFilters,
): CatalogSyncFilters {
  const attributeMap = buildAttributeTitleMap(catalog);

  for (const [attributeUid, values] of Object.entries(filters)) {
    const attribute = attributeMap.get(attributeUid);
    if (!attribute) {
      throw new Error(`Unknown Gelato attribute filter: ${attributeUid}`);
    }

    const validValues = new Set(
      attribute.values.map((value) => value.productAttributeValueUid),
    );

    for (const value of values) {
      if (!validValues.has(value)) {
        throw new Error(
          `Invalid Gelato attribute value "${value}" for ${attributeUid}.`,
        );
      }
    }
  }

  return filters;
}

function humanizeAttributeValue(
  attributeMap: Map<string, GelatoCatalogAttribute>,
  attributeUid: string,
  valueUid: string | null | undefined,
): string | null {
  if (!valueUid) return null;
  const attribute = attributeMap.get(attributeUid);
  const value = attribute?.values.find(
    (entry) => entry.productAttributeValueUid === valueUid,
  );
  return value?.title ?? valueUid;
}

function detectColorAttributeKey(attributes: Record<string, string>): string | null {
  const preferredKeys = [
    "Color",
    "Colour",
    "GarmentColor",
    "ColorName",
    "ColourName",
    "FabricColor",
  ];

  for (const key of preferredKeys) {
    if (attributes[key]) return key;
  }

  return (
    Object.keys(attributes).find((key) => /(^|_)(color|colour)(_|$)/i.test(key)) ??
    null
  );
}

function detectSizeAttributeKey(attributes: Record<string, string>): string | null {
  const preferredKeys = [
    "Size",
    "ApparelSize",
    "PaperFormat",
    "Format",
    "Dimensions",
  ];

  for (const key of preferredKeys) {
    if (attributes[key]) return key;
  }

  return (
    Object.keys(attributes).find((key) => /(^|_)(size|format|dimension)(_|$)/i.test(key)) ??
    null
  );
}

function deriveColorData(
  product: GelatoCatalogSearchProduct,
  attributeMap: Map<string, GelatoCatalogAttribute>,
) {
  const colorAttributeUid = detectColorAttributeKey(product.attributes);
  const colorValueUid = colorAttributeUid ? product.attributes[colorAttributeUid] : null;
  const colorTitle =
    humanizeAttributeValue(attributeMap, colorAttributeUid ?? "", colorValueUid) ||
    "Default";

  return {
    colorKey: normalizeKey(colorTitle),
    colorName: colorTitle,
    colorAttributeUid,
    colorValueUid,
  };
}

function deriveSizeData(
  product: GelatoCatalogSearchProduct,
  attributeMap: Map<string, GelatoCatalogAttribute>,
) {
  const sizeAttributeUid = detectSizeAttributeKey(product.attributes);
  const sizeValueUid = sizeAttributeUid ? product.attributes[sizeAttributeUid] : null;
  const sizeTitle =
    humanizeAttributeValue(attributeMap, sizeAttributeUid ?? "", sizeValueUid) ||
    product.productUid;

  return {
    sizeKey: normalizeKey(sizeTitle),
    sizeName: sizeTitle,
    sizeAttributeUid,
    sizeValueUid,
  };
}

function variantKeyFromProduct(
  product: GelatoCatalogSearchProduct,
  attributeMap: Map<string, GelatoCatalogAttribute>,
) {
  const color = deriveColorData(product, attributeMap);
  const size = deriveSizeData(product, attributeMap);

  return {
    ...color,
    ...size,
    variantKey: normalizeKey(`${color.colorKey}__${size.sizeKey}`),
  };
}

async function getProductOrThrow(productId: string): Promise<ProductRow> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("id, image")
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Product not found.");
  }

  return data as ProductRow;
}

export async function listGelatoCatalogs(): Promise<GelatoCatalogListItem[]> {
  return gelatoFetch<GelatoCatalogListItem[]>("/v3/catalogs", { method: "GET" });
}

export async function getGelatoCatalog(catalogUid: string): Promise<GelatoCatalog> {
  validateCatalogUid(catalogUid);
  return gelatoFetch<GelatoCatalog>(`/v3/catalogs/${catalogUid}`, { method: "GET" });
}

export async function searchGelatoCatalogProducts(
  catalogUid: string,
  filters: CatalogSyncFilters,
  limit = SEARCH_PAGE_SIZE,
  offset = 0,
): Promise<GelatoCatalogSearchResponse> {
  validateCatalogUid(catalogUid);
  return gelatoFetch<GelatoCatalogSearchResponse>(
    `/v3/catalogs/${catalogUid}/products:search`,
    {
      method: "POST",
      body: JSON.stringify({
        attributeFilters: filters,
        limit,
        offset,
      }),
    },
  );
}

async function fetchAllGelatoProducts(
  catalogUid: string,
  filters: CatalogSyncFilters,
): Promise<GelatoCatalogSearchProduct[]> {
  const allProducts: GelatoCatalogSearchProduct[] = [];
  let offset = 0;

  while (true) {
    const page = await searchGelatoCatalogProducts(
      catalogUid,
      filters,
      SEARCH_PAGE_SIZE,
      offset,
    );

    const products = Array.isArray(page.products) ? page.products : [];
    for (const product of products) {
      validateProductUid(product.productUid);
      allProducts.push(product);
    }

    if (products.length < SEARCH_PAGE_SIZE) {
      break;
    }

    offset += SEARCH_PAGE_SIZE;
  }

  return allProducts;
}

function nowIso() {
  return new Date().toISOString();
}

async function saveSyncState(
  productId: string,
  state: Record<string, JsonValue>,
) {
  const supabase = createSupabaseAdmin();
  const payload = {
    product_id: productId,
    updated_at: nowIso(),
    ...state,
  };

  const { error } = await supabase
    .from("gelato_catalog_sync_state")
    .upsert(payload, { onConflict: "product_id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncGelatoCatalog(
  input: SyncCatalogInput,
): Promise<SyncCatalogResult> {
  const productId = cleanString(input.productId);
  const catalogUid = cleanString(input.catalogUid);
  const rawFilters = normalizeFilters(input.attributeFilters);

  if (!productId) throw new Error("Missing productId.");
  if (!catalogUid) throw new Error("Missing catalogUid.");

  await getProductOrThrow(productId);

  const startedAt = nowIso();
  await saveSyncState(productId, {
    catalog_uid: catalogUid,
    sync_status: "running",
    attribute_filters: rawFilters as unknown as JsonValue,
    last_synced_at: startedAt,
    last_error: null,
  });

  try {
    const [catalog, existingProduct] = await Promise.all([
      getGelatoCatalog(catalogUid),
      getProductOrThrow(productId),
    ]);
    const filters = validateAttributeFilters(catalog, rawFilters);
    const attributeMap = buildAttributeTitleMap(catalog);
    const products = await fetchAllGelatoProducts(catalogUid, filters);
    const supabase = createSupabaseAdmin();

    const { data: colorRows, error: colorsError } = await supabase
      .from("product_colors")
      .select(
        "id, product_id, color, color_hex, mockup_front, mockup_back, thumbnail, position, gelato_color_key, gelato_sync_status",
      )
      .eq("product_id", productId);

    if (colorsError) throw new Error(colorsError.message);

    const existingColors = (colorRows ?? []) as ExistingColorRow[];
    const existingColorIds = existingColors.map((color) => color.id);
    let existingVariants: ExistingVariantRow[] = [];

    if (existingColorIds.length > 0) {
      const { data: variantRows, error: variantsError } = await supabase
        .from("product_variants")
        .select(
          "id, product_color_id, size, sku, stock, price, name, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status",
        )
        .in("product_color_id", existingColorIds);

      if (variantsError) throw new Error(variantsError.message);
      existingVariants = (variantRows ?? []) as ExistingVariantRow[];
    }

    const colorsByKey = new Map<string, ExistingColorRow>();
    for (const color of existingColors) {
      const fallbackKey = normalizeKey(color.color ?? "");
      const key = color.gelato_color_key ?? fallbackKey;
      if (key && !colorsByKey.has(key)) {
        colorsByKey.set(key, color);
      }
    }

    const variantsByColorIdAndKey = new Map<string, ExistingVariantRow>();
    for (const variant of existingVariants) {
      const fallbackKey = normalizeKey(
        `${variant.product_color_id}__${variant.size ?? variant.name ?? variant.id}`,
      );
      const key = `${variant.product_color_id}::${
        variant.gelato_variant_key ?? fallbackKey
      }`;
      if (!variantsByColorIdAndKey.has(key)) {
        variantsByColorIdAndKey.set(key, variant);
      }
    }

    const touchedColorIds = new Set<string>();
    const touchedVariantIds = new Set<string>();
    const colorIdByKey = new Map<string, string>();

    let colorsCreated = 0;
    let colorsUpdated = 0;
    let variantsCreated = 0;
    let variantsUpdated = 0;

    const groupedProducts = new Map<string, DerivedVariantEntry[]>();

    for (const product of products) {
      const variantMeta = variantKeyFromProduct(product, attributeMap);
      const existing = groupedProducts.get(variantMeta.colorKey) ?? [];
      existing.push({ ...variantMeta, product });
      groupedProducts.set(variantMeta.colorKey, existing);
    }

    for (const [colorKey, entries] of groupedProducts.entries()) {
      const firstEntry = entries[0];
      const existingColor = colorsByKey.get(colorKey);

      let colorId = existingColor?.id ?? null;
      const colorPayload = {
        product_id: productId,
        color: firstEntry.colorName,
        color_hex: existingColor?.color_hex ?? "#cccccc",
        mockup_front: existingColor?.mockup_front ?? existingProduct.image,
        mockup_back: existingColor?.mockup_back ?? null,
        thumbnail: existingColor?.thumbnail ?? existingProduct.image,
        position: existingColor?.position ?? colorIdByKey.size,
        gelato_color_key: colorKey,
        gelato_attributes: {
          attributeUid: firstEntry.colorAttributeUid,
          attributeValueUid: firstEntry.colorValueUid,
        },
        gelato_sync_status: "active",
        gelato_last_seen_at: startedAt,
      };

      if (existingColor) {
        const { error } = await supabase
          .from("product_colors")
          .update(colorPayload)
          .eq("id", existingColor.id);
        if (error) throw new Error(error.message);
        colorId = existingColor.id;
        colorsUpdated += 1;
      } else {
        const { data, error } = await supabase
          .from("product_colors")
          .insert(colorPayload)
          .select("id")
          .single();
        if (error || !data?.id) throw new Error(error?.message || "Failed to create product color.");
        colorId = data.id as string;
        colorsCreated += 1;
      }

      touchedColorIds.add(colorId);
      colorIdByKey.set(colorKey, colorId);

      for (const entry of entries) {
        const variantLookupKey = `${colorId}::${entry.variantKey}`;
        const existingVariant = variantsByColorIdAndKey.get(variantLookupKey);
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: entry.sizeName,
          sku: existingVariant?.sku ?? null,
          stock: existingVariant?.stock ?? 0,
          price: existingVariant?.price ?? null,
          gelato_product_uid: entry.product.productUid,
          gelato_variant_uid: entry.product.productUid,
          gelato_variant_key: entry.variantKey,
          gelato_attributes: entry.product.attributes,
          gelato_sync_status: "active",
          gelato_last_seen_at: startedAt,
        };

        if (existingVariant) {
          const { error } = await supabase
            .from("product_variants")
            .update(variantPayload)
            .eq("id", existingVariant.id);
          if (error) throw new Error(error.message);
          touchedVariantIds.add(existingVariant.id);
          variantsUpdated += 1;
        } else {
          const { data, error } = await supabase
            .from("product_variants")
            .insert(variantPayload)
            .select("id")
            .single();
          if (error || !data?.id) {
            throw new Error(error?.message || "Failed to create product variant.");
          }
          touchedVariantIds.add(data.id as string);
          variantsCreated += 1;
        }
      }
    }

    const staleColorIds = existingColors
      .filter((color) => color.gelato_color_key && !touchedColorIds.has(color.id))
      .map((color) => color.id);

    const staleVariantIds = existingVariants
      .filter(
        (variant) => variant.gelato_variant_key && !touchedVariantIds.has(variant.id),
      )
      .map((variant) => variant.id);

    if (staleColorIds.length > 0) {
      const { error } = await supabase
        .from("product_colors")
        .update({
          gelato_sync_status: "inactive",
        })
        .in("id", staleColorIds);
      if (error) throw new Error(error.message);
    }

    if (staleVariantIds.length > 0) {
      const { error } = await supabase
        .from("product_variants")
        .update({
          gelato_sync_status: "inactive",
        })
        .in("id", staleVariantIds);
      if (error) throw new Error(error.message);
    }

    const result: SyncCatalogResult = {
      productId,
      catalogUid: catalog.catalogUid,
      catalogTitle: catalog.title,
      filters,
      productsFetched: products.length,
      colorsCreated,
      colorsUpdated,
      colorsDeactivated: staleColorIds.length,
      variantsCreated,
      variantsUpdated,
      variantsDeactivated: staleVariantIds.length,
    };

    await saveSyncState(productId, {
      catalog_uid: catalog.catalogUid,
      catalog_title: catalog.title,
      sync_status: "success",
      attribute_filters: filters as unknown as JsonValue,
      last_synced_at: startedAt,
      last_success_at: nowIso(),
      last_error: null,
      synced_products_count: result.productsFetched,
      synced_colors_count:
        result.colorsCreated + result.colorsUpdated - result.colorsDeactivated,
      synced_variants_count:
        result.variantsCreated + result.variantsUpdated - result.variantsDeactivated,
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Gelato sync error.";

    await saveSyncState(productId, {
      catalog_uid: catalogUid,
      sync_status: "failed",
      attribute_filters: rawFilters as unknown as JsonValue,
      last_synced_at: startedAt,
      last_error: message,
    });

    throw error;
  }
}
