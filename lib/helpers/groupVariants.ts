export function groupVariants(products: any[], variants: any[]) {
  const map = new Map<string, any[]>();

  for (const v of variants) {
    if (!map.has(v.product_id)) {
      map.set(v.product_id, []);
    }
    map.get(v.product_id)!.push(v);
  }

  return products.map((p) => {
    const productVariants = map.get(p.id) ?? [];

    const defaultVariant =
      productVariants.find((v) => (v.stock ?? 0) > 0) ??
      productVariants[0] ??
      null;

    return {
      ...p,
      price: defaultVariant?.price ?? p.price,
      variants: productVariants,
      defaultVariant,
    };
  });
}