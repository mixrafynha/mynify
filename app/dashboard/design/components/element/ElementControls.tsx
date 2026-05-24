"use client";

type Props = {
  rotateElement: (e: React.PointerEvent) => void;
  flipElement: (e: React.PointerEvent) => void;
  duplicateElement: (e: React.PointerEvent) => void;
  removeElement: (e: React.PointerEvent) => void;
};

export default function ElementControls({
  rotateElement,
  flipElement,
  duplicateElement,
  removeElement,
}: Props) {
  return (
    <>
      <button
        type="button"
        onPointerDown={rotateElement}
        className="
          pointer-events-auto absolute -top-11 left-1/2 flex h-9 w-9
          -translate-x-1/2 items-center justify-center rounded-full
          border border-violet-400 bg-neutral-950 text-base font-black
          text-white shadow-[0_0_18px_rgba(168,85,247,0.55)]
          active:scale-95
        "
      >
        ↻
      </button>

      <div
        className="
          pointer-events-auto absolute -bottom-14 left-1/2 flex
          -translate-x-1/2 items-center gap-1 rounded-full
          border border-violet-500/60 bg-neutral-950/95 px-3 py-2
          text-[11px] font-bold text-white shadow-[0_0_24px_rgba(0,0,0,0.5)]
          backdrop-blur-md
          md:-bottom-14
        "
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          className="rounded-full px-2.5 py-1 hover:bg-violet-600 active:scale-95"
          onPointerDown={flipElement}
        >
          Flip
        </button>

        <button
          type="button"
          className="rounded-full px-2.5 py-1 hover:bg-violet-600 active:scale-95"
          onPointerDown={duplicateElement}
        >
          Copy
        </button>

        <button
          type="button"
          className="rounded-full px-2.5 py-1 text-red-300 hover:bg-red-600 hover:text-white active:scale-95"
          onPointerDown={removeElement}
        >
          Delete
        </button>
      </div>
    </>
  );
}
