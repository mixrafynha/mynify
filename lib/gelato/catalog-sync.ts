import { createSupabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_GELATO_PRODUCT_BASE_URL = "https://product.gelatoapis.com";
const SEARCH_PAGE_SIZE = 100;
const GELATO_REQUEST_TIMEOUT_MS = 15000;

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

export type GelatoProductDetails = GelatoCatalogSearchProduct & {
  countries?: unknown;
  shippingMethods?: unknown;
  availability?: unknown;
  [key: string]: unknown;
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
  productUid?: string;
  attributeFilters?: CatalogSyncFilters;
  pageOffset?: number;
  gelatoProductUid?: string;
};

export type SyncCatalogResult = {
  productId: string;
  catalogUid: string;
  productUid?: string;
  catalogTitle: string;
  filters: CatalogSyncFilters;
  gelatoProductUid: string | null;
  pageOffset: number;
  nextOffset: number | null;
  completed: boolean;
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GELATO_REQUEST_TIMEOUT_MS);

  const response = await fetch(`${getGelatoProductBaseUrl()}${path}`, {
    ...init,
    signal: init?.signal ?? controller.signal,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": getGelatoApiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  }).finally(() => clearTimeout(timeoutId));

  if (controller.signal.aborted && !init?.signal) {
    throw new Error(`Gelato request timed out after ${GELATO_REQUEST_TIMEOUT_MS}ms.`);
  }

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

function getDefaultPublishedFilter(catalog: GelatoCatalog): CatalogSyncFilters {
  const stateAttribute = catalog.productAttributes.find(
    (attribute) => attribute.productAttributeUid === "State",
  );

  if (!stateAttribute) return {};

  const publishedValue = stateAttribute.values.find(
    (value) => value.productAttributeValueUid === "Published",
  );

  if (!publishedValue) return {};

  return {
    State: ["Published"],
  };
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
    "GarmentSize",
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

function buildFamilyFilters(
  attributes: Record<string, string>,
  ignoreKeys: string[] = [],
): CatalogSyncFilters {
  const ignored = new Set(ignoreKeys);
  const entries = Object.entries(attributes).flatMap(([attributeUid, valueUid]) => {
    if (ignored.has(attributeUid)) return [];
    if (!cleanString(valueUid)) return [];
    return [[attributeUid, [valueUid.trim()]]];
  });

  return Object.fromEntries(entries);
}

const COLOR_HEX_MAP: Record<string, string> = {
  banana: "#f4d35e",
  berry: "#7b2cbf",
  black: "#111111",
  blue: "#2563eb",
  boysenberry: "#7b2cbf",
  brown: "#7c4a2d",
  celadon: "#9dc3a7",
  chambray: "#8fb3d9",
  charcoal: "#4b4b4b",
  citrus: "#f7c948",
  cinnamon: "#a0522d",
  clay: "#b5654d",
  cream: "#f3ead7",
  cumin: "#a67c52",
  emerald: "#10b981",
  forest: "#166534",
  grape: "#7c3aed",
  gray: "#9ca3af",
  grey: "#9ca3af",
  heather: "#b8b8b8",
  ice: "#cfe8f3",
  "ice-blue": "#cfe8f3",
  ivory: "#f8f1e6",
  khaki: "#c3b091",
  kiwi: "#7cb342",
  lemon: "#f7df1e",
  magenta: "#d946ef",
  maroon: "#7f1d1d",
  melon: "#f4a261",
  midnight: "#1f2937",
  moss: "#6b8e23",
  navy: "#1e3a8a",
  "neon-blue": "#38bdf8",
  olive: "#556b2f",
  orchid: "#c084fc",
  peony: "#f472b6",
  periwinkle: "#8da2fb",
  pink: "#f9a8d4",
  plum: "#7e22ce",
  red: "#dc2626",
  sage: "#9caf88",
  sandstone: "#c8b08a",
  seafoam: "#9ee7cf",
  silver: "#c0c0c0",
  slate: "#64748b",
  teal: "#0f766e",
  "true-navy": "#1e293b",
  violet: "#8b5cf6",
  white: "#ffffff",
  yellow: "#facc15",
  "washed-denim": "#7aa7c7",
  "island-reef": "#4fb3a7",
};

function getColorHex(colorName: string | null | undefined): string {
  const normalized = normalizeKey(colorName ?? "");
  return COLOR_HEX_MAP[normalized] ?? "#cccccc";
}

function deriveFamilyAttributes(attributes: Record<string, string>): Record<string, string> {
  const familyKeysToDrop = new Set([
    "Color",
    "Colour",
    "GarmentColor",
    "ColorName",
    "ColourName",
    "FabricColor",
    "Size",
    "ApparelSize",
    "PaperFormat",
    "Format",
    "Dimensions",
    "ProductUid",
    "productUid",
    "VariantUid",
    "variantUid",
  ]);

  return Object.fromEntries(
    Object.entries(attributes).filter(([key, value]) => {
      if (familyKeysToDrop.has(key)) return false;
      return Boolean(cleanString(value));
    }),
  );
}

function deriveFamilyColorName(product: GelatoCatalogSearchProduct): string {
  const attributeKey = detectColorAttributeKey(product.attributes);
  if (!attributeKey) return "Default";
  return cleanString(product.attributes[attributeKey]) ?? "Default";
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
    colorHex: getColorHex(colorTitle),
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

export async function getGelatoProduct(productUid: string): Promise<GelatoProductDetails> {
  validateProductUid(productUid);
  return gelatoFetch<GelatoProductDetails>(`/v3/products/${productUid}`, { method: "GET" });
}

async function fetchAllGelatoProducts(
  catalogUid: string,
  filters: CatalogSyncFilters,
): Promise<GelatoCatalogSearchProduct[]> {
  const allProducts: GelatoCatalogSearchProduct[] = [];
  const seenProductUids = new Set<string>();
  let offset = 0;

  while (true) {
    const page = await searchGelatoCatalogProducts(
      catalogUid,
      filters,
      SEARCH_PAGE_SIZE,
      offset,
    );

    const products = Array.isArray(page.products) ? page.products : [];
    let addedCount = 0;
    for (const product of products) {
      validateProductUid(product.productUid);
      if (seenProductUids.has(product.productUid)) {
        continue;
      }

      seenProductUids.add(product.productUid);
      allProducts.push(product);
      addedCount += 1;
    }

    if (products.length < SEARCH_PAGE_SIZE || addedCount === 0) {
      break;
    }

    offset += SEARCH_PAGE_SIZE;

    if (offset > 50_000) {
      throw new Error("Gelato product search exceeded the safe pagination limit.");
    }
  }

  return allProducts;
}

async function fetchGelatoProductPage(
  catalogUid: string,
  filters: CatalogSyncFilters,
  offset: number,
): Promise<GelatoCatalogSearchProduct[]> {
  const page = await searchGelatoCatalogProducts(
    catalogUid,
    filters,
    SEARCH_PAGE_SIZE,
    offset,
  );

  const seenProductUids = new Set<string>();
  const products = Array.isArray(page.products) ? page.products : [];
  const uniqueProducts: GelatoCatalogSearchProduct[] = [];

  for (const product of products) {
    validateProductUid(product.productUid);
    if (seenProductUids.has(product.productUid)) {
      continue;
    }

    seenProductUids.add(product.productUid);
    uniqueProducts.push(product);
  }

  return uniqueProducts;
}

function dedupeProductsByUid(
  products: GelatoCatalogSearchProduct[],
): GelatoCatalogSearchProduct[] {
  const seen = new Set<string>();
  const unique: GelatoCatalogSearchProduct[] = [];

  for (const product of products) {
    if (seen.has(product.productUid)) continue;
    seen.add(product.productUid);
    unique.push(product);
  }

  return unique;
}

export async function fetchExactGelatoProduct(
  catalogUid: string,
  productUid: string,
  filters: CatalogSyncFilters,
): Promise<{
  matchedProduct: GelatoCatalogSearchProduct;
  matchedFilters: CatalogSyncFilters;
}> {
  validateCatalogUid(catalogUid);
  validateProductUid(productUid);

  const product = await getGelatoProduct(productUid);
  const attributes = isPlainObject(product.attributes) ? product.attributes : {};

  return {
    matchedProduct: {
      ...product,
      productUid,
      attributes: attributes as Record<string, string>,
    },
    matchedFilters: {},
  };
}

function extractVariantUidFromAttributes(
  attributes: Record<string, string>,
): string | null {
  const candidate = cleanString(attributes.VariantUid) ?? cleanString(attributes.variantUid);
  if (!candidate) return null;
  validateProductUid(candidate);
  return candidate;
}

function extractCountries(product: GelatoProductDetails): string[] {
  const rawCountries = [
    ...(Array.isArray(product.countries) ? product.countries : []),
    ...(
      isPlainObject(product.availability) && Array.isArray(product.availability.countries)
        ? product.availability.countries
        : []
    ),
  ];
  if (!Array.isArray(rawCountries)) return [];

  return rawCountries
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (isPlainObject(entry)) {
        const code = cleanString(entry.countryIso ?? entry.iso ?? entry.code);
        const name = cleanString(entry.country ?? entry.title ?? entry.name);
        return code ?? name ?? null;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
}

function extractShippingMethods(product: GelatoProductDetails): JsonValue[] {
  const rawShippingMethods = [
    ...(Array.isArray(product.shippingMethods) ? product.shippingMethods : []),
    ...(
      isPlainObject(product.availability) && Array.isArray(product.availability.shippingMethods)
        ? product.availability.shippingMethods
        : []
    ),
  ];
  if (!Array.isArray(rawShippingMethods)) return [];

  return rawShippingMethods.map((method) => {
    if (isPlainObject(method)) {
      return {
        ...method,
        countries: Array.isArray(method.countries)
          ? method.countries
              .map((country) =>
                typeof country === "string"
                  ? country.trim()
                  : isPlainObject(country)
                    ? cleanString(country.countryIso ?? country.iso ?? country.code) ??
                      cleanString(country.country ?? country.title ?? country.name)
                    : null,
              )
              .filter((value): value is string => Boolean(value))
          : [],
      } as unknown as JsonValue;
    }

    return method as JsonValue;
  });
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

  const upsertState = async (value: Record<string, JsonValue>) =>
    supabase.from("gelato_catalog_sync_state").upsert(value, { onConflict: "product_id" });

  let { error } = await upsertState(payload);

  const missingProductUidColumn =
    error?.message?.includes("Could not find the 'product_uid' column") ||
    error?.message?.includes("column \"product_uid\" of relation \"gelato_catalog_sync_state\" does not exist");

  if (error && missingProductUidColumn) {
    const legacyPayload: Record<string, JsonValue> = { ...payload };
    delete legacyPayload.product_uid;
    ({ error } = await upsertState(legacyPayload));
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncGelatoCatalog(
  input: SyncCatalogInput,
): Promise<SyncCatalogResult> {
  const productId = cleanString(input.productId);
  const catalogUid = cleanString(input.catalogUid);
  const productUid =
    cleanString(input.productUid) ?? cleanString(input.gelatoProductUid);
  const rawFilters = normalizeFilters(input.attributeFilters);

  if (!productId) throw new Error("Missing productId.");
  if (!catalogUid) throw new Error("Missing catalogUid.");
  if (!productUid) throw new Error("Missing productUid.");

  validateProductUid(productUid);
  await getProductOrThrow(productId);

  const startedAt = nowIso();
  const effectiveFilters: CatalogSyncFilters = {};
  await saveSyncState(productId, {
    catalog_uid: catalogUid,
    product_uid: productUid,
    sync_status: "running",
    attribute_filters: effectiveFilters as unknown as JsonValue,
    last_synced_at: startedAt,
    last_error: null,
  });

  try {
    const [catalog, existingProduct] = await Promise.all([
      getGelatoCatalog(catalogUid),
      getProductOrThrow(productId),
    ]);
    const { matchedProduct, matchedFilters } = await fetchExactGelatoProduct(
      catalogUid,
      productUid,
      effectiveFilters,
    );
    const attributeMap = buildAttributeTitleMap(catalog);
    const products = [matchedProduct];
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
    const variantsByGelatoProductUid = new Map<string, ExistingVariantRow>();
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
      if (variant.gelato_product_uid && !variantsByGelatoProductUid.has(variant.gelato_product_uid)) {
        variantsByGelatoProductUid.set(variant.gelato_product_uid, variant);
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
      const duplicateIndex = existing.findIndex(
        (entry) => entry.product.productUid === product.productUid,
      );
      const nextEntry = { ...variantMeta, product };
      if (duplicateIndex >= 0) {
        existing[duplicateIndex] = nextEntry;
      } else {
        existing.push(nextEntry);
      }
      groupedProducts.set(variantMeta.colorKey, existing);
    }

    for (const [colorKey, entries] of groupedProducts.entries()) {
      const firstEntry = entries[0];
      const existingColor = colorsByKey.get(colorKey);

      let colorId = existingColor?.id ?? null;
      const colorPayload = {
        product_id: productId,
        color: firstEntry.colorName,
        color_hex: existingColor?.color_hex ?? firstEntry.colorHex,
        mockup_front: existingColor?.mockup_front ?? existingProduct.image,
        mockup_back: existingColor?.mockup_back ?? null,
        thumbnail: existingColor?.thumbnail ?? existingProduct.image,
        position: existingColor?.position ?? colorIdByKey.size,
        gelato_color_key: colorKey,
        gelato_attributes: {
          attributeUid: firstEntry.colorAttributeUid,
          attributeValueUid: firstEntry.colorValueUid,
          colorHex: firstEntry.colorHex,
          countries: [],
          shippingMethods: [],
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
        const existingVariant =
          variantsByColorIdAndKey.get(variantLookupKey) ??
          variantsByGelatoProductUid.get(entry.product.productUid);
        const gelatoVariantUid = extractVariantUidFromAttributes(entry.product.attributes);
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: entry.sizeName,
          sku: existingVariant?.sku ?? null,
          stock: existingVariant?.stock ?? 0,
          price: existingVariant?.price ?? null,
          gelato_product_uid: entry.product.productUid,
          gelato_variant_uid: gelatoVariantUid,
          gelato_variant_key: entry.variantKey,
          gelato_attributes: {
            ...entry.product.attributes,
            colorHex: entry.colorHex,
            countries: [],
            shippingMethods: [],
          },
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
      productUid: matchedProduct.productUid,
      catalogTitle: catalog.title,
      filters: matchedFilters,
      gelatoProductUid: matchedProduct.productUid,
      pageOffset: 0,
      nextOffset: null,
      completed: true,
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
      product_uid: matchedProduct.productUid,
      catalog_title: catalog.title,
      sync_status: "success",
      attribute_filters: matchedFilters as unknown as JsonValue,
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
      product_uid: productUid,
      sync_status: "failed",
      attribute_filters: effectiveFilters as unknown as JsonValue,
      last_synced_at: startedAt,
      last_error: message,
    });

    throw error;
  }
}

export async function syncGelatoCatalogPage(
  input: SyncCatalogInput,
): Promise<SyncCatalogResult> {
  const productId = cleanString(input.productId);
  const catalogUid = cleanString(input.catalogUid);
  const rawFilters = normalizeFilters(input.attributeFilters);
  const pageOffset = Number.isFinite(input.pageOffset ?? 0)
    ? Math.max(0, Number(input.pageOffset ?? 0))
    : 0;
  const gelatoProductUid =
    cleanString(input.gelatoProductUid) ?? cleanString(input.productUid);

  if (!productId) throw new Error("Missing productId.");
  if (!catalogUid) throw new Error("Missing catalogUid.");
  if (gelatoProductUid) validateProductUid(gelatoProductUid);

  if (gelatoProductUid) {
    return syncGelatoCatalog({
      productId,
      catalogUid,
      productUid: gelatoProductUid,
      gelatoProductUid,
    });
  }

  await getProductOrThrow(productId);

  const startedAt = nowIso();
  const supabase = createSupabaseAdmin();

  await saveSyncState(productId, {
    catalog_uid: catalogUid,
    product_uid: gelatoProductUid,
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
    const filters = validateAttributeFilters(
      catalog,
      Object.keys(rawFilters).length > 0 ? rawFilters : getDefaultPublishedFilter(catalog),
    );
    const attributeMap = buildAttributeTitleMap(catalog);
    const products = await fetchGelatoProductPage(catalogUid, filters, pageOffset);

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
    const variantsByGelatoProductUid = new Map<string, ExistingVariantRow>();
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
      if (variant.gelato_product_uid && !variantsByGelatoProductUid.has(variant.gelato_product_uid)) {
        variantsByGelatoProductUid.set(variant.gelato_product_uid, variant);
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
      const duplicateIndex = existing.findIndex(
        (entry) => entry.product.productUid === product.productUid,
      );
      const nextEntry = { ...variantMeta, product };
      if (duplicateIndex >= 0) {
        existing[duplicateIndex] = nextEntry;
      } else {
        existing.push(nextEntry);
      }
      groupedProducts.set(variantMeta.colorKey, existing);
    }

    for (const [colorKey, entries] of groupedProducts.entries()) {
      const firstEntry = entries[0];
      const existingColor = colorsByKey.get(colorKey);
      let colorId = existingColor?.id ?? null;
      const colorPayload = {
        product_id: productId,
        color: firstEntry.colorName,
        color_hex: existingColor?.color_hex ?? firstEntry.colorHex,
        mockup_front: existingColor?.mockup_front ?? existingProduct.image,
        mockup_back: existingColor?.mockup_back ?? null,
        thumbnail: existingColor?.thumbnail ?? existingProduct.image,
        position: existingColor?.position ?? colorIdByKey.size,
        gelato_color_key: colorKey,
        gelato_attributes: {
          attributeUid: firstEntry.colorAttributeUid,
          attributeValueUid: firstEntry.colorValueUid,
          colorHex: firstEntry.colorHex,
          countries: [],
          shippingMethods: [],
        },
        gelato_sync_status: "active",
        gelato_last_seen_at: startedAt,
      };

      if (existingColor) {
        const { error } = await supabase.from("product_colors").update(colorPayload).eq("id", existingColor.id);
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
        const existingVariant =
          variantsByColorIdAndKey.get(variantLookupKey) ??
          variantsByGelatoProductUid.get(entry.product.productUid);
        const gelatoVariantUid = extractVariantUidFromAttributes(entry.product.attributes);
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: entry.sizeName,
          sku: existingVariant?.sku ?? null,
          stock: existingVariant?.stock ?? 0,
          price: existingVariant?.price ?? null,
          gelato_product_uid: entry.product.productUid,
          gelato_variant_uid: gelatoVariantUid,
          gelato_variant_key: entry.variantKey,
          gelato_attributes: {
            ...entry.product.attributes,
            colorHex: entry.colorHex,
            countries: [],
            shippingMethods: [],
          },
          gelato_sync_status: "active",
          gelato_last_seen_at: startedAt,
        };

        if (existingVariant) {
          const { error } = await supabase.from("product_variants").update(variantPayload).eq("id", existingVariant.id);
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

    const hasMore = !gelatoProductUid && products.length >= SEARCH_PAGE_SIZE;
    const nextOffset = hasMore ? pageOffset + SEARCH_PAGE_SIZE : null;
    const completed = !hasMore;

    if (completed) {
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
          .update({ gelato_sync_status: "inactive" })
          .in("id", staleColorIds);
        if (error) throw new Error(error.message);
      }

      if (staleVariantIds.length > 0) {
        const { error } = await supabase
          .from("product_variants")
          .update({ gelato_sync_status: "inactive" })
          .in("id", staleVariantIds);
        if (error) throw new Error(error.message);
      }
    }

    const result: SyncCatalogResult = {
      productId,
      catalogUid: catalog.catalogUid,
      productUid: undefined,
      catalogTitle: catalog.title,
      filters,
      gelatoProductUid: null,
      pageOffset,
      nextOffset,
      completed,
      productsFetched: products.length,
      colorsCreated,
      colorsUpdated,
      colorsDeactivated: 0,
      variantsCreated,
      variantsUpdated,
      variantsDeactivated: 0,
    };

    await saveSyncState(productId, {
      catalog_uid: catalog.catalogUid,
      product_uid: null,
      catalog_title: catalog.title,
      sync_status: completed ? "success" : "running",
      attribute_filters: filters as unknown as JsonValue,
      last_synced_at: startedAt,
      last_success_at: completed ? nowIso() : null,
      last_error: null,
      synced_products_count: products.length,
      synced_colors_count: colorsCreated + colorsUpdated,
      synced_variants_count: variantsCreated + variantsUpdated,
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Gelato sync error.";

    await saveSyncState(productId, {
      catalog_uid: catalogUid,
      product_uid: gelatoProductUid,
      sync_status: "failed",
      attribute_filters: rawFilters as unknown as JsonValue,
      last_synced_at: startedAt,
      last_error: message,
    });

    throw error;
  }
}
