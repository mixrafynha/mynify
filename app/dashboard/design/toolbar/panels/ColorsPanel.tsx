"use client";

import { COLORS } from "../data";

export default function ColorsPanel({
  selected,
  updateSelected,
}: {
  selected?: any;
  updateSelected?: (update: any) => void;
}) {
  const selectedColor = selected?.meta?.color;

  const updateSelectedTextMeta = (patch: any) => {
    if (!selected) return;

    updateSelected?.({
      meta: patch,
    });
  };

  return (
    <div className="space-y-5 pb-24 md:pb-7">
      {!selected && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold leading-relaxed text-slate-500 md:border-white/10 md:bg-white/[0.05] md:text-slate-400">
          Selecione um item no canvas para aplicar uma cor.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:border-white/10 md:bg-white/[0.05]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 md:text-white">
              Cores
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500 md:text-slate-400">
              Escolhe uma cor para o item selecionado
            </p>
          </div>

          {selectedColor && (
            <div
              className="h-9 w-9 shrink-0 rounded-full border border-slate-200 shadow-sm md:border-white/20"
              style={{ backgroundColor: selectedColor }}
              title={selectedColor}
            />
          )}
        </div>

        <div className="grid grid-cols-6 gap-3 sm:grid-cols-7 md:grid-cols-6">
          {COLORS.map((color) => {
            const isActive =
              String(selectedColor).toLowerCase() ===
              String(color).toLowerCase();

            return (
              <button
                key={color}
                type="button"
                disabled={!selected}
                onClick={() =>
                  updateSelectedTextMeta({
                    color,
                  })
                }
                title={color}
                aria-label={`Aplicar cor ${color}`}
                style={{ backgroundColor: color }}
                className={`relative h-11 w-11 rounded-full border shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:h-10 md:w-10 ${
                  isActive
                    ? "border-violet-500 ring-4 ring-violet-500/25"
                    : "border-slate-200 hover:scale-110 hover:ring-4 hover:ring-violet-500/15 md:border-white/20"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 m-auto h-3 w-3 rounded-full border-2 border-white bg-black/25 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}