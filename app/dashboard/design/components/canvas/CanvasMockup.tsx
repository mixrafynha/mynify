import type { Side } from "./types";

import {
  MOCKUP_VISUAL_SCALE_BY_PRODUCT,
} from "./productConfig";

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
  const visualScale =
    MOCKUP_VISUAL_SCALE_BY_PRODUCT?.[
      mockupId
    ]?.[currentSide] ?? 1;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none">
      <img
        src={mockup}
        alt={`${mockupId}-${currentSide}`}
        draggable={false}
        className="
          absolute inset-0 h-full w-full object-fill
          drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]
        "
        style={{
          transform: `scale(${visualScale})`,
          transformOrigin: "center center",
        }}
      />

      <div
        className="
          absolute inset-0
          mix-blend-multiply opacity-80
        "
        style={{
          transform: `scale(${visualScale})`,
          transformOrigin: "center center",

          backgroundColor: color,

          WebkitMaskImage: `url(${mockup})`,
          maskImage: `url(${mockup})`,

          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",

          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",

          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </div>
  );
}