import type { Side } from "./types";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: Side;
  color?: string;
};

export default function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
  color = "#ffffff",
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none">
      <img
        src={mockup}
        alt={`${mockupId}-${currentSide}`}
        draggable={false}
        className="
          absolute inset-0 h-full w-full object-fill
          scale-[1.48]
          drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]
        "
      />

      <div
        className="
          absolute inset-0 scale-[1.48]
          mix-blend-multiply opacity-80
        "
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${mockup})`,
          maskImage: `url(${mockup})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}