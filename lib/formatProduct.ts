type ImageLike =
  | string
  | {
      url?: unknown;
      src?: unknown;
      image?: unknown;
      image_url?: unknown;
      publicUrl?: unknown;
    }
  | null
  | undefined;

function readImageUrl(value: ImageLike): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const candidates = [
    value.url,
    value.src,
    value.image,
    value.image_url,
    value.publicUrl,
  ];

  const valid = candidates.find(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.trim().length > 0
  );

  return typeof valid === "string" ? valid.trim() : "";
}

function resolveProductImages(product: any): string[] {
  const candidates: ImageLike[] = [];

  if (product?.image) {
    candidates.push(product.image);
  }

  if (Array.isArray(product?.images)) {
    candidates.push(...product.images);
  }

  const urls = candidates
    .map(readImageUrl)
    .filter(Boolean);

  return Array.from(new Set(urls));
}

export function formatProduct(p: any) {
  const product =
    p && typeof p === "object"
      ? p
      : {};

  const variants = Array.isArray(product.variants)
    ? product.variants
    : [];

  const firstVariant = variants[0];

  const images = resolveProductImages(product);

  const image =
    images[0] ||
    "/placeholder.png";

  const rawPrice =
    firstVariant?.price ??
    product.price ??
    0;

  const rawDiscountPrice =
    firstVariant?.discount_price ??
    product.discount_price ??
    null;

  const price = Number(rawPrice);
  const discountPrice =
    rawDiscountPrice === null ||
    rawDiscountPrice === undefined ||
    rawDiscountPrice === ""
      ? null
      : Number(rawDiscountPrice);

  return {
    ...product,

    id: String(product.id ?? ""),

    title:
      typeof product.title === "string" &&
      product.title.trim()
        ? product.title.trim()
        : "Untitled",

    price: Number.isFinite(price) ? price : 0,

    discount_price:
      discountPrice !== null &&
      Number.isFinite(discountPrice)
        ? discountPrice
        : null,

    currency:
      typeof product.currency === "string" &&
      product.currency.trim()
        ? product.currency.trim()
        : "EUR",

    image,
    images,

    variants,

    category:
      typeof product.category === "string"
        ? product.category
        : "",

    audience:
      product.audience === "woman" ||
      product.audience === "man" ||
      product.audience === "unisex"
        ? product.audience
        : "unisex",

    is_new: Boolean(product.is_new),
    is_hot: Boolean(product.is_hot),
    is_featured: Boolean(product.is_featured),

    sales_count: Number.isFinite(
      Number(product.sales_count)
    )
      ? Number(product.sales_count)
      : 0,
  };
}
