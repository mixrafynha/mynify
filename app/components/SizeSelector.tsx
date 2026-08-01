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
    <div>
      <p className="text-[13px] font-bold text-white/90">Variants (Size)</p>

      <div className="mt-4 flex flex-wrap gap-2.5">
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
              className={`min-w-[44px] rounded-[10px] border px-3 py-2 text-xs font-black tracking-[0.04em] transition ${
                disabled
                  ? "cursor-not-allowed opacity-30"
                  : isActive
                  ? "border-fuchsia-400 bg-fuchsia-400/10 text-white shadow-[0_0_0_1px_rgba(232,121,249,0.35)]"
                  : "border-white/10 bg-white/[0.02] text-white/78 hover:border-white/20 hover:bg-white/[0.04]"
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
