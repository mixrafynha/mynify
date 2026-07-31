import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { GELATO_COUNTRIES } from "@/app/checkout/_lib/checkout";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { resolveGelatoColorHex } from "@/lib/gelato/gelato-color-map";

const DEFAULT_GELATO_PRODUCT_BASE_URL = "https://product.gelatoapis.com";
const SEARCH_PAGE_SIZE = 100;
const GELATO_REQUEST_TIMEOUT_MS = 15000;
const GELATO_COUNTRY_FETCH_CONCURRENCY = 8;

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
  supportedCountries?: unknown;
  notSupportedCountries?: unknown;
  availability?: unknown;
  [key: string]: unknown;
};

type GelatoProductPrice = {
  productUid?: string;
  country?: string;
  countryCode?: string;
  country_code?: string;
  isoCode?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  pageCount?: number | null;
  [key: string]: unknown;
};

type GelatoSelectedPrice = {
  country: string | null;
  currency: string;
  quantity: number;
  price: number;
};

type GelatoCountryPriceResult = {
  country: string;
  prices: GelatoProductPrice[];
  error: boolean;
};

type GelatoVariantMarketRow = {
  product_variant_id: string;
  country_code: string;
  currency: string;
  is_available: boolean;
  product_price: number | null;
  quantity: number;
  availability_source: string;
  price_source: string;
  unavailable_reason: string | null;
  price_checked_at: string;
  availability_checked_at: string;
  updated_at: string;
};

type GelatoSupportedCountriesResult = {
  countries: string[];
  hasSupportedCountriesField: boolean;
  hasExplicitSupportedCountries: boolean;
};

type GelatoFamilyAttributes = {
  catalogUid: string;
  productUid: string;
  familyKey: string;
  filters: CatalogSyncFilters;
  familyFilters: CatalogSyncFilters;
};

type GelatoFamilySyncResult = SyncCatalogResult & {
  familyKey: string;
  familyCatalogUid: string;
  familyProductsFound: number;
  familyColorsFound: number;
  familySizesFound: number;
  familyVariantsFound: number;
  familyVariantsMissing: number;
  familyConflicts: number;
  familySyncCompleted: boolean;
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
  gelato_family_key?: string | null;
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
  gelato_family_key?: string | null;
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
  preserveFamilyState?: boolean;
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

function cleanCountryIso(value: unknown): string | null {
  return resolveCountryCode(value);
}

function cleanSizeValue(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  return cleaned.length <= 4 ? cleaned.toUpperCase() : cleaned;
}

function cleanNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(cleanString(value));
  return Number.isFinite(number) ? number : null;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(4));
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

async function gelatoFetchFrom<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GELATO_REQUEST_TIMEOUT_MS);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: init?.signal ?? controller.signal,
    headers: {
      Accept: "application/json",
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
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const looksLikeHtml =
    contentType.includes("text/html") ||
    /^\s*<!doctype html/i.test(text) ||
    /^\s*<html/i.test(text) ||
    /just a moment/i.test(text);

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = looksLikeHtml
        ? {
            message:
              "Gelato returned an HTML challenge page instead of JSON. The request was likely blocked by Cloudflare.",
            responseUrl: response.url,
            responseStatus: response.status,
            contentType,
          }
        : { message: text };
    }
  }

  if (!response.ok) {
    const payloadRecord = isPlainObject(payload) ? payload : null;
    const message =
      cleanString(payloadRecord?.message) ||
      cleanString(payloadRecord?.error) ||
      `Gelato request failed with status ${response.status}`;
    if (looksLikeHtml) {
      throw new Error(
        `${message} (${response.status}) from ${response.url || `${baseUrl}${path}`}. Check GELATO_API_KEY, endpoint access, or Cloudflare blocking.`,
      );
    }
    throw new Error(message);
  }

  if (looksLikeHtml) {
    throw new Error(
      `Gelato returned HTML instead of JSON from ${response.url || `${baseUrl}${path}`}. Check endpoint access or Cloudflare blocking.`,
    );
  }

  return payload as T;
}

async function gelatoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return gelatoFetchFrom<T>(getGelatoProductBaseUrl(), path, init);
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

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function extractExplicitColorHex(attributes: Record<string, string>): string | null {
  const candidates = [
    attributes.colorHex,
    attributes.color_hex,
    attributes.hex,
    attributes.Hex,
    attributes.GelatoColorHex,
    attributes.gelatoColorHex,
  ];

  for (const candidate of candidates) {
    const value = cleanString(candidate);
    if (value && isHexColor(value)) {
      return value.toLowerCase();
    }
  }

  return null;
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
  const explicitColorHex = extractExplicitColorHex(product.attributes);

  return {
    colorKey: normalizeKey(colorTitle),
    colorName: colorTitle,
    colorHex: resolveGelatoColorHex({
      colorKey: colorTitle,
      colorName: colorTitle,
      gelatoHex: explicitColorHex,
    }),
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
    cleanSizeValue(sizeValueUid) ||
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

function buildGelatoVariantSku(entry: DerivedVariantEntry): string {
  const manufacturerSku =
    cleanString(entry.product.attributes.ApparelManufacturerSKU) ??
    cleanString(entry.product.attributes.ManufacturerSKU);
  const uidTail = entry.product.productUid.split("_").pop();
  const suffix = normalizeKey(manufacturerSku ?? uidTail ?? entry.product.productUid)
    .toUpperCase()
    .replace(/-/g, "");
  const color = entry.colorKey.toUpperCase().replace(/-/g, "");
  const size = entry.sizeKey.toUpperCase().replace(/-/g, "");

  return `RYFIO-GELATO-${color}-${size}-${suffix}`.slice(0, 96);
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

export async function getGelatoProductPrices(productUid: string): Promise<GelatoProductPrice[]> {
  validateProductUid(productUid);
  const prices = await gelatoFetch<unknown>(`/v3/products/${productUid}/prices`, {
    method: "GET",
  });
  return Array.isArray(prices) ? prices.filter(isPlainObject) as GelatoProductPrice[] : [];
}

async function getGelatoProductPricesForCountry(
  productUid: string,
  countryIso: string,
): Promise<GelatoProductPrice[]> {
  validateProductUid(productUid);
  const country = cleanCountryIso(countryIso);
  if (!country) return [];

  const prices = await gelatoFetch<unknown>(
    `/v3/products/${productUid}/prices?country=${encodeURIComponent(country)}`,
    { method: "GET" },
  );
  return Array.isArray(prices) ? prices.filter(isPlainObject) as GelatoProductPrice[] : [];
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      results.push(await mapper(item));
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

async function fetchGelatoPricesForAllCountries(
  productUid: string,
): Promise<{
  prices: GelatoProductPrice[];
  failedCountries: string[];
}> {
  const countries = GELATO_COUNTRIES
    .map((country) => cleanCountryIso(country.iso))
    .filter((country): country is string => Boolean(country));

  const batches = await mapWithConcurrency<string, GelatoCountryPriceResult>(
    countries,
    GELATO_COUNTRY_FETCH_CONCURRENCY,
    async (country) => {
      try {
        return {
          country,
          prices: await getGelatoProductPricesForCountry(productUid, country),
          error: false,
        };
      } catch {
        return { country, prices: [], error: true };
      }
    },
  );

  return {
    prices: batches.flatMap((batch) => batch.prices),
    failedCountries: batches
      .filter((batch) => batch.error)
      .map((batch) => batch.country),
  };
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

function normalizeCountryCode(value: unknown): string | null {
  return resolveCountryCode(value);
}

function normalizeCountryCodes(values: unknown[]): string[] {
  return Array.from(new Set(
    values
      .map((entry) => {
        if (typeof entry === "string") return normalizeCountryCode(entry);
        if (isPlainObject(entry)) {
          return (
            normalizeCountryCode(entry) ??
            normalizeCountryCode(entry.countryIso) ??
            normalizeCountryCode(entry.iso) ??
            normalizeCountryCode(entry.code)
          );
        }
        return null;
      })
      .filter((value): value is string => Boolean(value)),
  ));
}

function normalizeGelatoColor(value: unknown): string | null {
  const normalized = normalizeCountryCode(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeGelatoSize(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;

  const normalized = cleaned.trim().toUpperCase();
  const compact = normalized.replace(/\s+/g, "");
  const aliases: Record<string, string> = {
    XS: "XS",
    S: "S",
    M: "M",
    L: "L",
    XL: "XL",
    XXL: "2XL",
    XXXL: "3XL",
    XXXXL: "4XL",
  };

  if (aliases[compact]) return aliases[compact];
  if (/^\d+XL$/.test(compact)) return compact;
  return compact;
}

function extractFamilyAttributeValue(attributes: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = cleanString(attributes[key]);
    if (value) return value;
  }
  return null;
}

export function extractGelatoFamilyAttributes(product: GelatoProductDetails): GelatoFamilyAttributes {
  const attributes = isPlainObject(product.attributes) ? product.attributes as Record<string, string> : {};
  const familyFilterKeys = [
    "GarmentCategory",
    "GarmentStyle",
    "GarmentCut",
    "GarmentQuality",
    "GarmentPrint",
    "Brand",
    "Model",
    "ApparelManufacturer",
    "ApparelManufacturerSKU",
  ];

  const familyAttributes = Object.fromEntries(
    familyFilterKeys
      .map((key) => {
        const value = cleanString(attributes[key]);
        return value ? [key, value] as const : null;
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry)),
  );

  const familyKey = buildGelatoFamilyKey(attributes);

  return {
    catalogUid: cleanString((product as Record<string, unknown>).catalogUid) ?? "",
    productUid: cleanString(product.productUid) ?? "",
    familyKey,
    filters: familyAttributes as unknown as CatalogSyncFilters,
    familyFilters: familyAttributes as unknown as CatalogSyncFilters,
  };
}

export function buildGelatoFamilyKey(attributes: Record<string, unknown>): string {
  const familyValues = [
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentCategory"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentStyle"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentCut"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentQuality"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentPrint"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["Brand", "ApparelManufacturer"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["Model", "ApparelManufacturerSKU"]),
  ];

  return familyValues
    .map((value) => normalizeKey(value ?? ""))
    .join("|");
}

function extractSupportedCountries(product: GelatoProductDetails): GelatoSupportedCountriesResult {
  const hasSupportedCountriesField = Array.isArray(product.supportedCountries);
  const rawCountries = [
    ...(Array.isArray(product.countries) ? product.countries : []),
    ...(Array.isArray(product.supportedCountries) ? product.supportedCountries : []),
    ...(
      isPlainObject(product.availability) && Array.isArray(product.availability.countries)
        ? product.availability.countries
        : []
    ),
  ];

  const countries = normalizeCountryCodes(rawCountries);

  return {
    countries,
    hasSupportedCountriesField,
    hasExplicitSupportedCountries: hasSupportedCountriesField && countries.length > 0,
  };
}

function extractNotSupportedCountries(product: GelatoProductDetails): string[] {
  const rawCountries = Array.isArray(product.notSupportedCountries)
    ? product.notSupportedCountries
    : [];

  return normalizeCountryCodes(rawCountries);
}

function normalizeGelatoProductPrices(prices: GelatoProductPrice[]): JsonValue[] {
  const normalizedPrices: JsonValue[] = [];

  for (const price of prices) {
    const country = resolveCountryCode(price);
    const quantity = typeof price.quantity === "number" && Number.isFinite(price.quantity)
      ? price.quantity
      : null;
    const amount = typeof price.price === "number" && Number.isFinite(price.price)
      ? price.price
      : null;
    const currency = cleanString(price.currency)?.toUpperCase() ?? null;

    if (!country || quantity !== 1 || amount === null || !currency) continue;

    normalizedPrices.push({
      country,
      quantity,
      price: roundMoney(amount),
      currency,
      pageCount: typeof price.pageCount === "number" ? price.pageCount : null,
    });
  }

  return normalizedPrices;
}

function pickGelatoBaseVariantPrice(prices: GelatoProductPrice[]): GelatoSelectedPrice | null {
  const preferredCountries = [
    cleanCountryIso(process.env.GELATO_DEFAULT_PRICE_COUNTRY),
    "US",
    "PT",
  ].filter((country): country is string => Boolean(country));

  const validPrices = prices
    .map((price) => ({
      country: resolveCountryCode(price),
      quantity: typeof price.quantity === "number" && Number.isFinite(price.quantity)
        ? Math.trunc(price.quantity)
        : null,
      price: typeof price.price === "number" && Number.isFinite(price.price)
        ? price.price
        : null,
      currency: cleanString(price.currency)?.toUpperCase() ?? null,
    }))
    .filter(
      (price): price is {
        country: string | null;
        currency: string;
        quantity: number;
        price: number;
      } => price.quantity === 1 && price.price !== null && Boolean(price.currency),
    );

  const preferredPrice = preferredCountries
    .map((country) =>
      validPrices
        .filter((price) => price.country === country)
        .sort((left, right) => left.quantity - right.quantity)[0],
    )
    .find(Boolean);

  const fallbackPrice = [...validPrices].sort(
    (left, right) => left.price - right.price || left.quantity - right.quantity,
  )[0];

  const selectedPrice = preferredPrice ?? fallbackPrice;
  if (!selectedPrice) return null;

  return {
    country: selectedPrice.country,
    currency: selectedPrice.currency,
    quantity: selectedPrice.quantity,
    price: roundMoney(selectedPrice.price),
  };
}

function getGelatoProductName(product: GelatoProductDetails): string | null {
  return (
    cleanString(product.title) ??
    cleanString(product.name) ??
    cleanString(product.productName)
  );
}

export function filterGelatoProductsByFamilyKey(
  products: GelatoCatalogSearchProduct[],
  familyKey: string,
): GelatoCatalogSearchProduct[] {
  const normalizedFamilyKey = familyKey.trim().toLowerCase();
  return products.filter(
    (product) => buildGelatoFamilyKey(product.attributes).trim().toLowerCase() === normalizedFamilyKey,
  );
}

export async function searchGelatoProductFamily(
  catalogUid: string,
  referenceProductUid: string,
): Promise<{
  referenceProduct: GelatoCatalogSearchProduct;
  familyAttributes: GelatoFamilyAttributes;
  familyProducts: GelatoCatalogSearchProduct[];
}> {
  validateCatalogUid(catalogUid);
  validateProductUid(referenceProductUid);

  const referenceProduct = await getGelatoProduct(referenceProductUid);
  const familyAttributes = extractGelatoFamilyAttributes({
    ...referenceProduct,
    productUid: referenceProductUid,
    catalogUid,
  } as GelatoProductDetails);
  const products = await fetchAllGelatoProducts(catalogUid, familyAttributes.familyFilters);
  const familyProducts = filterGelatoProductsByFamilyKey(products, familyAttributes.familyKey);
  const withReference = familyProducts.some((product) => product.productUid === referenceProductUid)
    ? familyProducts
    : [
        ...familyProducts,
        {
          ...referenceProduct,
          productUid: referenceProductUid,
        } as GelatoCatalogSearchProduct,
      ];

  return {
    referenceProduct: {
      ...referenceProduct,
      productUid: referenceProductUid,
      attributes: isPlainObject(referenceProduct.attributes)
        ? referenceProduct.attributes as Record<string, string>
        : {},
    },
    familyAttributes,
    familyProducts: dedupeProductsByUid(withReference),
  };
}

function isGelatoProductAvailable(product: GelatoProductDetails): boolean {
  const status =
    cleanString(product.attributes?.ProductStatus) ??
    cleanString(product.attributes?.State) ??
    cleanString(product.status) ??
    cleanString(product.state);

  return String(status ?? "").trim().toLowerCase() === "activated";
}

function nowIso() {
  return new Date().toISOString();
}

async function saveSyncState(
  productId: string,
  state: Record<string, JsonValue>,
) {
  const supabase = createSupabaseAdmin();
  const payload: Record<string, JsonValue> = {
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

  const missingCountriesColumn =
    error?.message?.includes("Could not find the 'countries' column") ||
    error?.message?.includes("column \"countries\" of relation \"gelato_catalog_sync_state\" does not exist");

  if (error && (missingProductUidColumn || missingCountriesColumn)) {
    const legacyPayload: Record<string, JsonValue> = { ...payload };
    delete legacyPayload.product_uid;
    delete legacyPayload.countries;
    ({ error } = await upsertState(legacyPayload));
  }

  if (error) {
    throw new Error(error.message);
  }
}

function shouldIgnoreMissingGelatoMarketTable(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("gelato_variant_markets") ||
    message.includes("schema cache")
  );
}

function shouldIgnoreMissingGelatoFamilyKeyColumn(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("gelato_family_key") ||
    message.includes("schema cache")
  );
}

function shouldIgnoreMissingVariantPriceMetadataColumns(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("price_currency") ||
    message.includes("price_country") ||
    message.includes("price_source") ||
    message.includes("price_last_synced_at") ||
    message.includes("schema cache")
  );
}

function isMissingGelatoMarketConflictConstraint(error: { message?: string } | null) {
  return (error?.message ?? "").includes(
    "there is no unique or exclusion constraint matching the ON CONFLICT specification",
  );
}

export function pickVariantReferenceMarket(markets: GelatoVariantMarketRow[]) {
  const preferredCountries = [
    cleanCountryIso(process.env.GELATO_DEFAULT_PRICE_COUNTRY),
    "FR",
  ].filter((country): country is string => Boolean(country));

  const validMarkets = markets.filter(
    (market) => market.quantity === 1 && typeof market.product_price === "number" && market.product_price > 0,
  );

  for (const country of preferredCountries) {
    const market = validMarkets.find((entry) => entry.country_code === country);
    if (market) return market;
  }

  return validMarkets[0] ?? null;
}

function buildVariantPriceMetadataPayload(
  market: GelatoVariantMarketRow | null,
  syncedAt: string,
  hasPriceMetadataColumns: boolean,
) {
  return {
    price: market?.product_price ?? null,
    ...(hasPriceMetadataColumns
      ? {
          price_currency: market?.currency ?? null,
          price_country: market?.country_code ?? null,
          price_source: market ? "gelato_variant_markets" : null,
          price_last_synced_at: market ? syncedAt : null,
        }
      : {}),
  };
}

export function buildGelatoVariantMarketRows(input: {
  productUid: string;
  productVariantId: string;
  prices: GelatoProductPrice[];
  notSupportedCountries: string[];
  explicitSupportedCountries: string[];
  hasExplicitSupportedCountries: boolean;
  productIsAvailable: boolean;
  syncedAt: string;
  logAvailabilityConflicts?: boolean;
}): GelatoVariantMarketRow[] {
  const notSupportedCountries = new Set(
    input.notSupportedCountries
      .map((country) => cleanCountryIso(country))
      .filter((country): country is string => Boolean(country)),
  );
  const explicitSupportedCountries = new Set(
    input.explicitSupportedCountries
      .map((country) => cleanCountryIso(country))
      .filter((country): country is string => Boolean(country)),
  );
  const marketsByCountry = new Map<string, GelatoVariantMarketRow>();

  for (const price of input.prices) {
    const country = resolveCountryCode(price);
    const currency = cleanString(price.currency)?.toUpperCase() ?? null;
    const quantity = typeof price.quantity === "number" && Number.isFinite(price.quantity)
      ? Math.trunc(price.quantity)
      : null;
    const amount = typeof price.price === "number" && Number.isFinite(price.price)
      ? price.price
      : null;

    if (!country || !currency || quantity !== 1) continue;

    const hasValidPrice = amount !== null && amount > 0;
    const productPrice = hasValidPrice ? roundMoney(amount) : null;
    const explicitlySupported =
      input.hasExplicitSupportedCountries && explicitSupportedCountries.has(country);
    const explicitlyUnsupported = notSupportedCountries.has(country);
    const availabilityConflict = explicitlySupported && explicitlyUnsupported;
    const unavailableReason = (() => {
      if (!input.productIsAvailable) return "product_not_active";
      if (availabilityConflict) return "availability_conflict";
      if (explicitlyUnsupported) return "country_not_supported";
      if (explicitlySupported && !hasValidPrice) return "price_unavailable";
      if (explicitlySupported && hasValidPrice) return null;
      return null;
    })();
    const isAvailable =
      input.productIsAvailable &&
      explicitlySupported &&
      hasValidPrice &&
      !explicitlyUnsupported;
    const effectiveUnavailableReason = unavailableReason ?? (
      isAvailable ? null : "availability_not_confirmed"
    );

    if (availabilityConflict && input.logAvailabilityConflicts) {
      console.warn({
        event: "gelato_availability_conflict",
        productUid: input.productUid,
        countryCode: country,
      });
    }

    marketsByCountry.set(country, {
      product_variant_id: input.productVariantId,
      country_code: country,
      currency,
      is_available: isAvailable,
      product_price: productPrice,
      quantity: 1,
      availability_source: effectiveUnavailableReason === "availability_not_confirmed"
        ? "price_only"
        : "gelato_product_details",
      price_source: "gelato_product_prices",
      unavailable_reason: effectiveUnavailableReason,
      price_checked_at: input.syncedAt,
      availability_checked_at: input.syncedAt,
      updated_at: nowIso(),
    });
  }

  return Array.from(marketsByCountry.values());
}

async function saveGelatoVariantMarkets(input: {
  productUid: string;
  productVariantId: string;
  prices: GelatoProductPrice[];
  failedCountries: string[];
  notSupportedCountries: string[];
  explicitSupportedCountries: string[];
  hasExplicitSupportedCountries: boolean;
  productIsAvailable: boolean;
  syncedAt: string;
}): Promise<GelatoVariantMarketRow[]> {
  const supabase = createSupabaseAdmin();
  const marketRows = buildGelatoVariantMarketRows({
    ...input,
    logAvailabilityConflicts: true,
  });
  const syncedCountries = marketRows.map((market) => market.country_code);

  if (marketRows.length > 0) {
    const { error } = await supabase
      .from("gelato_variant_markets")
      .upsert(marketRows, {
        onConflict: "product_variant_id,country_code,currency,quantity",
      });

    if (error && isMissingGelatoMarketConflictConstraint(error)) {
      const { error: deleteError } = await supabase
        .from("gelato_variant_markets")
        .delete()
        .eq("product_variant_id", input.productVariantId)
        .in("country_code", syncedCountries);
      if (deleteError && !shouldIgnoreMissingGelatoMarketTable(deleteError)) {
        throw new Error(deleteError.message);
      }

      const { error: insertError } = await supabase
        .from("gelato_variant_markets")
        .insert(marketRows);
      if (insertError && !shouldIgnoreMissingGelatoMarketTable(insertError)) {
        throw new Error(insertError.message);
      }
    } else if (error && !shouldIgnoreMissingGelatoMarketTable(error)) {
      throw new Error(error.message);
    }
  }

  const failedCountries = input.failedCountries
    .map((country) => cleanCountryIso(country))
    .filter((country): country is string => Boolean(country));

  if (failedCountries.length > 0) {
    const { error } = await supabase
      .from("gelato_variant_markets")
      .update({
        is_available: false,
        availability_source: "gelato_api_error",
        unavailable_reason: "gelato_api_error",
        availability_checked_at: input.syncedAt,
        updated_at: nowIso(),
      })
      .eq("product_variant_id", input.productVariantId)
      .in("country_code", failedCountries);
    if (error && !shouldIgnoreMissingGelatoMarketTable(error)) {
      throw new Error(error.message);
    }
  }

  return marketRows;
}

function getVariantFamilyKeyFromProduct(product: GelatoCatalogSearchProduct): string {
  return buildGelatoFamilyKey(product.attributes);
}

function getProductFamilyProgressPayload(
  productId: string,
  referenceProductUid: string,
  familyKey: string,
  step: string,
) {
  console.info({
    event: "gelato_family_sync_progress",
    productId,
    referenceProductUid,
    familyKey,
    step,
  });
}

export async function syncGelatoProductFamily(
  input: {
    productId: string;
    catalogUid: string;
    referenceProductUid: string;
    productUids?: string[];
    preserveFamilyState?: boolean;
  },
): Promise<GelatoFamilySyncResult> {
  const productId = cleanString(input.productId);
  const catalogUid = cleanString(input.catalogUid);
  const referenceProductUid = cleanString(input.referenceProductUid);

  if (!productId) throw new Error("Missing productId.");
  if (!catalogUid) throw new Error("Missing catalogUid.");
  if (!referenceProductUid) throw new Error("Missing referenceProductUid.");

  validateCatalogUid(catalogUid);
  validateProductUid(referenceProductUid);
  await getProductOrThrow(productId);

  const syncStartedAt = nowIso();
  getProductFamilyProgressPayload(productId, referenceProductUid, "", "A analisar UID");

  const { referenceProduct, familyAttributes, familyProducts } = await searchGelatoProductFamily(
    catalogUid,
    referenceProductUid,
  );
  const productUidFilter = Array.isArray(input.productUids)
    ? new Set(input.productUids.map((value) => cleanString(value)).filter((value): value is string => Boolean(value)))
    : null;
  const selectedFamilyProducts =
    productUidFilter && productUidFilter.size > 0
      ? familyProducts.filter((product) => productUidFilter.has(product.productUid))
      : familyProducts;
  const processedFamilyProducts = selectedFamilyProducts.length > 0 ? selectedFamilyProducts : familyProducts;

  getProductFamilyProgressPayload(
    productId,
    referenceProductUid,
    familyAttributes.familyKey,
    "Família identificada",
  );

  const referenceDetails = referenceProduct as GelatoProductDetails;
  const supabase = createSupabaseAdmin();
  const rawNotSupportedCountries = extractNotSupportedCountries(referenceDetails);
  const supportedCountriesResult = extractSupportedCountries(referenceDetails);
  const explicitSupportedCountries = supportedCountriesResult.countries;
  const notSupportedCountries = rawNotSupportedCountries;

  const { error: familyKeyProbeError } = await supabase
    .from("product_colors")
    .select("gelato_family_key")
    .limit(1);
  const hasGelatoFamilyKeyColumn = !familyKeyProbeError || !shouldIgnoreMissingGelatoFamilyKeyColumn(familyKeyProbeError);
  const { error: variantPriceMetadataProbeError } = await supabase
    .from("product_variants")
    .select("price_currency")
    .limit(1);
  const hasVariantPriceMetadataColumns =
    !variantPriceMetadataProbeError ||
    !shouldIgnoreMissingVariantPriceMetadataColumns(variantPriceMetadataProbeError);

  getProductFamilyProgressPayload(
    productId,
    referenceProductUid,
    familyAttributes.familyKey,
    "A procurar variantes",
  );

  const colorSelect = hasGelatoFamilyKeyColumn
    ? "id, product_id, color, color_hex, mockup_front, mockup_back, thumbnail, position, gelato_color_key, gelato_sync_status, gelato_family_key"
    : "id, product_id, color, color_hex, mockup_front, mockup_back, thumbnail, position, gelato_color_key, gelato_sync_status";
  const { data: colorRows, error: colorsError } = await supabase
    .from("product_colors")
    .select(colorSelect)
    .eq("product_id", productId);

  if (colorsError) throw new Error(colorsError.message);

  const existingColors = (colorRows ?? []) as unknown as ExistingColorRow[];
  const existingColorIds = existingColors.map((color) => color.id);
  let existingVariants: ExistingVariantRow[] = [];

  if (existingColorIds.length > 0) {
    const variantSelect = hasGelatoFamilyKeyColumn
      ? "id, product_color_id, size, sku, stock, price, name, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status, gelato_family_key"
      : "id, product_color_id, size, sku, stock, price, name, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status";
    const { data: variantRows, error: variantsError } = await supabase
      .from("product_variants")
      .select(variantSelect)
      .in("product_color_id", existingColorIds);
    if (variantsError) throw new Error(variantsError.message);
    existingVariants = (variantRows ?? []) as unknown as ExistingVariantRow[];
  }

  const existingColorsByFamilyKey = new Map<string, ExistingColorRow>();
  const existingColorsByColorKey = new Map<string, ExistingColorRow>();
  for (const color of existingColors) {
    const familyKey = cleanString((color as Record<string, unknown>).gelato_family_key) ?? "";
    const colorKey = cleanString(color.gelato_color_key) ?? normalizeKey(color.color ?? "");
    const key = `${familyKey}::${colorKey}`;
    if (familyKey && colorKey && !existingColorsByFamilyKey.has(key)) existingColorsByFamilyKey.set(key, color);
    if (colorKey && !existingColorsByColorKey.has(colorKey)) existingColorsByColorKey.set(colorKey, color);
  }

  const existingVariantsByFamily = new Map<string, ExistingVariantRow>();
  const existingVariantsByGelatoProductUid = new Map<string, ExistingVariantRow>();
  for (const variant of existingVariants) {
    const familyKey = cleanString((variant as Record<string, unknown>).gelato_family_key) ?? "";
    const key = `${familyKey}::${variant.product_color_id}::${
      variant.gelato_variant_key ?? normalizeKey(`${variant.product_color_id}__${variant.size ?? variant.id}`)
    }`;
    if (familyKey && !existingVariantsByFamily.has(key)) existingVariantsByFamily.set(key, variant);
    if (variant.gelato_product_uid && !existingVariantsByGelatoProductUid.has(variant.gelato_product_uid)) {
      existingVariantsByGelatoProductUid.set(variant.gelato_product_uid, variant);
    }
  }

  const productsByUid = new Map(processedFamilyProducts.map((product) => [product.productUid, product]));
  const familyGroup = new Map<string, GelatoCatalogSearchProduct[]>();
  for (const product of processedFamilyProducts) {
    const familyKey = getVariantFamilyKeyFromProduct(product);
    if (familyKey !== familyAttributes.familyKey) continue;
    const list = familyGroup.get(familyKey) ?? [];
    list.push(product);
    familyGroup.set(familyKey, list);
  }

  const touchedColorIds = new Set<string>();
  const touchedVariantIds = new Set<string>();
  const touchedFamilyVariantKeys = new Set<string>();
  const colorIdByKey = new Map<string, string>();
  let colorsCreated = 0;
  let colorsUpdated = 0;
  let variantsCreated = 0;
  let variantsUpdated = 0;
  let familyConflicts = 0;
  const allFamilyProducts = familyGroup.get(familyAttributes.familyKey) ?? [];

  const colorsToProducts = new Map<string, DerivedVariantEntry[]>();
  const attributeMap = buildAttributeTitleMap(await getGelatoCatalog(catalogUid));
  for (const product of allFamilyProducts) {
    const variantMeta = variantKeyFromProduct(product, attributeMap);
    const existing = colorsToProducts.get(variantMeta.colorKey) ?? [];
    existing.push({ ...variantMeta, product });
    colorsToProducts.set(variantMeta.colorKey, existing);
  }

  getProductFamilyProgressPayload(
    productId,
    referenceProductUid,
    familyAttributes.familyKey,
    "Cores encontradas",
  );

  for (const [colorKey, entries] of colorsToProducts.entries()) {
    const firstEntry = entries[0];
    const existingColor =
      existingColorsByFamilyKey.get(`${familyAttributes.familyKey}::${colorKey}`) ??
      existingColorsByColorKey.get(colorKey);
    let colorId = existingColor?.id ?? null;
    const colorPayload = {
      product_id: productId,
      color: firstEntry.colorName,
      color_hex: resolveGelatoColorHex({
        colorKey,
        colorName: firstEntry.colorName,
        gelatoHex: existingColor?.color_hex ?? firstEntry.colorHex,
      }),
      mockup_front: existingColor?.mockup_front ?? null,
      mockup_back: existingColor?.mockup_back ?? null,
      thumbnail: existingColor?.thumbnail ?? null,
      position: existingColor?.position ?? colorIdByKey.size,
      gelato_color_key: colorKey,
      ...(hasGelatoFamilyKeyColumn ? { gelato_family_key: familyAttributes.familyKey } : {}),
      gelato_attributes: {
        attributeUid: firstEntry.colorAttributeUid,
        attributeValueUid: firstEntry.colorValueUid,
        colorHex: firstEntry.colorHex,
        countries: explicitSupportedCountries,
        notSupportedCountries,
      },
      gelato_sync_status: "active",
      gelato_last_seen_at: syncStartedAt,
    };

    if (existingColor) {
      const { error } = await supabase.from("product_colors").update(colorPayload).eq("id", existingColor.id);
      if (error) throw new Error(error.message);
      colorId = existingColor.id;
      colorsUpdated += 1;
    } else {
      const { data, error } = await supabase.from("product_colors").insert(colorPayload).select("id").single();
      if (error || !data?.id) throw new Error(error?.message || "Failed to create product color.");
      colorId = data.id as string;
      colorsCreated += 1;
    }

    touchedColorIds.add(colorId);
    colorIdByKey.set(colorKey, colorId);

    for (const entry of entries) {
      const variantLookupKey = `${familyAttributes.familyKey}::${colorId}::${entry.variantKey}`;
      const existingVariant =
        existingVariantsByFamily.get(variantLookupKey) ??
        existingVariantsByGelatoProductUid.get(entry.product.productUid);
      const entryDetails = (await getGelatoProduct(entry.product.productUid)) as GelatoProductDetails;
      const entryPriceResult = await fetchGelatoPricesForAllCountries(entry.product.productUid);
      const entryPriceRows = entryPriceResult.prices;
      const entrySupportedResult = extractSupportedCountries(entryDetails);
      const entryExplicitSupportedCountries = entrySupportedResult.countries;
      const entryNotSupportedCountries = extractNotSupportedCountries(entryDetails);
      const entryProductIsAvailable = isGelatoProductAvailable(entryDetails);
      const gelatoVariantUid =
        extractVariantUidFromAttributes(entry.product.attributes) ?? entry.product.productUid;
      const variantName = `${entry.colorName} / ${entry.sizeName}`;
      const familyRowPreview = buildGelatoVariantMarketRows({
        productUid: entry.product.productUid,
        productVariantId: existingVariant?.id ?? "pending",
        prices: entryPriceRows,
        notSupportedCountries: entryNotSupportedCountries,
        explicitSupportedCountries: entryExplicitSupportedCountries,
        hasExplicitSupportedCountries: entrySupportedResult.hasExplicitSupportedCountries,
        productIsAvailable: entryProductIsAvailable,
        syncedAt: syncStartedAt,
      });

      const referenceMarket = pickVariantReferenceMarket(familyRowPreview);
      const variantPayload = {
        product_color_id: colorId,
        size: entry.sizeName,
        name: variantName,
        sku: buildGelatoVariantSku(entry),
        stock: existingVariant?.stock && existingVariant.stock > 0 ? existingVariant.stock : 999,
        ...buildVariantPriceMetadataPayload(
          referenceMarket,
          syncStartedAt,
          hasVariantPriceMetadataColumns,
        ),
        gelato_product_uid: entry.product.productUid,
        gelato_product_name: getGelatoProductName(entryDetails),
        gelato_catalog_uid: catalogUid,
        gelato_variant_uid: gelatoVariantUid,
        gelato_variant_key: entry.variantKey,
        ...(hasGelatoFamilyKeyColumn ? { gelato_family_key: familyAttributes.familyKey } : {}),
        gelato_attributes: {
          ...entry.product.attributes,
          colorHex: entry.colorHex,
          countries: entryExplicitSupportedCountries,
          notSupportedCountries: entryNotSupportedCountries,
          gelatoPrices: normalizeGelatoProductPrices(entryPriceRows),
        },
        gelato_sync_status: "active",
        gelato_available: familyRowPreview.some((market) => market.is_available),
        gelato_last_synced_at: syncStartedAt,
        gelato_last_seen_at: syncStartedAt,
      };

      if (existingVariant) {
        const { error } = await supabase.from("product_variants").update(variantPayload).eq("id", existingVariant.id);
        if (error) throw new Error(error.message);
        touchedVariantIds.add(existingVariant.id);
        touchedFamilyVariantKeys.add(variantLookupKey);
        await saveGelatoVariantMarkets({
          productUid: entry.product.productUid,
          productVariantId: existingVariant.id,
          prices: entryPriceRows,
          failedCountries: entryPriceResult.failedCountries,
          notSupportedCountries: entryNotSupportedCountries,
          explicitSupportedCountries: entryExplicitSupportedCountries,
          hasExplicitSupportedCountries: entrySupportedResult.hasExplicitSupportedCountries,
          productIsAvailable: entryProductIsAvailable,
          syncedAt: syncStartedAt,
        });
        variantsUpdated += 1;
      } else {
        const { data, error } = await supabase.from("product_variants").insert(variantPayload).select("id").single();
        if (error || !data?.id) throw new Error(error?.message || "Failed to create product variant.");
        const productVariantId = data.id as string;
        touchedVariantIds.add(productVariantId);
        touchedFamilyVariantKeys.add(variantLookupKey);
        await saveGelatoVariantMarkets({
          productUid: entry.product.productUid,
          productVariantId,
          prices: entryPriceRows,
          failedCountries: entryPriceResult.failedCountries,
          notSupportedCountries: entryNotSupportedCountries,
          explicitSupportedCountries: entryExplicitSupportedCountries,
          hasExplicitSupportedCountries: entrySupportedResult.hasExplicitSupportedCountries,
          productIsAvailable: entryProductIsAvailable,
          syncedAt: syncStartedAt,
        });
        variantsCreated += 1;
      }
    }
  }

  const staleVariantIds = hasGelatoFamilyKeyColumn
    ? existingVariants
        .filter(
          (variant) =>
            cleanString((variant as Record<string, unknown>).gelato_family_key) ===
              familyAttributes.familyKey && !touchedVariantIds.has(variant.id),
        )
        .map((variant) => variant.id)
    : existingVariants
        .filter((variant) => !touchedVariantIds.has(variant.id))
        .map((variant) => variant.id);

  if (staleVariantIds.length > 0 && !input.preserveFamilyState) {
    const { error } = await supabase
      .from("product_variants")
      .update({
        gelato_sync_status: "missing",
        gelato_available: false,
      })
      .in("id", staleVariantIds);
    if (error) throw new Error(error.message);
  }

  const result: GelatoFamilySyncResult = {
    productId,
    catalogUid,
    productUid: referenceProductUid,
    catalogTitle: (await getGelatoCatalog(catalogUid)).title,
    filters: familyAttributes.familyFilters,
    gelatoProductUid: referenceProductUid,
    pageOffset: 0,
    nextOffset: null,
    completed: true,
    productsFetched: familyProducts.length,
    colorsCreated,
    colorsUpdated,
    colorsDeactivated: 0,
    variantsCreated,
    variantsUpdated,
    variantsDeactivated: staleVariantIds.length,
    familyKey: familyAttributes.familyKey,
    familyCatalogUid: catalogUid,
    familyProductsFound: familyProducts.length,
    familyColorsFound: colorsToProducts.size,
    familySizesFound: new Set(familyProducts.map((product) => deriveSizeData(product, attributeMap).sizeName)).size,
    familyVariantsFound: familyProducts.length,
    familyVariantsMissing: staleVariantIds.length,
    familyConflicts,
    familySyncCompleted: true,
  };

  console.info({
    event: "gelato_family_sync_completed",
    created: variantsCreated,
    updated: variantsUpdated,
    missing: staleVariantIds.length,
    failed: 0,
  });

  return result;
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
    const matchedProductDetails = matchedProduct as GelatoProductDetails;
    const rawNotSupportedCountries = extractNotSupportedCountries(matchedProductDetails);
    const gelatoPriceResult = await fetchGelatoPricesForAllCountries(
      matchedProduct.productUid,
    );
    const gelatoPriceRows = gelatoPriceResult.prices;
    const gelatoPrices = normalizeGelatoProductPrices(gelatoPriceRows);
    const supportedCountriesResult = extractSupportedCountries(matchedProductDetails);
    const explicitSupportedCountries = supportedCountriesResult.countries;
    const supportedCountries = explicitSupportedCountries;
    const notSupportedCountries = rawNotSupportedCountries;
    const selectedGelatoBaseVariantPrice = pickGelatoBaseVariantPrice(gelatoPriceRows);
    const gelatoBaseVariantPrice = selectedGelatoBaseVariantPrice?.price ?? null;
    const gelatoProductName = getGelatoProductName(matchedProductDetails);
    const gelatoAvailable = isGelatoProductAvailable(matchedProductDetails);
    const supabase = createSupabaseAdmin();
    const { error: variantPriceMetadataProbeError } = await supabase
      .from("product_variants")
      .select("price_currency")
      .limit(1);
    const hasVariantPriceMetadataColumns =
      !variantPriceMetadataProbeError ||
      !shouldIgnoreMissingVariantPriceMetadataColumns(variantPriceMetadataProbeError);

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
        color_hex: resolveGelatoColorHex({
          colorKey,
          colorName: firstEntry.colorName,
          gelatoHex: existingColor?.color_hex ?? firstEntry.colorHex,
        }),
        mockup_front: existingColor?.mockup_front ?? existingProduct.image,
        mockup_back: existingColor?.mockup_back ?? null,
        thumbnail: existingColor?.thumbnail ?? existingProduct.image,
        position: existingColor?.position ?? colorIdByKey.size,
        gelato_color_key: colorKey,
        gelato_attributes: {
          attributeUid: firstEntry.colorAttributeUid,
          attributeValueUid: firstEntry.colorValueUid,
          colorHex: firstEntry.colorHex,
          countries: supportedCountries,
          notSupportedCountries,
          gelatoPrices,
          gelatoBaseVariantPrice,
          gelatoBasePriceCountry: selectedGelatoBaseVariantPrice?.country ?? null,
          gelatoBasePriceCurrency: selectedGelatoBaseVariantPrice?.currency ?? null,
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
        const gelatoVariantUid =
          extractVariantUidFromAttributes(entry.product.attributes) ??
          entry.product.productUid;
        const variantName = `${entry.colorName} / ${entry.sizeName}`;
        const variantMarketPreview = buildGelatoVariantMarketRows({
          productUid: entry.product.productUid,
          productVariantId: existingVariant?.id ?? "pending",
          prices: gelatoPriceRows,
          notSupportedCountries,
          explicitSupportedCountries,
          hasExplicitSupportedCountries: supportedCountriesResult.hasExplicitSupportedCountries,
          productIsAvailable: gelatoAvailable,
          syncedAt: startedAt,
        });
        const variantGelatoAvailable = variantMarketPreview.some(
          (market) => market.is_available === true,
        );
        const referenceMarket = pickVariantReferenceMarket(variantMarketPreview);
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: variantName,
          sku: buildGelatoVariantSku(entry),
          stock: existingVariant?.stock && existingVariant.stock > 0 ? existingVariant.stock : 999,
          ...buildVariantPriceMetadataPayload(
            referenceMarket,
            startedAt,
            hasVariantPriceMetadataColumns,
          ),
          gelato_product_uid: entry.product.productUid,
          gelato_product_name: gelatoProductName,
          gelato_catalog_uid: catalog.catalogUid,
          gelato_variant_uid: gelatoVariantUid,
          gelato_variant_key: entry.variantKey,
          gelato_attributes: {
            ...entry.product.attributes,
            colorHex: entry.colorHex,
            countries: supportedCountries,
            notSupportedCountries,
            gelatoPrices,
            gelatoBaseVariantPrice,
            gelatoBasePriceCountry: selectedGelatoBaseVariantPrice?.country ?? null,
            gelatoBasePriceCurrency: selectedGelatoBaseVariantPrice?.currency ?? null,
          },
          gelato_sync_status: "active",
          gelato_available: variantGelatoAvailable,
          gelato_last_synced_at: startedAt,
          gelato_last_seen_at: startedAt,
        };

        if (existingVariant) {
          const { error } = await supabase
            .from("product_variants")
            .update(variantPayload)
            .eq("id", existingVariant.id);
          if (error) throw new Error(error.message);
          touchedVariantIds.add(existingVariant.id);
          await saveGelatoVariantMarkets({
            productUid: entry.product.productUid,
            productVariantId: existingVariant.id,
            prices: gelatoPriceRows,
            failedCountries: gelatoPriceResult.failedCountries,
            notSupportedCountries,
            explicitSupportedCountries,
            hasExplicitSupportedCountries: supportedCountriesResult.hasExplicitSupportedCountries,
            productIsAvailable: gelatoAvailable,
            syncedAt: startedAt,
          });
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
          const productVariantId = data.id as string;
          touchedVariantIds.add(productVariantId);
          await saveGelatoVariantMarkets({
            productUid: entry.product.productUid,
            productVariantId,
            prices: gelatoPriceRows,
            failedCountries: gelatoPriceResult.failedCountries,
            notSupportedCountries,
            explicitSupportedCountries,
            hasExplicitSupportedCountries: supportedCountriesResult.hasExplicitSupportedCountries,
            productIsAvailable: gelatoAvailable,
            syncedAt: startedAt,
          });
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

    if (staleColorIds.length > 0 && !input.preserveFamilyState) {
      const { error } = await supabase
        .from("product_colors")
        .update({
          gelato_sync_status: "inactive",
        })
        .in("id", staleColorIds);
      if (error) throw new Error(error.message);
    }

    if (staleVariantIds.length > 0 && !input.preserveFamilyState) {
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
      countries: supportedCountries as unknown as JsonValue,
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
        color_hex: resolveGelatoColorHex({
          colorKey,
          colorName: firstEntry.colorName,
          gelatoHex: existingColor?.color_hex ?? firstEntry.colorHex,
        }),
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
        const variantName = `${entry.colorName} / ${entry.sizeName}`;
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: variantName,
          sku: buildGelatoVariantSku(entry),
          stock: existingVariant?.stock && existingVariant.stock > 0 ? existingVariant.stock : 999,
          price: existingVariant?.price ?? null,
          gelato_product_uid: entry.product.productUid,
          gelato_variant_uid: gelatoVariantUid,
          gelato_variant_key: entry.variantKey,
          gelato_attributes: {
            ...entry.product.attributes,
            colorHex: entry.colorHex,
            countries: [],
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
