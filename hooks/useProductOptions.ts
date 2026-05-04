import { useMemo } from "react";

export function useProductOptions(productVariants: any[]) {
  const safeVariants = Array.isArray(productVariants)
    ? productVariants
    : [];

  const variants = useMemo(() => {
    return safeVariants.map((v: any) => ({
      ...v,
      color: String(v.color ?? "")
        .trim()
        .toLowerCase(),
      size: String(v.size ?? "").trim(),
      stock: Number(v.stock ?? 0),
    }));
  }, [safeVariants]);

  const colors = useMemo(() => {
    const normalized = safeVariants
      .map((v: any) =>
        String(v.color ?? "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }, [safeVariants]);

  return { colors, variants };
}