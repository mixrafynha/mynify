"use client";

export default function SizeSelector({
  variants,
  selectedVariant,
  selectedColor,
  onChange,
}: any) {
  const normalize = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const safeVariants = Array.isArray(variants)
    ? variants
    : [];

  // 🔥 filtra por cor (se existir)
  const filteredByColor = selectedColor
    ? safeVariants.filter(
        (v: any) =>
          normalize(v.color) === normalize(selectedColor)
      )
    : safeVariants;

  // 🔥 remove sizes duplicados (IMPORTANTE)
  const uniqueSizesMap = new Map();

  filteredByColor.forEach((v: any) => {
    if (!v.size) return;

    const key = normalize(v.size);

    if (!uniqueSizesMap.has(key)) {
      uniqueSizesMap.set(key, v);
    }
  });

  const sizes = Array.from(uniqueSizesMap.values());

  return (
    <div className="mt-6">
      <p className="text-sm font-medium">Sizes</p>

      <div className="flex flex-wrap gap-2 mt-2">
        {sizes.map((v: any, i: number) => {
          const disabled = Number(v.stock ?? 0) <= 0;

          const isActive =
            normalize(selectedVariant?.size) ===
            normalize(v.size);

          return (
            <button
              key={`${v.size}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onChange(v);
              }}
              className={`px-3 py-1 text-xs rounded-md border transition ${
                disabled
                  ? "opacity-30 cursor-not-allowed"
                  : isActive
                  ? "bg-black text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              {v.size}
            </button>
          );
        })}
      </div>
    </div>
  );
}