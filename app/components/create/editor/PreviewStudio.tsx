type Product = {
  id: string;
  name: string;
  basePrice: number;
  image: string;
};

type Props = {
  selected: Product;
  design: string | null;
};

export default function PreviewStudio({ selected, design }: Props) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[420px] h-[520px] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">

        {/* BASE PRODUCT */}
        <img
          src={selected?.image}
          className="w-full h-full object-contain"
          alt={selected?.name || "product"}
        />

        {/* DESIGN OVERLAY */}
        {design && (
          <img
            src={design}
            className="absolute w-40 h-40 object-contain"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)"
            }}
            alt="design overlay"
          />
        )}

        {/* LABEL */}
        <div className="absolute bottom-3 text-xs text-white/40">
          Print area preview
        </div>
      </div>
    </div>
  );
}