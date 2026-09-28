"use client";

const SIZE_ORDER = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

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

  const sizeRank = (size: any) => {
    const normalized = String(size ?? "").trim().toUpperCase();
    const index = SIZE_ORDER.indexOf(normalized);
    return index === -1 ? 999 : index;
  };

  const safeVariants = Array.isArray(variants) ? variants : [];
  const isVariantSelectable = (variant: any) =>
    Number(variant?.stock ?? 0) > 0 && variant?.country_available !== false;

  const filteredByColor = selectedColor
    ? safeVariants.filter(
        (v: any) =>
          [
            v.color,
            v.color_hex,
            v.color_visual?.hex,
            v.color_visual?.cssBackground,
          ]
            .filter(Boolean)
            .some((value) => normalize(value) === normalize(selectedColor))
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

  const sizes = Array.from(uniqueSizesMap.values()).sort(
    (a: any, b: any) => sizeRank(a.size) - sizeRank(b.size)
  );

  return (
    <div className="min-w-0">
      <p className="text-sm font-black uppercase tracking-[0.12em] text-white/72">
        Variants (Size)
      </p>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(42px,1fr))] gap-2">
        {sizes.map((v: any, i: number) => {
          const disabled = !isVariantSelectable(v);
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
              className={`grid h-9 min-w-[42px] place-items-center border px-2 text-[11px] font-black tracking-[0.04em] transition ${
                disabled
                  ? "cursor-not-allowed border-white/[0.06] bg-white/[0.03] text-white/25"
                  : isActive
                  ? "border-white bg-white text-[#16131d] shadow-[0_0_0_2px_rgba(217,70,239,0.45)]"
                  : "border-white/[0.12] bg-white/[0.05] text-white/76 hover:border-fuchsia-300/50 hover:bg-white/[0.1] hover:text-white"
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
