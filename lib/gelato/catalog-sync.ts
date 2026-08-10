import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { GELATO_COUNTRIES } from "@/app/checkout/_lib/checkout";
import { convertMoneyToCents } from "@/app/api/checkout/currency";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { resolveGelatoColorHex } from "@/lib/gelato/gelato-color-map";
import { calculateSellingPrice, pricesAlmostEqual, roundSellingPrice, normalizeProfitMarkupPercentage } from "@/lib/gelato/pricing";
import { resolvePricingRule } from "@/lib/gelato/pricing-rules";

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
  requestedCountry?: string;
  requestedCurrency?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  pageCount?: number | null;
  [key: string]: unknown;
};

export type GelatoPrintPricingEntry = {
  productUid: string;
  cost: number;
};

export type GelatoPrintPricingCache = {
  front?: GelatoPrintPricingEntry | null;
  frontBack?: GelatoPrintPricingEntry | null;
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

type GelatoVariantPriceRow = Pick<
  GelatoVariantMarketRow,
  "product_variant_id" | "country_code" | "currency" | "product_price" | "quantity" | "price_source" | "price_checked_at" | "updated_at"
>;

type GelatoMarketAvailability = {
  isAvailable: boolean;
  reason: string | null;
  source: string;
};

type GelatoColorImages = {
  mockup_front: string | null;
  mockup_back: string | null;
  thumbnail: string | null;
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

type GelatoCatalogListResponse =
  | GelatoCatalogListItem[]
  | {
      catalogs?: GelatoCatalogListItem[];
      items?: GelatoCatalogListItem[];
      data?: GelatoCatalogListItem[];
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
  price?: number | string | null;
  currency?: string | null;
  category?: string | null;
  title?: string | null;
  slug?: string | null;
  profit_markup_percentage?: number | string | null;
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
  gelato_attributes?: JsonValue | null;
};

type ProductVariantPricingRow = {
  id: string;
  product_color_id: string;
  price: number | string | null;
  name: string | null;
  size: string | null;
  gelato_product_uid: string | null;
  gelato_variant_uid: string | null;
  gelato_variant_key: string | null;
  gelato_sync_status: string | null;
  gelato_attributes: JsonValue | null;
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

function cleanImageUrl(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;

  try {
    const url = new URL(cleaned);
    return url.protocol === "https:" || url.protocol === "http:" ? cleaned : null;
  } catch {
    return null;
  }
}

function collectGelatoImageUrls(value: unknown, path: string[] = []): Array<{ path: string[]; url: string }> {
  const directUrl = cleanImageUrl(value);
  if (directUrl) return [{ path, url: directUrl }];

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectGelatoImageUrls(entry, [...path, String(index)]));
  }

  if (!isPlainObject(value)) return [];

  return Object.entries(value).flatMap(([key, entry]) =>
    collectGelatoImageUrls(entry, [...path, key]),
  );
}

function scoreGelatoImageUrl(entry: { path: string[]; url: string }, terms: string[]) {
  const path = entry.path.join(" ").toLowerCase();
  return terms.reduce((score, term) => score + (path.includes(term) ? 1 : 0), 0);
}

export function extractGelatoColorImages(products: GelatoCatalogSearchProduct[]): GelatoColorImages {
  const urls = products.flatMap((product) => collectGelatoImageUrls(product));

  const pick = (terms: string[]) =>
    urls
      .map((entry) => ({ ...entry, score: scoreGelatoImageUrl(entry, terms) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.url ?? null;

  return {
    mockup_front: pick(["front", "mockup"]) ?? pick(["front"]) ?? pick(["mockup"]),
    mockup_back: pick(["back", "mockup"]) ?? pick(["back"]),
    thumbnail: pick(["thumbnail"]) ?? pick(["preview"]) ?? pick(["image"]),
  };
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

function normalizePrintPricingCache(value: unknown): GelatoPrintPricingCache {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const readEntry = (entry: unknown): GelatoPrintPricingEntry | null => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const row = entry as Record<string, unknown>;
    const productUid = cleanString(row.productUid);
    const cost = cleanNumber(row.cost);
    if (!productUid || cost === null || cost <= 0) return null;
    return { productUid, cost: roundMoney(cost) };
  };

  return {
    front: readEntry(record.front),
    frontBack: readEntry(record.frontBack),
  };
}

function mergeGelatoAttributesWithPrintPricing(
  existing: JsonValue | null,
  countryCode: string,
  currency: string,
  printPricing: GelatoPrintPricingCache,
): JsonValue {
  const base: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const currentPrintPricing = base.printPricing && typeof base.printPricing === "object" && !Array.isArray(base.printPricing)
    ? { ...(base.printPricing as Record<string, unknown>) }
    : {};
  const currentCountry = currentPrintPricing[countryCode] && typeof currentPrintPricing[countryCode] === "object" && !Array.isArray(currentPrintPricing[countryCode])
    ? { ...(currentPrintPricing[countryCode] as Record<string, unknown>) }
    : {};

  currentCountry[currency] = {
    ...(printPricing.front ? { front: printPricing.front } : {}),
    ...(printPricing.frontBack ? { frontBack: printPricing.frontBack } : {}),
  };
  currentPrintPricing[countryCode] = currentCountry;
  base.printPricing = currentPrintPricing;
  return base as JsonValue;
}

function cleanPrintPricingMarketCountry(value: unknown): string | null {
  return cleanCountryIso(value);
}

function cleanPrintPricingMarketCurrency(value: unknown): string | null {
  const currency = cleanString(value)?.toUpperCase() ?? null;
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function buildGelatoBaseGarmentKey(attributes: Record<string, unknown>): string {
  // Deliberately excludes GarmentPrint. 4-0 (front) and 4-4 (front+back)
  // are print configurations of the same commercial garment, not different garments.
  const familyValues = [
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentCategory"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentSubcategory", "GarmentStyle"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentCut"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["GarmentQuality"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["Brand", "ApparelManufacturer"]),
    extractFamilyAttributeValue(attributes as Record<string, string>, ["Model", "ApparelManufacturerSKU"]),
  ];

  return familyValues.map((value) => normalizeKey(value ?? "")).join("|");
}

function extractPrintPricingColorKey(attributes: Record<string, unknown>): string {
  return normalizeKey(
    extractFamilyAttributeValue(attributes as Record<string, string>, [
      "GarmentColor",
      "Color",
      "Colour",
    ]) ?? "",
  );
}

function extractPrintPricingSizeKey(attributes: Record<string, unknown>): string {
  const raw = extractFamilyAttributeValue(attributes as Record<string, string>, [
    "GarmentSize",
    "Size",
  ]);
  return normalizeKey(cleanSizeValue(raw) ?? raw ?? "");
}

function derivePrintFamilyProductUids(
  products: GelatoCatalogSearchProduct[],
  referenceProduct: GelatoProductDetails,
): GelatoCatalogSearchProduct[] {
  const referenceAttributes = isPlainObject(referenceProduct.attributes)
    ? (referenceProduct.attributes as Record<string, string>)
    : {};
  const referenceBaseGarmentKey = buildGelatoBaseGarmentKey(referenceAttributes);
  const referenceColorKey = extractPrintPricingColorKey(referenceAttributes);
  const referenceSizeKey = extractPrintPricingSizeKey(referenceAttributes);

  return products.filter((product) => {
    const attributes = isPlainObject(product.attributes) ? product.attributes as Record<string, string> : {};
    if (buildGelatoBaseGarmentKey(attributes) !== referenceBaseGarmentKey) return false;
    return (
      extractPrintPricingColorKey(attributes) === referenceColorKey &&
      extractPrintPricingSizeKey(attributes) === referenceSizeKey
    );
  });
}

async function searchGelatoPrintConfigurations(
  catalogUid: string,
  referenceProduct: GelatoProductDetails,
): Promise<GelatoCatalogSearchProduct[]> {
  const referenceAttributes = isPlainObject(referenceProduct.attributes)
    ? referenceProduct.attributes as Record<string, string>
    : {};

  // Do not scan the whole apparel catalog. Ask Gelato for the same garment/color/size
  // and the 4-4 print configuration directly. This keeps the resolver bounded and avoids
  // the previous long-running pagination loop.
  const exactFilterKeys = [
    "GarmentCategory",
    "GarmentSubcategory",
    "GarmentStyle",
    "GarmentCut",
    "GarmentQuality",
    "GarmentSize",
    "GarmentColor",
    "Brand",
    "Model",
    "ApparelManufacturer",
    "ApparelManufacturerSKU",
  ];

  const filters: CatalogSyncFilters = {};
  for (const key of exactFilterKeys) {
    const value = cleanString(referenceAttributes[key]);
    if (value) filters[key] = [value];
  }
  filters.GarmentPrint = ["4-4"];

  const startedAt = Date.now();
  console.info("[gelato:variant-print-pricing:print-config-search]", {
    step: "before-exact-4-4-search",
    catalogUid,
    frontUid: referenceProduct.productUid,
    filters,
    limit: SEARCH_PAGE_SIZE,
    offset: 0,
  });

  const page = await searchGelatoCatalogProducts(
    catalogUid,
    filters,
    SEARCH_PAGE_SIZE,
    0,
  );
  const products = normalizeGelatoSearchProducts(page);

  console.info("[gelato:variant-print-pricing:print-config-search]", {
    step: "after-exact-4-4-search",
    catalogUid,
    frontUid: referenceProduct.productUid,
    elapsedMs: Date.now() - startedAt,
    resultCount: products.length,
    candidateUids: products.slice(0, 20).map((product) => product.productUid),
  });

  const withReference = products.some((product) => product.productUid === referenceProduct.productUid)
    ? products
    : [...products, { ...referenceProduct, attributes: referenceAttributes } as GelatoCatalogSearchProduct];
  return dedupeProductsByUid(withReference);
}

function diagnosticShape(value: unknown) {
  return {
    typeofResult: typeof value,
    isArray: Array.isArray(value),
    keys: value && typeof value === "object" ? Object.keys(value as Record<string, unknown>).slice(0, 12) : [],
    rawShape: value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .slice(0, 6)
            .map(([key, entry]) => [
              key,
              Array.isArray(entry)
                ? { type: "array", length: entry.length }
                : entry && typeof entry === "object"
                  ? { type: "object", keys: Object.keys(entry as Record<string, unknown>).slice(0, 8) }
                  : { type: typeof entry, value: typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" ? entry : null },
            ]),
        )
      : value ?? null,
  };
}

function normalizeGelatoCatalogList(value: GelatoCatalogListResponse): GelatoCatalogListItem[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return (
    (Array.isArray(value.catalogs) ? value.catalogs : null) ??
    (Array.isArray(value.items) ? value.items : null) ??
    (Array.isArray(value.data) ? value.data : null) ??
    []
  );
}

function normalizeGelatoSearchProducts(value: GelatoCatalogSearchResponse | unknown): GelatoCatalogSearchProduct[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const products = (value as Record<string, unknown>).products;
  return Array.isArray(products) ? products as GelatoCatalogSearchProduct[] : [];
}

function extractCatalogUidFromGelatoProduct(product: GelatoProductDetails): string | null {
  const record = product as Record<string, unknown>;
  const catalog = isPlainObject(record.catalog) ? record.catalog as Record<string, unknown> : null;
  const attributes = isPlainObject(product.attributes) ? product.attributes as Record<string, unknown> : {};

  return (
    cleanString(record.catalogUid) ??
    cleanString(record.catalog_uid) ??
    cleanString(record.catalogId) ??
    cleanString(record.catalog_id) ??
    cleanString(catalog?.catalogUid) ??
    cleanString(catalog?.catalog_uid) ??
    cleanString(catalog?.uid) ??
    cleanString(attributes.CatalogUid) ??
    cleanString(attributes.catalogUid)
  );
}

async function findCatalogUidContainingProduct(
  productUid: string,
  familyFilters: CatalogSyncFilters,
): Promise<string | null> {
  const catalogs = await listGelatoCatalogs();
  console.info("[gelato:variant-print-pricing:catalog-list]", {
    catalogResolutionStep: "listGelatoCatalogs",
    catalogResolutionRawType: diagnosticShape(catalogs),
  });

  for (const catalog of catalogs) {
    try {
      const page = await searchGelatoCatalogProducts(catalog.catalogUid, familyFilters, SEARCH_PAGE_SIZE, 0);
      const products = normalizeGelatoSearchProducts(page);
      console.info("[gelato:variant-print-pricing:catalog-search]", {
        catalogResolutionStep: "searchGelatoCatalogProducts",
        catalogUid: catalog.catalogUid,
        catalogResolutionRawType: diagnosticShape(page),
        productsCount: products.length,
      });
      if (products.some((product) => product.productUid === productUid)) {
        return catalog.catalogUid;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function resolveGelatoPrintPricingForVariant(input: {
  productVariantId: string;
  countryCode: string;
  currency: string;
}): Promise<{
  variantId: string;
  color: string | null;
  size: string | null;
  countryCode: string;
  currency: string;
  frontUid: string;
  frontBackUid: string;
  frontCost: number;
  frontBackCost: number;
  additionalBackCost: number;
  cacheUpdated: boolean;
}> {
  const supabase = createSupabaseAdmin();
  const countryCode = cleanPrintPricingMarketCountry(input.countryCode);
  const currency = cleanPrintPricingMarketCurrency(input.currency);
  const variantId = cleanString(input.productVariantId);

  if (!variantId) throw new Error("Missing productVariantId.");
  if (!countryCode) throw new Error("Missing or invalid countryCode.");
  if (!currency) throw new Error("Missing or invalid currency.");

  const { data: variantRow, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_color_id, size, gelato_product_uid, gelato_catalog_uid, gelato_attributes")
    .eq("id", variantId)
    .maybeSingle();
  const variantGelatoCatalogUid = variantRow && typeof variantRow === "object"
    ? cleanString((variantRow as { gelato_catalog_uid?: string | null }).gelato_catalog_uid)
    : null;
  console.info("[gelato:variant-print-pricing:variant-query]", {
    productVariantId: variantId,
    variantFound: Boolean(variantRow),
    variantQueryError: variantError
      ? { code: variantError.code, message: variantError.message, details: variantError.details ?? null }
      : null,
    frontUid: variantRow && typeof variantRow === "object"
      ? cleanString((variantRow as { gelato_product_uid?: string | null }).gelato_product_uid)
      : null,
    variantGelatoCatalogUid,
    catalogResolutionStep: "variant-query",
    catalogResolutionRawType: diagnosticShape(variantRow),
  });
  if (variantError) throw new Error(variantError.message);
  if (!variantRow) throw new Error("Product variant not found.");

  const variant = variantRow as {
    id: string;
    product_color_id: string;
    size: string | null;
    gelato_product_uid: string | null;
    gelato_catalog_uid: string | null;
    gelato_attributes: JsonValue | null;
  };
  const frontUid = cleanString(variant.gelato_product_uid);
  const variantCatalogUid = cleanString(variant.gelato_catalog_uid);
  if (!frontUid) throw new Error("Missing canonical gelato_product_uid on product variant.");

  const { data: colorRow, error: colorError } = await supabase
    .from("product_colors")
    .select("id, product_id, color")
    .eq("id", variant.product_color_id)
    .maybeSingle();
  if (colorError) throw new Error(colorError.message);
  if (!colorRow) throw new Error("Product color not found for variant.");

  const colorName = cleanString((colorRow as { color?: string | null }).color ?? null);
  const sizeName = cleanString(variant.size);
  const referenceProduct = await getGelatoProduct(frontUid);
  console.info("[gelato:variant-print-pricing:catalog-resolution]", {
    productVariantId: variantId,
    variantFound: true,
    variantQueryError: null,
    frontUid,
    catalogResolutionStep: "getGelatoProduct",
    catalogResolutionRawType: diagnosticShape(referenceProduct),
  });
  const familyAttributes = extractGelatoFamilyAttributes({
    ...referenceProduct,
    productUid: frontUid,
  } as GelatoProductDetails);

  const { data: syncState, error: syncStateError } = await supabase
    .from("gelato_catalog_sync_state")
    .select("catalog_uid")
    .eq("product_id", colorRow.product_id)
    .maybeSingle();
  if (syncStateError) throw new Error(syncStateError.message);
  const productCatalogUid = extractCatalogUidFromGelatoProduct(referenceProduct);
  const familyAttributeCatalogUid = cleanString(familyAttributes.catalogUid);
  const syncStateCatalogUid = cleanString((syncState as { catalog_uid?: string | null } | null)?.catalog_uid ?? null);
  let catalogUidSource: string | null = null;
  let catalogUid =
    variantCatalogUid ??
    productCatalogUid ??
    familyAttributeCatalogUid ??
    syncStateCatalogUid;

  if (catalogUid) {
    catalogUidSource =
      catalogUid === variantCatalogUid
        ? "product_variants.gelato_catalog_uid"
        : catalogUid === productCatalogUid
          ? "getGelatoProduct"
          : catalogUid === familyAttributeCatalogUid
            ? "familyAttributes"
            : "gelato_catalog_sync_state";
  } else {
    catalogUid = await findCatalogUidContainingProduct(frontUid, familyAttributes.familyFilters);
    catalogUidSource = catalogUid ? "listGelatoCatalogs/searchGelatoCatalogProducts" : null;
  }

  console.info("[gelato:variant-print-pricing:catalog-resolution]", {
    productVariantId: variantId,
    variantFound: true,
    variantQueryError: null,
    frontUid,
    variantGelatoCatalogUid: variantCatalogUid,
    catalogResolutionStep: "resolved-catalogUid",
    catalogUid: catalogUid ?? null,
    catalogUidSource,
    catalogResolutionRawType: {
      variantGelatoCatalogUid: variantCatalogUid,
      gelatoProductCatalogUid: productCatalogUid,
      familyAttributeCatalogUid,
      syncStateCatalogUid,
      syncStateShape: diagnosticShape(syncState),
    },
  });

  if (!catalogUid) {
    throw new Error("Unable to resolve Gelato catalog UID for this product variant.");
  }

  // Print-pricing resolution must search the base garment without GarmentPrint.
  // The global family sync remains unchanged and can continue treating GarmentPrint as part of its family key.
  const printConfigurationProducts = await searchGelatoPrintConfigurations(catalogUid, referenceProduct);
  const familyCandidates = derivePrintFamilyProductUids(printConfigurationProducts, referenceProduct);
  const referenceAttributes = isPlainObject(referenceProduct.attributes)
    ? (referenceProduct.attributes as Record<string, string>)
    : {};
  const frontCandidate = familyCandidates.find((product) => product.productUid === frontUid) ?? null;
  const frontBackCandidates = familyCandidates.filter((product) => {
    if (product.productUid === frontUid) return false;
    const attributes = isPlainObject(product.attributes) ? product.attributes as Record<string, string> : {};
    const garmentPrint = normalizeKey(cleanString(attributes.GarmentPrint) ?? "");
    return garmentPrint === "4-4";
  });

  if (!frontCandidate) {
    throw new Error("Unable to resolve the canonical front product within the Gelato family.");
  }

  if (frontBackCandidates.length === 0) {
    throw new Error("Unable to resolve a front+back Gelato product UID for this variant.");
  }

  const frontPriceRows = await getGelatoProductPricesForCountry(frontUid, countryCode, currency);
  const frontPrice = frontPriceRows.find((row) =>
    cleanCountryIso(row.requestedCountry) === countryCode &&
    cleanString(row.currency)?.toUpperCase() === currency &&
    typeof row.quantity === "number" &&
    row.quantity === 1 &&
    typeof row.price === "number" &&
    row.price > 0
  );
  if (!frontPrice) {
    throw new Error(`Missing front price for ${frontUid} in ${countryCode}/${currency}.`);
  }

  const referenceVariantUid = extractVariantUidFromAttributes(referenceAttributes);
  const frontBackCandidateDetails = await Promise.all(
    frontBackCandidates.map(async (candidate) => {
      const candidateAttributes = isPlainObject(candidate.attributes)
        ? (candidate.attributes as Record<string, string>)
        : {};
      const candidateVariantUid = extractVariantUidFromAttributes(candidateAttributes);
      const prices = await getGelatoProductPricesForCountry(candidate.productUid, countryCode, currency);
      const price = prices.find((row) =>
        cleanCountryIso(row.requestedCountry) === countryCode &&
        cleanString(row.currency)?.toUpperCase() === currency &&
        typeof row.quantity === "number" &&
        row.quantity === 1 &&
        typeof row.price === "number" &&
        row.price > 0
      );
      const printKeys = Object.keys(candidateAttributes).filter((key) =>
        /print|area|side|layout|variantuid/i.test(key),
      );
      const printDeltaScore = printKeys.reduce((score, key) => {
        const referenceValue = cleanString(referenceAttributes[key]);
        const candidateValue = cleanString(candidateAttributes[key]);
        return score + (referenceValue !== candidateValue ? 1 : 0);
      }, 0);

      return {
        productUid: candidate.productUid,
        price: price?.price ?? null,
        variantUid: candidateVariantUid,
        printDeltaScore,
      };
    }),
  );

  const validBackCandidates = frontBackCandidateDetails
    .filter((candidate): candidate is { productUid: string; price: number; variantUid: string | null; printDeltaScore: number } => typeof candidate.price === "number" && candidate.price > 0)
    .sort((left, right) =>
      right.printDeltaScore - left.printDeltaScore ||
      left.price - right.price ||
      Number(Boolean(left.variantUid && left.variantUid === referenceVariantUid)) - Number(Boolean(right.variantUid && right.variantUid === referenceVariantUid)),
    );

  if (validBackCandidates.length === 0) {
    throw new Error("Unable to resolve a priced front+back Gelato product UID for this variant.");
  }

  const frontBackUid = validBackCandidates[0].productUid;
  const frontBackCost = roundMoney(validBackCandidates[0].price);
  const frontCost = roundMoney(frontPrice.price as number);
  if (frontBackCost < frontCost) {
    throw new Error(`Resolved front+back cost is lower than front cost for ${variantId}.`);
  }

  const nextAttributes = mergeGelatoAttributesWithPrintPricing(
    variant.gelato_attributes,
    countryCode,
    currency,
    {
      front: { productUid: frontUid, cost: frontCost },
      frontBack: { productUid: frontBackUid, cost: frontBackCost },
    },
  );

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ gelato_attributes: nextAttributes })
    .eq("id", variantId);
  if (updateError) throw new Error(updateError.message);

  return {
    variantId,
    color: colorName,
    size: sizeName,
    countryCode,
    currency,
    frontUid,
    frontBackUid,
    frontCost,
    frontBackCost,
    additionalBackCost: roundMoney(frontBackCost - frontCost),
    cacheUpdated: true,
  };
}


type GelatoPrintPricingEnrichmentResult = {
  productVariantId: string;
  frontUid: string;
  frontBackUid: string | null;
  marketsCached: number;
  status: "ready" | "skipped" | "error";
  error: string | null;
};

function priceRowsByMarket(prices: GelatoProductPrice[]): Map<string, { countryCode: string; currency: string; cost: number }> {
  const rows = new Map<string, { countryCode: string; currency: string; cost: number }>();
  for (const row of prices) {
    const countryCode = cleanCountryIso(row.requestedCountry) ?? resolveCountryCode(row);
    const currency = cleanString(row.currency)?.toUpperCase() ?? null;
    const quantity = typeof row.quantity === "number" && Number.isFinite(row.quantity)
      ? Math.trunc(row.quantity)
      : null;
    const price = typeof row.price === "number" && Number.isFinite(row.price)
      ? row.price
      : null;
    if (!countryCode || !currency || quantity !== 1 || price === null || price <= 0) continue;
    rows.set(`${countryCode}:${currency}`, {
      countryCode,
      currency,
      cost: roundMoney(price),
    });
  }
  return rows;
}

async function enrichSyncedVariantPrintPricing(input: {
  productVariantId: string;
  catalogUid: string;
  frontUid: string;
  referenceProduct: GelatoProductDetails;
  frontPrices: GelatoProductPrice[];
  pricingCurrency: string;
}): Promise<GelatoPrintPricingEnrichmentResult> {
  const supabase = createSupabaseAdmin();
  try {
    const printConfigurationProducts = await searchGelatoPrintConfigurations(
      input.catalogUid,
      input.referenceProduct,
    );
    const familyCandidates = derivePrintFamilyProductUids(
      printConfigurationProducts,
      input.referenceProduct,
    );
    const frontBackCandidate = familyCandidates.find((product) => {
      if (product.productUid === input.frontUid) return false;
      const attributes = isPlainObject(product.attributes)
        ? product.attributes as Record<string, string>
        : {};
      return normalizeKey(cleanString(attributes.GarmentPrint) ?? "") === "4-4";
    }) ?? null;

    if (!frontBackCandidate) {
      const result: GelatoPrintPricingEnrichmentResult = {
        productVariantId: input.productVariantId,
        frontUid: input.frontUid,
        frontBackUid: null,
        marketsCached: 0,
        status: "skipped",
        error: "No matching 4-4 Gelato product found.",
      };
      console.warn({ event: "gelato_print_pricing_enrichment", ...result });
      return result;
    }

    const frontBackPriceResult = await fetchGelatoPricesForAllCountries(
      frontBackCandidate.productUid,
      input.pricingCurrency,
    );
    const frontByMarket = priceRowsByMarket(input.frontPrices);
    const backByMarket = priceRowsByMarket(frontBackPriceResult.prices);

    const { data: currentVariant, error: currentVariantError } = await supabase
      .from("product_variants")
      .select("gelato_attributes")
      .eq("id", input.productVariantId)
      .maybeSingle();
    if (currentVariantError) throw new Error(currentVariantError.message);

    let nextAttributes = (currentVariant as { gelato_attributes?: JsonValue | null } | null)?.gelato_attributes ?? null;
    let marketsCached = 0;

    for (const [marketKey, frontMarket] of frontByMarket.entries()) {
      const frontBackMarket = backByMarket.get(marketKey);
      if (!frontBackMarket) continue;
      if (frontBackMarket.cost < frontMarket.cost) continue;

      nextAttributes = mergeGelatoAttributesWithPrintPricing(
        nextAttributes,
        frontMarket.countryCode,
        frontMarket.currency,
        {
          front: { productUid: input.frontUid, cost: frontMarket.cost },
          frontBack: { productUid: frontBackCandidate.productUid, cost: frontBackMarket.cost },
        },
      );
      marketsCached += 1;
    }

    if (marketsCached === 0) {
      const result: GelatoPrintPricingEnrichmentResult = {
        productVariantId: input.productVariantId,
        frontUid: input.frontUid,
        frontBackUid: frontBackCandidate.productUid,
        marketsCached: 0,
        status: "skipped",
        error: "No overlapping priced markets for 4-0 and 4-4.",
      };
      console.warn({ event: "gelato_print_pricing_enrichment", ...result });
      return result;
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ gelato_attributes: nextAttributes })
      .eq("id", input.productVariantId);
    if (updateError) throw new Error(updateError.message);

    const result: GelatoPrintPricingEnrichmentResult = {
      productVariantId: input.productVariantId,
      frontUid: input.frontUid,
      frontBackUid: frontBackCandidate.productUid,
      marketsCached,
      status: "ready",
      error: null,
    };
    console.info({ event: "gelato_print_pricing_enrichment", ...result });
    return result;
  } catch (error) {
    const result: GelatoPrintPricingEnrichmentResult = {
      productVariantId: input.productVariantId,
      frontUid: input.frontUid,
      frontBackUid: null,
      marketsCached: 0,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
    // Print pricing enrichment is non-fatal by design: the canonical 4-0 variant
    // remains valid and the family sync continues with the next variant.
    console.error({ event: "gelato_print_pricing_enrichment", ...result });
    return result;
  }
}

async function getProductOrThrow(productId: string): Promise<ProductRow> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("id, image, price, currency, category, title, slug, profit_markup_percentage")
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Product not found.");
  }

  return data as ProductRow;
}

const CATEGORY_MARKUP_BY_KEY: Record<string, number> = {
  tshirt: 100,
  tshirts: 100,
  hoodie: 80,
  hoodies: 80,
  sweatshirt: 80,
  sweatshirts: 80,
  cap: 100,
  caps: 100,
  bag: 100,
  bags: 100,
  accessory: 100,
  accessories: 100,
  poster: 150,
  posters: 150,
  mug: 120,
  mugs: 120,
};

function resolveCategoryMarkupPercentage(category: string | null | undefined): number {
  const key = normalizeKey(category ?? "");
  return CATEGORY_MARKUP_BY_KEY[key] ?? 100;
}

function resolveProductMarkupPercentage(product: ProductRow): number {
  const manualMarkup = cleanString(product.profit_markup_percentage);
  if (manualMarkup !== null && manualMarkup !== "") {
    const parsed = Number(manualMarkup);
    if (Number.isFinite(parsed)) {
      return normalizeProfitMarkupPercentage(parsed);
    }
  }

  return resolveCategoryMarkupPercentage(product.category);
}

export async function listGelatoCatalogs(): Promise<GelatoCatalogListItem[]> {
  const response = await gelatoFetch<GelatoCatalogListResponse>("/v3/catalogs", { method: "GET" });
  return normalizeGelatoCatalogList(response);
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
  currencyIso?: string | null,
): Promise<GelatoProductPrice[]> {
  validateProductUid(productUid);
  const country = cleanCountryIso(countryIso);
  if (!country) return [];
  const currency = cleanString(currencyIso)?.toUpperCase() ?? null;

  const params = new URLSearchParams({ country });
  if (currency) params.set("currency", currency);

  const prices = await gelatoFetch<unknown>(
    `/v3/products/${productUid}/prices?${params.toString()}`,
    { method: "GET" },
  );
  return Array.isArray(prices)
    ? prices
        .filter(isPlainObject)
        .map((price) => ({
          ...(price as GelatoProductPrice),
          requestedCountry: country,
          requestedCurrency: currency ?? undefined,
        }))
    : [];
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
  currencyIso?: string | null,
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
          prices: await getGelatoProductPricesForCountry(productUid, country, currencyIso),
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

function extractGelatoProductStatus(product: GelatoProductDetails): string | null {
  return (
    cleanString(product.attributes?.ProductStatus) ??
    cleanString(product.attributes?.State) ??
    cleanString(product.ProductStatus) ??
    cleanString(product.productStatus) ??
    cleanString(product.status) ??
    cleanString(product.state)
  );
}

function extractGelatoIsPrintable(product: GelatoProductDetails): boolean | null {
  const raw =
    product.isPrintable ??
    product.printable ??
    product.attributes?.isPrintable ??
    product.attributes?.IsPrintable;

  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
}

export function resolveGelatoMarketAvailability(input: {
  countryCode: unknown;
  productStatus: unknown;
  supportedCountries: unknown[];
  notSupportedCountries: unknown[];
  hasValidPrice: boolean;
  isPrintable?: boolean | null;
}): GelatoMarketAvailability {
  const countryCode = cleanCountryIso(input.countryCode);
  const productStatus = cleanString(input.productStatus)?.toLowerCase() ?? null;
  const supportedCountries = normalizeCountryCodes(input.supportedCountries);
  const notSupportedCountries = normalizeCountryCodes(input.notSupportedCountries);

  if (productStatus !== "activated") {
    return {
      isAvailable: false,
      reason: "product_not_active",
      source: "gelato_product_details",
    };
  }

  if (input.isPrintable === false) {
    return {
      isAvailable: false,
      reason: "product_not_printable",
      source: "gelato_product_details",
    };
  }

  const explicitlySupported = Boolean(countryCode && supportedCountries.includes(countryCode));
  const explicitlyBlocked = Boolean(countryCode && notSupportedCountries.includes(countryCode));
  const suspiciousAvailabilityPayload =
    supportedCountries.length === 0 &&
    notSupportedCountries.length > 200 &&
    input.hasValidPrice;

  if (suspiciousAvailabilityPayload) {
    return {
      isAvailable: false,
      reason: "availability_requires_quote",
      source: "gelato_product_details",
    };
  }

  if (explicitlySupported && explicitlyBlocked) {
    return {
      isAvailable: false,
      reason: "availability_conflict",
      source: "gelato_product_details",
    };
  }

  if (explicitlyBlocked) {
    return {
      isAvailable: false,
      reason: "country_not_supported",
      source: "gelato_product_details",
    };
  }

  if (explicitlySupported && input.hasValidPrice) {
    return {
      isAvailable: true,
      reason: null,
      source: "gelato_product_details",
    };
  }

  if (explicitlySupported && !input.hasValidPrice) {
    return {
      isAvailable: false,
      reason: "price_unavailable",
      source: "gelato_product_details",
    };
  }

  if (!explicitlySupported && !explicitlyBlocked && input.hasValidPrice) {
    return {
      isAvailable: false,
      reason: "availability_not_confirmed",
      source: "price_only",
    };
  }

  return {
    isAvailable: false,
    reason: "availability_not_confirmed",
    source: "gelato_product_details",
  };
}

function normalizeGelatoProductPrices(prices: GelatoProductPrice[]): JsonValue[] {
  const normalizedPrices: JsonValue[] = [];

  for (const price of prices) {
    const country = cleanCountryIso(price.requestedCountry) ?? resolveCountryCode(price);
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
      requestedCountry: cleanCountryIso(price.requestedCountry),
      requestedCurrency: cleanString(price.requestedCurrency)?.toUpperCase() ?? null,
      quantity,
      price: roundMoney(amount),
      currency,
      pageCount: typeof price.pageCount === "number" ? price.pageCount : null,
    });
  }

  return normalizedPrices;
}

function withoutRegionalAvailabilityAttributes(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {};
  const { countries: _countries, notSupportedCountries: _notSupportedCountries, ...stableAttributes } = value;
  return stableAttributes;
}

function pickGelatoBaseVariantPrice(prices: GelatoProductPrice[]): GelatoSelectedPrice | null {
  const preferredCountries = [
    cleanCountryIso(process.env.GELATO_DEFAULT_PRICE_COUNTRY),
    "US",
    "PT",
  ].filter((country): country is string => Boolean(country));

  const validPrices = prices
    .map((price) => ({
      country: cleanCountryIso(price.requestedCountry) ?? resolveCountryCode(price),
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
  return String(extractGelatoProductStatus(product) ?? "").trim().toLowerCase() === "activated";
}

function nowIso() {
  return new Date().toISOString();
}

function resolvePricingCurrency(value: unknown): string {
  void value;
  return "EUR";
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

function isMissingGelatoMarketConflictConstraint(error: { message?: string } | null) {
  return (error?.message ?? "").includes(
    "there is no unique or exclusion constraint matching the ON CONFLICT specification",
  );
}

const GELATO_MARKET_DIAGNOSTIC_COUNTRIES = new Set([
  "FR",
  "PT",
  "ES",
  "DE",
  "NL",
  "IT",
  "BE",
  "US",
  "GB",
]);

function logGelatoMarketAvailabilityDiagnostic(input: {
  productUid: string;
  countryCode: string;
  productStatus: string | null;
  supportedCountries: string[];
  notSupportedCountries: string[];
  hasValidPrice: boolean;
  availability: GelatoMarketAvailability;
}) {
  if (!GELATO_MARKET_DIAGNOSTIC_COUNTRIES.has(input.countryCode)) return;

  console.info({
    event: "gelato_market_availability_resolved",
    productUid: input.productUid,
    productStatus: input.productStatus,
    normalizedSupportedCountries: input.supportedCountries,
    normalizedNotSupportedCountries: input.notSupportedCountries,
    countryCode: input.countryCode,
    supported: input.supportedCountries.includes(input.countryCode),
    blocked: input.notSupportedCountries.includes(input.countryCode),
    hasValidPrice: input.hasValidPrice,
    resolvedAvailability: input.availability.isAvailable,
    resolvedReason: input.availability.reason,
  });

  if (
    input.supportedCountries.length === 0 &&
    input.notSupportedCountries.length > 200 &&
    input.hasValidPrice &&
    input.productStatus?.toLowerCase() === "activated"
  ) {
    console.warn({
      event: "SUSPICIOUS_AVAILABILITY_PAYLOAD",
      productUid: input.productUid,
      countryCode: input.countryCode,
      reason: input.availability.reason,
    });
  }
}

function pickBestMarketForCountry(
  markets: GelatoVariantPriceRow[],
  country: string,
  preferredCurrency?: string | null,
) {
  const preferred = cleanString(preferredCurrency)?.toUpperCase() ?? null;
  const countryMarkets = markets.filter((entry) => entry.country_code === country);
  return (
    (preferred ? countryMarkets.find((entry) => entry.currency === preferred) : null) ??
    countryMarkets.find((entry) => entry.currency === "EUR") ??
    countryMarkets[0] ??
    null
  );
}

export function pickVariantReferenceMarket(markets: GelatoVariantPriceRow[], preferredCurrency?: string | null) {
  const preferredCountries = [
    cleanCountryIso(process.env.GELATO_DEFAULT_PRICE_COUNTRY),
    "FR",
  ].filter((country): country is string => Boolean(country));

  const validMarkets = markets.filter(
    (market) => market.quantity === 1 && typeof market.product_price === "number" && market.product_price > 0,
  );

  for (const country of preferredCountries) {
    const market = pickBestMarketForCountry(validMarkets, country, preferredCurrency);
    if (market) return market;
  }

  return validMarkets[0] ?? null;
}

function buildVariantPriceMetadataPayload(
  market: GelatoVariantPriceRow | null,
) {
  return {
    price: market?.product_price ?? null,
  };
}

function extractReferenceVariantProductionCost(
  marketRows: GelatoVariantPriceRow[],
  gelatoPrices: JsonValue[],
  preferredCurrency?: string | null,
): { productionCost: number | null; currency: string | null; source: string | null } {
  const validFrMarkets = marketRows.filter((market) => market.country_code === "FR" && market.quantity === 1 && typeof market.product_price === "number" && market.product_price > 0);
  const frMarket = pickBestMarketForCountry(validFrMarkets, "FR", preferredCurrency);
  if (frMarket?.product_price) {
    return {
      productionCost: frMarket.product_price,
      currency: frMarket.currency ?? null,
      source: "gelato_variant_markets",
    };
  }

  const preferred = cleanString(preferredCurrency)?.toUpperCase() ?? null;
  const fallbackCandidates = gelatoPrices.filter((entry) => {
    if (!isPlainObject(entry)) return false;
    return (
      cleanCountryIso((entry as Record<string, unknown>).country) === "FR" &&
      Number((entry as Record<string, unknown>).quantity ?? 0) === 1 &&
      Number((entry as Record<string, unknown>).price ?? 0) > 0
    );
  }) as Record<string, unknown>[];
  const fallback =
    (preferred ? fallbackCandidates.find((entry) => cleanString(entry.currency)?.toUpperCase() === preferred) : null) ??
    fallbackCandidates.find((entry) => cleanString(entry.currency)?.toUpperCase() === "EUR") ??
    fallbackCandidates[0];

  const fallbackPrice = Number(fallback?.price);
  if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) {
    return {
      productionCost: fallbackPrice,
      currency: cleanString(fallback?.currency)?.toUpperCase() ?? null,
      source: "gelato_attributes.gelatoPrices",
    };
  }

  return { productionCost: null, currency: null, source: null };
}

function calculateVariantSellingPrice(input: {
  productionCost: number | null;
  markupPercentage: unknown;
  category?: string | null;
  title?: string | null;
  slug?: string | null;
  gelatoProductUid?: string | null;
  variantName?: string | null;
  targetCurrency?: string | null;
  sourceCurrency?: string | null;
}): number | null {
  if (input.productionCost === null) return null;
  const sizeKey = cleanString(input.variantName)
    ?.split("/")
    .pop()
    ?.trim()
    .toLowerCase();
  const uidSizeKey = cleanString(input.gelatoProductUid)?.toLowerCase().match(/(?:^|_)gsi_([^_]+)/)?.[1] ?? null;
  const usesLargeSizePricing = sizeKey === "4xl" || sizeKey === "5xl" || uidSizeKey === "4xl" || uidSizeKey === "5xl";
  const pricingRule = resolvePricingRule({
    category: input.category,
    title: input.title,
    slug: input.slug,
    gelatoProductUid: input.gelatoProductUid,
    variantName: input.variantName,
  });
  const sellingPrice = usesLargeSizePricing
    ? roundSellingPrice(input.productionCost * 1.5)
    : calculateSellingPrice({
        productionCost: input.productionCost,
        markupPercentage: input.markupPercentage,
        category: input.category,
        title: input.title,
        slug: input.slug,
        gelatoProductUid: input.gelatoProductUid,
        variantName: input.variantName,
        minimumProfit: pricingRule.minimumProfit,
      });
  if (sellingPrice === null) return null;

  const targetCurrency = cleanString(input.targetCurrency)?.toUpperCase() ?? "EUR";
  const sourceCurrency = cleanString(input.sourceCurrency)?.toUpperCase() ?? targetCurrency;

  if (sourceCurrency !== targetCurrency) {
    try {
      return roundSellingPrice(convertMoneyToCents(sellingPrice, sourceCurrency, targetCurrency) / 100);
    } catch {
      return null;
    }
  }

  return roundSellingPrice(sellingPrice);
}

export function buildGelatoVariantMarketRows(input: {
  productUid: string;
  productVariantId: string;
  prices: GelatoProductPrice[];
  notSupportedCountries: string[];
  explicitSupportedCountries: string[];
  hasExplicitSupportedCountries: boolean;
  productIsAvailable: boolean;
  productStatus?: string | null;
  isPrintable?: boolean | null;
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
  const marketsByKey = new Map<string, GelatoVariantMarketRow>();
  const normalizedSupportedCountries = Array.from(explicitSupportedCountries);
  const normalizedNotSupportedCountries = Array.from(notSupportedCountries);
  const productStatus = input.productStatus ?? (input.productIsAvailable ? "activated" : "inactive");

  for (const price of input.prices) {
    const country = cleanCountryIso(price.requestedCountry) ?? resolveCountryCode(price);
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
    const availability = resolveGelatoMarketAvailability({
      countryCode: country,
      productStatus,
      supportedCountries: input.hasExplicitSupportedCountries
        ? normalizedSupportedCountries
        : [],
      notSupportedCountries: normalizedNotSupportedCountries,
      hasValidPrice,
      isPrintable: input.isPrintable,
    });
    const explicitlySupported = explicitSupportedCountries.has(country);
    const explicitlyUnsupported = notSupportedCountries.has(country);
    const availabilityConflict = explicitlySupported && explicitlyUnsupported;

    if (availabilityConflict && input.logAvailabilityConflicts) {
      console.warn({
        event: "gelato_availability_conflict",
        productUid: input.productUid,
        countryCode: country,
      });
    }

    logGelatoMarketAvailabilityDiagnostic({
      productUid: input.productUid,
      countryCode: country,
      productStatus,
      supportedCountries: input.hasExplicitSupportedCountries ? normalizedSupportedCountries : [],
      notSupportedCountries: normalizedNotSupportedCountries,
      hasValidPrice,
      availability,
    });

    const marketKey = `${country}:${currency}:${quantity}`;
    marketsByKey.set(marketKey, {
      product_variant_id: input.productVariantId,
      country_code: country,
      currency,
      is_available: availability.isAvailable,
      product_price: productPrice,
      quantity: 1,
      availability_source: availability.source,
      price_source: "gelato_product_prices",
      unavailable_reason: availability.reason,
      price_checked_at: input.syncedAt,
      availability_checked_at: input.syncedAt,
      updated_at: nowIso(),
    });
  }

  return Array.from(marketsByKey.values());
}

function buildGelatoVariantPriceRows(input: {
  productVariantId: string;
  prices: GelatoProductPrice[];
  syncedAt: string;
}): GelatoVariantPriceRow[] {
  const rowsByKey = new Map<string, GelatoVariantPriceRow>();

  for (const price of input.prices) {
    const country = cleanCountryIso(price.requestedCountry) ?? resolveCountryCode(price);
    const currency = cleanString(price.currency)?.toUpperCase() ?? null;
    const quantity = typeof price.quantity === "number" && Number.isFinite(price.quantity)
      ? Math.trunc(price.quantity)
      : null;
    const amount = typeof price.price === "number" && Number.isFinite(price.price)
      ? price.price
      : null;

    if (!country || !currency || quantity !== 1) continue;

    rowsByKey.set(`${country}:${currency}:${quantity}`, {
      product_variant_id: input.productVariantId,
      country_code: country,
      currency,
      product_price: amount !== null && amount > 0 ? roundMoney(amount) : null,
      quantity: 1,
      price_source: "gelato_product_prices",
      price_checked_at: input.syncedAt,
      updated_at: nowIso(),
    });
  }

  return Array.from(rowsByKey.values());
}

async function saveGelatoVariantPrices(input: {
  productVariantId: string;
  prices: GelatoProductPrice[];
  syncedAt: string;
}): Promise<GelatoVariantPriceRow[]> {
  const rows = buildGelatoVariantPriceRows(input);
  if (rows.length === 0) return rows;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("gelato_variant_markets").upsert(rows, {
    onConflict: "product_variant_id,country_code,currency,quantity",
  });
  if (error && !shouldIgnoreMissingGelatoMarketTable(error)) throw new Error(error.message);

  return rows;
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
  productStatus?: string | null;
  isPrintable?: boolean | null;
  syncedAt: string;
}): Promise<GelatoVariantMarketRow[]> {
  const supabase = createSupabaseAdmin();
  const marketRows = buildGelatoVariantMarketRows({
    ...input,
    logAvailabilityConflicts: true,
  });
  const syncedCountries = marketRows.map((market) => market.country_code);

  if (marketRows.length > 0 && !marketRows.some((market) => market.is_available)) {
    console.warn({
      event: "NO_AVAILABLE_MARKETS_FOUND",
      productUid: input.productUid,
      productVariantId: input.productVariantId,
      countries: syncedCountries,
    });
  }

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

export async function refreshProductVariantSellingPrices(productId: string): Promise<{
  updatedVariants: number;
  updatedProductPrice: number | null;
  unsoldVariants: number;
}> {
  const supabase = createSupabaseAdmin();
  const product = await getProductOrThrow(productId);
  const manualMarkup = cleanString(product.profit_markup_percentage);
  const markupPercentage =
    manualMarkup !== null && manualMarkup !== ""
      ? normalizeProfitMarkupPercentage(manualMarkup)
      : resolveCategoryMarkupPercentage(product.category);

  if (manualMarkup === null || manualMarkup === "") {
    const { error: markupUpdateError } = await supabase
      .from("products")
      .update({
        profit_markup_percentage: markupPercentage,
        updated_at: nowIso(),
      })
      .eq("id", productId);
    if (markupUpdateError) throw new Error(markupUpdateError.message);
  }

  const { data: variantRows, error: variantError } = await supabase
    .from("product_variants")
    .select(
      "id, product_color_id, price, name, size, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status, gelato_attributes",
    )
    .in(
      "product_color_id",
      (
        await supabase
          .from("product_colors")
          .select("id")
          .eq("product_id", productId)
      ).data?.map((color) => color.id).filter(Boolean) ?? [],
    );

  if (variantError) throw new Error(variantError.message);

  const variants = (variantRows ?? []) as ProductVariantPricingRow[];
  const variantIds = variants.map((variant) => variant.id).filter(Boolean);

  const { data: marketRows, error: marketError } = variantIds.length
    ? await supabase
        .from("gelato_variant_markets")
        .select("product_variant_id, country_code, currency, is_available, product_price, quantity")
        .in("product_variant_id", variantIds)
        .eq("country_code", "FR")
        .eq("quantity", 1)
    : { data: [], error: null };

  if (marketError) throw new Error(marketError.message);

  const marketsByVariantId = new Map<string, GelatoVariantMarketRow[]>();
  for (const market of (marketRows ?? []) as GelatoVariantMarketRow[]) {
    const list = marketsByVariantId.get(market.product_variant_id) ?? [];
    list.push(market);
    marketsByVariantId.set(market.product_variant_id, list);
  }

  let updatedVariants = 0;
  let unsoldVariants = 0;
  const sellingPrices: number[] = [];

  for (const variant of variants) {
    const variantMarkets = marketsByVariantId.get(variant.id) ?? [];
    const market = pickVariantReferenceMarket(variantMarkets, resolvePricingCurrency(product.currency));
    const gelatoAttributes = isPlainObject(variant.gelato_attributes)
      ? (variant.gelato_attributes as Record<string, unknown>)
      : null;
    const fallbackPrices = Array.isArray(gelatoAttributes?.gelatoPrices)
      ? (gelatoAttributes.gelatoPrices as JsonValue[])
      : [];
    const reference = extractReferenceVariantProductionCost(
      market ? [market as GelatoVariantMarketRow] : [],
      fallbackPrices,
      cleanString(product.currency)?.toUpperCase() ?? null,
    );
    const currentPrice = Number(variant.price);
    const sellingPrice = calculateVariantSellingPrice({
      productionCost: reference.productionCost,
      markupPercentage,
      category: product.category,
      title: product.title,
      slug: product.slug,
      gelatoProductUid: variant.gelato_product_uid,
      variantName: variant.name ?? variant.size,
    });

    if (sellingPrice === null) {
      unsoldVariants += 1;
      continue;
    }

    const shouldUpdate =
      !Number.isFinite(currentPrice) ||
      currentPrice <= 0 ||
      pricesAlmostEqual(currentPrice, reference.productionCost) ||
      pricesAlmostEqual(currentPrice, sellingPrice) === false;

    if (shouldUpdate) {
      const { error } = await supabase
        .from("product_variants")
        .update({
          price: sellingPrice,
          gelato_sync_status: variant.gelato_sync_status ?? "active",
          gelato_last_synced_at: nowIso(),
        })
        .eq("id", variant.id);
      if (error) throw new Error(error.message);
      updatedVariants += 1;
    }

    sellingPrices.push(sellingPrice);
  }

  const updatedProductPrice = sellingPrices.length > 0 ? Math.min(...sellingPrices) : null;
  if (updatedProductPrice !== null) {
    const { error } = await supabase
      .from("products")
      .update({
        price: updatedProductPrice,
        updated_at: nowIso(),
      })
      .eq("id", productId);
    if (error) throw new Error(error.message);
  }

  return {
    updatedVariants,
    updatedProductPrice,
    unsoldVariants,
  };
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
    skipSellingPriceRefresh?: boolean;
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
  const productRecord = await getProductOrThrow(productId);
  const productCurrency = resolvePricingCurrency(productRecord.currency);
  const markupPercentage = normalizeProfitMarkupPercentage(productRecord.profit_markup_percentage);

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

  const supabase = createSupabaseAdmin();

  getProductFamilyProgressPayload(
    productId,
    referenceProductUid,
    familyAttributes.familyKey,
    "A procurar variantes",
  );

  const colorSelect = "id, product_id, color, color_hex, mockup_front, mockup_back, thumbnail, position, gelato_color_key, gelato_sync_status";
  const { data: colorRows, error: colorsError } = await supabase
    .from("product_colors")
    .select(colorSelect)
    .eq("product_id", productId);

  if (colorsError) throw new Error(colorsError.message);

  const existingColors = (colorRows ?? []) as unknown as ExistingColorRow[];
  const existingColorIds = existingColors.map((color) => color.id);
  let existingVariants: ExistingVariantRow[] = [];

  if (existingColorIds.length > 0) {
    const variantSelect = "id, product_color_id, size, sku, stock, price, name, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status, gelato_attributes";
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
    const gelatoColorImages = extractGelatoColorImages(entries.map((entry) => entry.product));
    let colorId = existingColor?.id ?? null;
    const colorPayload = {
      product_id: productId,
      color: firstEntry.colorName,
      color_hex: resolveGelatoColorHex({
        colorKey,
        colorName: firstEntry.colorName,
        gelatoHex: existingColor?.color_hex ?? firstEntry.colorHex,
      }),
      mockup_front: existingColor?.mockup_front ?? gelatoColorImages.mockup_front,
      mockup_back: existingColor?.mockup_back ?? gelatoColorImages.mockup_back,
      thumbnail: existingColor?.thumbnail ?? gelatoColorImages.thumbnail,
      position: existingColor?.position ?? colorIdByKey.size,
      gelato_color_key: colorKey,
      gelato_attributes: {
        attributeUid: firstEntry.colorAttributeUid,
        attributeValueUid: firstEntry.colorValueUid,
        colorHex: firstEntry.colorHex,
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
      const entryPriceResult = await fetchGelatoPricesForAllCountries(entry.product.productUid, productCurrency);
      const entryPriceRows = entryPriceResult.prices;
      const normalizedEntryPrices = normalizeGelatoProductPrices(entryPriceRows);
      const gelatoVariantUid =
        extractVariantUidFromAttributes(entry.product.attributes) ?? entry.product.productUid;
      const variantName = `${entry.colorName} / ${entry.sizeName}`;
      const familyPriceRows = buildGelatoVariantPriceRows({
        productVariantId: existingVariant?.id ?? "pending",
        prices: entryPriceRows,
        syncedAt: syncStartedAt,
      });

      const referenceMarket = pickVariantReferenceMarket(familyPriceRows, productCurrency);
      const referenceProduction = extractReferenceVariantProductionCost(
        familyPriceRows,
        normalizedEntryPrices,
        productCurrency,
      );
      const sellingPrice = calculateVariantSellingPrice({
        productionCost: referenceProduction.productionCost,
        markupPercentage,
        category: productRecord.category,
        title: productRecord.title,
        slug: productRecord.slug,
        gelatoProductUid: entry.product.productUid,
        variantName,
        targetCurrency: productCurrency,
        sourceCurrency: referenceProduction.currency,
      });
      const variantPayload = {
        product_color_id: colorId,
        size: entry.sizeName,
        name: variantName,
        sku: buildGelatoVariantSku(entry),
        ...(!existingVariant ? { stock: 999 } : {}),
        ...buildVariantPriceMetadataPayload(referenceMarket),
        price: sellingPrice ?? existingVariant?.price ?? null,
        gelato_product_uid: entry.product.productUid,
        gelato_product_name: getGelatoProductName(entryDetails),
        gelato_catalog_uid: catalogUid,
        gelato_variant_uid: gelatoVariantUid,
        gelato_variant_key: entry.variantKey,
        gelato_attributes: {
          ...withoutRegionalAvailabilityAttributes(existingVariant?.gelato_attributes),
          ...withoutRegionalAvailabilityAttributes(entry.product.attributes),
          colorHex: entry.colorHex,
          gelatoPrices: normalizedEntryPrices,
        },
        gelato_sync_status: "active",
        gelato_last_synced_at: syncStartedAt,
        gelato_last_seen_at: syncStartedAt,
      };

      if (existingVariant) {
        const { error } = await supabase.from("product_variants").update(variantPayload).eq("id", existingVariant.id);
        if (error) throw new Error(error.message);
        touchedVariantIds.add(existingVariant.id);
        touchedFamilyVariantKeys.add(variantLookupKey);
        await saveGelatoVariantPrices({
          productVariantId: existingVariant.id,
          prices: entryPriceRows,
          syncedAt: syncStartedAt,
        });
        await enrichSyncedVariantPrintPricing({
          productVariantId: existingVariant.id,
          catalogUid,
          frontUid: entry.product.productUid,
          referenceProduct: entryDetails,
          frontPrices: entryPriceRows,
          pricingCurrency: productCurrency,
        });
        variantsUpdated += 1;
      } else {
        const { data, error } = await supabase.from("product_variants").insert(variantPayload).select("id").single();
        if (error || !data?.id) throw new Error(error?.message || "Failed to create product variant.");
        const productVariantId = data.id as string;
        touchedVariantIds.add(productVariantId);
        touchedFamilyVariantKeys.add(variantLookupKey);
        await saveGelatoVariantPrices({
          productVariantId,
          prices: entryPriceRows,
          syncedAt: syncStartedAt,
        });
        await enrichSyncedVariantPrintPricing({
          productVariantId,
          catalogUid,
          frontUid: entry.product.productUid,
          referenceProduct: entryDetails,
          frontPrices: entryPriceRows,
          pricingCurrency: productCurrency,
        });
        variantsCreated += 1;
      }
    }
  }

  const staleVariantIds = existingVariants
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

  if (!input.skipSellingPriceRefresh) {
    await refreshProductVariantSellingPrices(productId);
  }

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
    const productCurrency = resolvePricingCurrency(existingProduct.currency);
    const markupPercentage = normalizeProfitMarkupPercentage(
      existingProduct.profit_markup_percentage,
    );
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
      productCurrency,
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
    const gelatoProductStatus = extractGelatoProductStatus(matchedProductDetails);
    const gelatoIsPrintable = extractGelatoIsPrintable(matchedProductDetails);
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
          "id, product_color_id, size, sku, stock, price, name, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status, gelato_attributes",
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
          productStatus: gelatoProductStatus,
          isPrintable: gelatoIsPrintable,
          syncedAt: startedAt,
        });
        const variantGelatoAvailable = variantMarketPreview.some(
          (market) => market.is_available === true,
        );
        const referenceMarket = pickVariantReferenceMarket(variantMarketPreview, productCurrency);
        const referenceProduction = extractReferenceVariantProductionCost(
          variantMarketPreview,
          gelatoPrices,
          productCurrency,
        );
        const sellingPrice = calculateVariantSellingPrice({
          productionCost: referenceProduction.productionCost,
          markupPercentage,
          category: existingProduct.category,
          title: existingProduct.title,
          slug: existingProduct.slug,
          gelatoProductUid: entry.product.productUid,
          variantName,
          targetCurrency: productCurrency,
          sourceCurrency: referenceProduction.currency,
        });
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: variantName,
          sku: buildGelatoVariantSku(entry),
          stock: existingVariant?.stock && existingVariant.stock > 0 ? existingVariant.stock : 999,
          ...buildVariantPriceMetadataPayload(referenceMarket),
          price: sellingPrice ?? existingVariant?.price ?? null,
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
            productStatus: gelatoProductStatus,
            isPrintable: gelatoIsPrintable,
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
            productStatus: gelatoProductStatus,
            isPrintable: gelatoIsPrintable,
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

    await refreshProductVariantSellingPrices(productId);

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
    const productCurrency = resolvePricingCurrency(existingProduct.currency);
    const markupPercentage = normalizeProfitMarkupPercentage(
      existingProduct.profit_markup_percentage,
    );
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
          "id, product_color_id, size, sku, stock, price, name, gelato_product_uid, gelato_variant_uid, gelato_variant_key, gelato_sync_status, gelato_attributes",
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
        const entryDetails = (await getGelatoProduct(entry.product.productUid)) as GelatoProductDetails;
        const entryPriceResult = await fetchGelatoPricesForAllCountries(entry.product.productUid, productCurrency);
        const entryPriceRows = entryPriceResult.prices;
        const normalizedEntryPrices = normalizeGelatoProductPrices(entryPriceRows);
        const entrySupportedResult = extractSupportedCountries(entryDetails);
        const entryExplicitSupportedCountries = entrySupportedResult.countries;
        const entryNotSupportedCountries = extractNotSupportedCountries(entryDetails);
        const entryProductIsAvailable = isGelatoProductAvailable(entryDetails);
        const entryProductStatus = extractGelatoProductStatus(entryDetails);
        const entryIsPrintable = extractGelatoIsPrintable(entryDetails);
        const gelatoVariantUid = extractVariantUidFromAttributes(entry.product.attributes);
        const variantName = `${entry.colorName} / ${entry.sizeName}`;
        const variantMarketPreview = buildGelatoVariantMarketRows({
          productUid: entry.product.productUid,
          productVariantId: existingVariant?.id ?? "pending",
          prices: entryPriceRows,
          notSupportedCountries: entryNotSupportedCountries,
          explicitSupportedCountries: entryExplicitSupportedCountries,
          hasExplicitSupportedCountries: entrySupportedResult.hasExplicitSupportedCountries,
          productIsAvailable: entryProductIsAvailable,
          productStatus: entryProductStatus,
          isPrintable: entryIsPrintable,
          syncedAt: startedAt,
        });
        const referenceMarket = pickVariantReferenceMarket(variantMarketPreview, productCurrency);
        const referenceProduction = extractReferenceVariantProductionCost(
          variantMarketPreview,
          normalizedEntryPrices,
          productCurrency,
        );
        const sellingPrice = calculateVariantSellingPrice({
          productionCost: referenceProduction.productionCost,
          markupPercentage,
          category: existingProduct.category,
          title: existingProduct.title,
          slug: existingProduct.slug,
          gelatoProductUid: entry.product.productUid,
          variantName,
          targetCurrency: productCurrency,
          sourceCurrency: referenceProduction.currency,
        });
        const variantPayload = {
          product_color_id: colorId,
          size: entry.sizeName,
          name: variantName,
          sku: buildGelatoVariantSku(entry),
          stock: existingVariant?.stock && existingVariant.stock > 0 ? existingVariant.stock : 999,
          ...buildVariantPriceMetadataPayload(referenceMarket),
          price: sellingPrice ?? existingVariant?.price ?? null,
          gelato_product_uid: entry.product.productUid,
          gelato_product_name: getGelatoProductName(entryDetails),
          gelato_catalog_uid: catalog.catalogUid,
          gelato_variant_uid: gelatoVariantUid,
          gelato_variant_key: entry.variantKey,
          gelato_attributes: {
            ...entry.product.attributes,
            colorHex: entry.colorHex,
            countries: entryExplicitSupportedCountries,
            notSupportedCountries: entryNotSupportedCountries,
            gelatoPrices: normalizedEntryPrices,
          },
          gelato_sync_status: "active",
          gelato_available: variantMarketPreview.some((market) => market.is_available === true),
          gelato_last_seen_at: startedAt,
        };

        if (existingVariant) {
          const { error } = await supabase.from("product_variants").update(variantPayload).eq("id", existingVariant.id);
          if (error) throw new Error(error.message);
          touchedVariantIds.add(existingVariant.id);
          await saveGelatoVariantMarkets({
            productUid: entry.product.productUid,
            productVariantId: existingVariant.id,
            prices: entryPriceRows,
            failedCountries: entryPriceResult.failedCountries,
            notSupportedCountries: entryNotSupportedCountries,
            explicitSupportedCountries: entryExplicitSupportedCountries,
            hasExplicitSupportedCountries: entrySupportedResult.hasExplicitSupportedCountries,
            productIsAvailable: entryProductIsAvailable,
            productStatus: entryProductStatus,
            isPrintable: entryIsPrintable,
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
          touchedVariantIds.add(data.id as string);
          await saveGelatoVariantMarkets({
            productUid: entry.product.productUid,
            productVariantId: data.id as string,
            prices: entryPriceRows,
            failedCountries: entryPriceResult.failedCountries,
            notSupportedCountries: entryNotSupportedCountries,
            explicitSupportedCountries: entryExplicitSupportedCountries,
            hasExplicitSupportedCountries: entrySupportedResult.hasExplicitSupportedCountries,
            productIsAvailable: entryProductIsAvailable,
            productStatus: entryProductStatus,
            isPrintable: entryIsPrintable,
            syncedAt: startedAt,
          });
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

    if (completed) {
      await refreshProductVariantSellingPrices(productId);
    }

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
