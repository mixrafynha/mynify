"use client";

type Direction =
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "t"
  | "r"
  | "b"
  | "l";

type Props = {
  resizeElement: (
    e: React.PointerEvent,
    direction: Direction
  ) => void;
};

const cornerClass =
  "pointer-events-auto absolute z-20 h-4 w-4 touch-none rounded-full border border-white/80 bg-violet-600 shadow-md transition-all duration-150 hover:scale-110 hover:bg-violet-500 active:scale-110";

const sideClass =
  "pointer-events-auto absolute z-20 touch-none rounded-full border border-white/70 bg-cyan-500 shadow-md transition-all duration-150 hover:scale-110 hover:bg-cyan-400 active:scale-110";

export default function ResizeHandles({
  resizeElement,
}: Props) {
  const startResize =
    (direction: Direction) =>
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      resizeElement(e, direction);
    };

  return (
    <>
      <span
        onPointerDown={startResize("tl")}
        className={`${cornerClass} -left-2 -top-2 cursor-nwse-resize`}
      />

      <span
        onPointerDown={startResize("tr")}
        className={`${cornerClass} -right-2 -top-2 cursor-nesw-resize`}
      />

      <span
        onPointerDown={startResize("bl")}
        className={`${cornerClass} -bottom-2 -left-2 cursor-nesw-resize`}
      />

      <span
        onPointerDown={startResize("br")}
        className={`${cornerClass} -bottom-2 -right-2 cursor-nwse-resize`}
      />

      <span
        onPointerDown={startResize("t")}
        className={`${sideClass} left-1/2 -top-[7px] h-3 w-7 -translate-x-1/2 cursor-ns-resize`}
      />

      <span
        onPointerDown={startResize("b")}
        className={`${sideClass} bottom-[-7px] left-1/2 h-3 w-7 -translate-x-1/2 cursor-ns-resize`}
      />

      <span
        onPointerDown={startResize("l")}
        className={`${sideClass} -left-[7px] top-1/2 h-7 w-3 -translate-y-1/2 cursor-ew-resize`}
      />

      <span
        onPointerDown={startResize("r")}
        className={`${sideClass} -right-[7px] top-1/2 h-7 w-3 -translate-y-1/2 cursor-ew-resize`}
      />
    </>
  );
}
