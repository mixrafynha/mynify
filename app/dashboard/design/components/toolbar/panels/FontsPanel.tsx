"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { FONTS } from "../data";

const TEXT_SHAPES = [
  { id: "straight", label: "Reto", preview: "TEXT" },
  { id: "wave", label: "Wave", preview: "~TEXT~" },
  { id: "arc", label: "Arc", preview: "⌒ TEXT ⌒" },
];

export default function FontsPanel({
  selected,
  updateSelected,
}: {
  selected?: any;
  updateSelected?: (update: any) => void;
}) {
  const [query, setQuery] = useState("");

  const selectedFont = selected?.meta?.fontFamily || "Inter";
  const selectedShape = selected?.meta?.textShape || "straight";
  const previewText = selected?.text || "Dream Big";

  const filteredFonts = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return FONTS;

    return FONTS.filter((font) =>
      font.toLowerCase().includes(q)
    );
  }, [query]);

  const updateSelectedTextMeta = (patch: any) => {
    if (!selected) return;

    updateSelected?.({
      meta: patch,
    });
  };

  return (
    <div className="space-y-4 pb-24 md:pb-7">
      {!selected && (
        <div
          className="
            rounded-3xl border border-amber-200
            bg-amber-50 px-4 py-3
            text-xs font-bold text-amber-800
          "
        >
          Selecione um texto no canvas para editar.
        </div>
      )}

      <Section
        title="Pré-visualização"
        subtitle="Visualização da fonte selecionada"
      >
        <div
          className="
            flex min-h-[120px] items-center justify-center
            overflow-hidden rounded-3xl
            border border-slate-800
            bg-[#050816]
            px-5 py-6
          "
        >
          <div
            className="
              max-w-full truncate text-center
              text-[30px] font-black leading-none
              sm:text-[38px]
            "
            style={{
              fontFamily: selectedFont,
              color: selected?.meta?.color || "#ffffff",
            }}
          >
            {previewText}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-900">
              {selectedFont}
            </div>

            <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
              Live Preview
            </div>
          </div>

          <div
            className="h-7 w-7 rounded-full border border-slate-200"
            style={{
              background: selected?.meta?.color || "#ffffff",
            }}
          />
        </div>
      </Section>

      <Section
        title="Forma do texto"
        subtitle="Define o estilo visual"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {TEXT_SHAPES.map((shape) => (
            <OptionButton
              key={shape.id}
              active={selectedShape === shape.id}
              disabled={!selected}
              onClick={() =>
                updateSelectedTextMeta({
                  textShape: shape.id,
                })
              }
            >
              <span className="text-[11px] font-black">
                {shape.preview}
              </span>

              <span className="text-[10px] font-bold opacity-75">
                {shape.label}
              </span>
            </OptionButton>
          ))}
        </div>
      </Section>

      <Section
        title="Fontes"
        subtitle={`${filteredFonts.length} fontes`}
      >
        <div className="sticky top-0 z-10 mb-3 bg-white pb-3">
          <div
            className="
              flex h-11 items-center gap-2
              rounded-2xl border border-slate-200
              bg-slate-50 px-3
            "
          >
            <Search size={16} className="text-slate-400" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar fonte..."
              className="
                h-full flex-1 bg-transparent
                text-sm font-semibold text-slate-900
                outline-none placeholder:text-slate-400
              "
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {filteredFonts.map((font) => {
            const active = selectedFont === font;

            return (
              <button
                key={font}
                type="button"
                disabled={!selected}
                onClick={() =>
                  updateSelectedTextMeta({
                    fontFamily: font,
                  })
                }
                className={`
                  group flex min-h-[72px] w-full
                  items-center justify-between gap-3
                  rounded-2xl border px-4
                  text-left transition
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  ${
                    active
                      ? "border-violet-500 bg-violet-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]"
                      : "border-slate-200 bg-white text-slate-950 hover:border-violet-300 hover:bg-violet-50"
                  }
                `}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="
                      truncate text-[22px]
                      font-black leading-none
                      sm:text-[24px]
                    "
                    style={{
                      fontFamily: font,
                    }}
                  >
                    {previewText}
                  </div>

                  <div
                    className={`mt-1 truncate text-[11px] font-bold ${
                      active
                        ? "text-violet-100"
                        : "text-slate-400"
                    }`}
                  >
                    {font}
                  </div>
                </div>

                {active && (
                  <div
                    className="
                      flex h-7 w-7 shrink-0
                      items-center justify-center
                      rounded-full bg-white
                      text-violet-600
                    "
                  >
                    <Check
                      size={16}
                      strokeWidth={3}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-3xl border border-slate-200
        bg-white p-4 shadow-sm
      "
    >
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-950">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 text-xs font-medium text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function OptionButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        flex h-16 flex-col items-center
        justify-center rounded-2xl border
        px-2 transition active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-35
        ${
          active
            ? "border-violet-500 bg-violet-600 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
        }
      `}
    >
      {children}
    </button>
  );
}