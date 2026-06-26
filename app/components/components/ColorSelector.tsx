"use client";

export default function ColorSelector({
  variants,
  selectedColor,
  selectedVariant,
  onChange,
}: any) {
  const normalize = (v: string) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const safeVariants = variants ?? [];

  // 🔥 cores únicas REALMENTE normalizadas (sem duplicação escondida)
  const colorMap = new Map();

  safeVariants.forEach((v: any) => {
    if (!v.color) return;

    const key = normalize(v.color);

    if (!colorMap.has(key)) {
      colorMap.set(key, {
        label: v.color,
        hex: v.color_hex,
      });
    }
  });

  const colors = Array.from(colorMap.values());

  return (
    <div className="mt-6">
      <p className="text-sm font-medium">Colors</p>

      <div className="flex flex-wrap gap-3 mt-2">
        {colors.map((c: any, i: number) => {
          const normalizedColor = normalize(c.label);

          // 🔥 match seguro
          const available = safeVariants.filter(
            (v: any) =>
              normalize(v.color) === normalizedColor
          );

          const hasStock = available.some(
            (v: any) => Number(v.stock ?? 0) > 0
          );

          const isActive =
            normalize(selectedColor || "") === normalizedColor;

          // 🔥 fallback seguro de cor
          const colorHex =
            available.find((v: any) => v.color_hex)?.color_hex ||
            available[0]?.color_hex ||
            c.hex ||
            "#ccc";

          return (
            <button
              key={`${c.label}-${i}`}
              type="button"
              disabled={!hasStock}
              onClick={() => {
                const next =
                  available.find(
                    (v: any) =>
                      selectedVariant?.size &&
                      normalize(v.size) ===
                        normalize(selectedVariant.size)
                  ) || available[0] || null;

                if (!next) return;

                onChange(c.label, next);
              }}
              className="flex flex-col items-center cursor-pointer disabled:cursor-not-allowed"
            >
              <div
                className={`w-8 h-8 rounded-full border-2 transition ${
                  isActive
                    ? "border-black scale-110 shadow-md"
                    : "border-gray-300 hover:scale-105"
                } ${!hasStock ? "opacity-30" : ""}`}
                style={{
                  backgroundColor: colorHex,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}