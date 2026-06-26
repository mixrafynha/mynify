type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

type Props = {
  category: string | null;
  products: Product[];
  selected: Product | null;
  setSelected: (product: Product) => void;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
};

export default function StepProductGrid({
  category,
  products,
  selected,
  setSelected,
  loading,
  onBack,
  onNext
}: Props) {
  return (
    <div>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 capitalize">
          Choose a {category}
        </p>

        <button
          onClick={onBack}
          className="text-gray-500 hover:text-white text-sm transition"
        >
          ← Back
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-400 animate-pulse">
          Loading products...
        </div>
      )}

      {/* EMPTY */}
      {!loading && products.length === 0 && (
        <div className="text-gray-500">
          No products found for this category
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">

        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group relative text-left"
          >

            {/* IMAGE BOX */}
            <div
              className={`
                aspect-square rounded-2xl overflow-hidden
                bg-white/5 flex items-center justify-center
                transition duration-200
                group-hover:scale-[1.03]
                ${selected?.id === p.id ? "ring-2 ring-green-400" : ""}
              `}
            >

              <img
                src={p.image || "/placeholder.png"}
                alt={p.title}
                className="w-full h-full object-contain p-3 transition group-hover:scale-105"
              />

              {/* SELECTED BADGE */}
              {selected?.id === p.id && (
                <div className="absolute top-2 right-2 bg-green-400 text-black text-[10px] px-2 py-1 rounded-full font-bold">
                  Selected
                </div>
              )}

            </div>

            {/* INFO */}
            <div className="mt-2 px-1">

              <p className="text-sm font-medium text-white truncate">
                {p.title}
              </p>

              <p className="text-xs text-gray-400">
                €{p.price}
              </p>

            </div>

          </button>
        ))}

      </div>

      {/* ACTIONS */}
      <div className="flex justify-end mt-10">

        <button
          onClick={onNext}
          disabled={!selected}
          className="
            bg-white text-black px-6 py-3 rounded-xl font-bold
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:scale-[1.02] transition
          "
        >
          Continue →
        </button>

      </div>

    </div>
  );
}