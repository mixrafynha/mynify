"use client";

import { FONTS } from "../data";

export default function FontsPanel({
  selected,
  updateSelected,
}: {
  selected?: any;
  updateSelected?: (update: any) => void;
}) {
  const selectedFont = selected?.meta?.fontFamily;
  const selectedShape = selected?.meta?.textShape;

  const updateSelectedTextMeta = (patch: any) => {
    if (!selected) return;

    updateSelected?.({
      meta: patch,
    });
  };

  return (
    <div className="space-y-5 pb-24 md:pb-7">
      {!selected && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          Selecione um texto no canvas para editar fonte e forma.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-black text-slate-950">
            Fontes
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Escolhe uma fonte para o texto selecionado
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {FONTS.map((font) => {
            const active = selectedFont === font;

            return (
              <button
                key={font}
                type="button"
                disabled={!selected}
                style={{
                  fontFamily: font,
                }}
                onClick={() =>
                  updateSelectedTextMeta({
                    fontFamily: font,
                  })
                }
                className={`flex min-h-[58px] w-full items-center rounded-2xl border px-4 text-left text-base font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-violet-500 bg-violet-600 text-white shadow-[0_10px_25px_rgba(124,58,237,0.28)]"
                    : "border-slate-200 bg-white text-slate-950 hover:border-violet-300 hover:bg-violet-50"
                }`}
              >
                <span className="block w-full truncate text-inherit">
                  {font}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-black text-slate-950">
            Forma do texto
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Define o estilo visual do texto
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={!selected}
            onClick={() =>
              updateSelectedTextMeta({
                textShape: "straight",
              })
            }
            className={`h-12 rounded-2xl border px-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
              selectedShape === "straight"
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
            }`}
          >
            Reto
          </button>

          <button
            type="button"
            disabled={!selected}
            onClick={() =>
              updateSelectedTextMeta({
                textShape: "wave",
              })
            }
            className={`h-12 rounded-2xl border px-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
              selectedShape === "wave"
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
            }`}
          >
            Ondulado
          </button>

          <button
            type="button"
            disabled={!selected}
            onClick={() =>
              updateSelectedTextMeta({
                textShape: "arc",
              })
            }
            className={`h-12 rounded-2xl border px-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
              selectedShape === "arc"
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
            }`}
          >
            Arco
          </button>
        </div>
      </div>
    </div>
  );
}