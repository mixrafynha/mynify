import DesignUploader from "../editor/DesignUploader";
import PreviewStudio from "../editor/PreviewStudio";
import PricingPanel from "../editor/PricingPanel";

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

type Props = {
  selected: Product;
  design: string | null;
  setDesign: (url: string | null) => void;
  markup: number;
  setMarkup: (value: number) => void;
  price: number;
  onBack: () => void;
  onSave: () => void;
};

export default function StepEditor({
  selected,
  design,
  setDesign,
  markup,
  setMarkup,
  price,
  onBack,
  onSave
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* UPLOAD */}
      <DesignUploader setDesign={setDesign} />

      {/* PREVIEW */}
      <PreviewStudio
        selected={selected}
        design={design}
      />

      {/* PRICING */}
      <PricingPanel
        selected={selected}
        markup={markup}
        setMarkup={setMarkup}
        price={price}
      />

      {/* ACTIONS */}
      <div className="col-span-3 flex justify-between mt-8">

        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>

        <button
          onClick={onSave}
          className="
            bg-green-400 text-black px-6 py-3 rounded-xl font-bold
            hover:scale-[1.02] transition
            active:scale-[0.98]
          "
        >
          Save Product
        </button>

      </div>

    </div>
  );
}