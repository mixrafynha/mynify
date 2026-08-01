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

  const safeVariants = Array.isArray(variants) ? variants : [];

  const filteredByColor = selectedColor
    ? safeVariants.filter(
        (v: any) => normalize(v.color) === normalize(selectedColor)
      )
    : safeVariants;

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
    <div className="min-w-0">
      <p className="text-[13px] font-semibold tracking-[0.02em] text-white/72">
        Variants (Size)
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sizes.map((v: any, i: number) => {
          const disabled = Number(v.stock ?? 0) <= 0;
          const isActive =
            normalize(selectedVariant?.size) === normalize(v.size);

          return (
            <button
              key={`${v.size}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onChange(v);
              }}
              className={`min-w-[40px] rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] transition ${
                disabled
                  ? "cursor-not-allowed bg-white/[0.03] text-white/25"
                  : isActive
                  ? "bg-white text-[#16131d]"
                  : "bg-white/[0.05] text-white/76 hover:bg-white/[0.1] hover:text-white"
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
