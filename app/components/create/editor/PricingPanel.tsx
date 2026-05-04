type Product = {
  id: string;
  name: string;
  basePrice: number;
  image: string;
};

type Props = {
  selected: Product;
  markup: number;
  setMarkup: (value: number) => void;
  price: number;
};

export default function PricingPanel({
  selected,
  markup,
  setMarkup,
  price
}: Props) {
  return (
    <div className="space-y-6">

      <div>
        <p className="text-gray-400 mb-2">Pricing</p>

        <input
          type="number"
          value={markup}
          onChange={(e) => setMarkup(Number(e.target.value))}
          className="w-full bg-black border border-white/10 px-3 py-2 rounded-lg"
        />

        <div className="mt-3 text-green-400 font-bold text-lg">
          €{price}
        </div>

        <p className="text-xs text-gray-500">
          Base €{selected.basePrice} + markup
        </p>
      </div>

      <button className="w-full bg-green-400 text-black py-3 rounded-xl font-bold hover:scale-[1.02] transition">
        Save Product
      </button>

    </div>
  );
}