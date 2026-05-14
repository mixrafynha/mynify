"use client";

import { Copy, Layers, Trash2 } from "lucide-react";

type EditPanelProps = {
  selected: any;
  createElement?: (element: any) => void;
  updateSelected?: (patch: any) => void;
  deleteSelected?: () => void;
};

export default function EditPanel({
  selected,
  createElement,
  updateSelected,
  deleteSelected,
}: EditPanelProps) {
  if (!selected) return null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500">Size</label>
          <span className="text-xs font-black text-slate-500">
            {selected.meta?.fontSize || 24}px
          </span>
        </div>

        <input
          type="range"
          min={12}
          max={100}
          value={selected.meta?.fontSize || 24}
          onChange={(e) =>
            updateSelected?.({
              meta: {
                fontSize: Number(e.target.value),
              },
            })
          }
          className="mt-2 w-full accent-violet-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 font-bold">
          <Layers size={16} />
          Layer
        </button>

        <button
          type="button"
          onClick={() =>
            createElement?.({
              ...selected,
              id: undefined,
              x: selected.x + 20,
              y: selected.y + 20,
            })
          }
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 font-bold"
        >
          <Copy size={16} />
          Copy
        </button>

        <button
          type="button"
          onClick={deleteSelected}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 font-bold text-red-600"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}