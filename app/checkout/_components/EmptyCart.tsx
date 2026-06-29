"use client";

import { Package } from "lucide-react";

export default function EmptyCart({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-[24px] bg-white/[0.06] text-purple-300">
        <Package size={27} />
      </div>
      <p className="text-lg font-black tracking-[-0.04em]">Empty cart</p>
      <button type="button" onClick={onAdd} className="mt-4 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black transition active:scale-[0.98]">
        Add products
      </button>
    </div>
  );
}
