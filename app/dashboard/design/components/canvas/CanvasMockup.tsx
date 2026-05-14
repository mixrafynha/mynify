import type { Side } from "./types";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: Side;
};

export default function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
}: Props) {
  return (
    <img
      src={mockup}
      alt={`${mockupId}-${currentSide}`}
      draggable={false}
      className="
        pointer-events-none
        absolute
        inset-0
        z-0
        h-full
        w-full
        select-none
        object-fill
        scale-[1.88]
        drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]
      "
      style={{
        transformOrigin: "center center",
      }}
    />
  );
}