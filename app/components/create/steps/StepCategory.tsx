type Category = {
  id: string;
  label: string;
  desc: string;
};

type Props = {
  onSelect: (categoryId: string) => void;
};

export default function StepCategory({ onSelect }: Props) {
  const categories: Category[] = [
    { id: "tshirt", label: "T-Shirt", desc: "Custom t-shirts" },
    { id: "hoodie", label: "Hoodie", desc: "Premium hoodies" },
    { id: "mug", label: "Mug", desc: "Custom mugs" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="
            p-6 rounded-2xl border border-white/10
            bg-white/5 hover:bg-white/10
            transition text-left
            active:scale-[0.98]
          "
        >
          <p className="text-xl font-semibold capitalize">
            {c.label}
          </p>

          <p className="text-sm text-gray-400 mt-1">
            {c.desc}
          </p>
        </button>
      ))}

    </div>
  );
}