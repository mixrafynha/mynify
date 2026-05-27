"use client";

type Props = {
  rotateElement: (e: React.PointerEvent) => void;
  flipElement: (e: React.PointerEvent) => void;
  duplicateElement: (e: React.PointerEvent) => void;
  removeElement: (e: React.PointerEvent) => void;
};

const baseBtn =
  "flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-black transition active:scale-95";

export default function ElementControls({
  rotateElement,
  flipElement,
  duplicateElement,
  removeElement,
}: Props) {
  const stop = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Rotate"
        title="Rotate"
        onPointerDown={(e) => {
          stop(e);
          rotateElement(e);
        }}
        className="
          pointer-events-auto absolute -top-9 left-1/2 z-30
          flex h-8 w-8 -translate-x-1/2 items-center justify-center
          rounded-full border border-violet-400/70 bg-neutral-950/95
          text-sm font-black text-white shadow-lg backdrop-blur-md
          hover:bg-violet-600 active:scale-95
        "
      >
        ↻
      </button>

      <div
        onPointerDown={stop}
        className="
          pointer-events-auto absolute left-1/2 top-full z-30 mt-2
          flex -translate-x-1/2 items-center gap-1 rounded-full
          border border-white/10 bg-neutral-950/95 px-1.5 py-1
          text-white shadow-xl backdrop-blur-md
          max-sm:mt-1 max-sm:scale-90
        "
      >
        <button
          type="button"
          aria-label="Flip"
          title="Flip"
          onPointerDown={(e) => {
            stop(e);
            flipElement(e);
          }}
          className={`${baseBtn} px-2 text-white/90 hover:bg-violet-600`}
        >
          Flip
        </button>

        <button
          type="button"
          aria-label="Copy"
          title="Copy"
          onPointerDown={(e) => {
            stop(e);
            duplicateElement(e);
          }}
          className={`${baseBtn} px-2 text-white/90 hover:bg-violet-600`}
        >
          Copy
        </button>

        <button
          type="button"
          aria-label="Delete"
          title="Delete"
          onPointerDown={(e) => {
            stop(e);
            removeElement(e);
          }}
          className={`${baseBtn} px-2 text-red-300 hover:bg-red-600 hover:text-white`}
        >
          Del
        </button>
      </div>
    </>
  );
}