"use client";

import { X } from "lucide-react";

export default function SheetHeader({
  title,
  subtitle,
  onClose,
}: any) {
  return (
    <>
      <div className="w-12 h-1.5 rounded-full bg-gray-300 mx-auto mb-4" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
}