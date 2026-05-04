"use client";

export default function Shapes({ onAdd }: any) {
  return (
    <div className="p-2 flex gap-3 bg-white border-b">

      <button
        onClick={() =>
          onAdd({
            type: "shape",
            shape: "circle",
            width: 80,
            height: 80,
            meta: { color: "#000" },
          })
        }
      >
        ⚪ Circle
      </button>

      <button
        onClick={() =>
          onAdd({
            type: "shape",
            shape: "square",
            width: 80,
            height: 80,
            meta: { color: "#000" },
          })
        }
      >
        ⬛ Square
      </button>
    </div>
  );
}