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
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-white/90">Colors</p>
          <p className="mt-3 text-sm font-medium text-white/78">
            {selectedColor || selectedVariant?.color || "Choose a color"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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
                className={`h-10 w-10 rounded-full border-[1.5px] transition ${
                  isActive
                    ? "border-fuchsia-300 shadow-[0_0_0_2px_rgba(168,85,247,0.5)]"
                    : "border-white/30 hover:scale-105"
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
