"use client";

import { RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react";
import { FONTS, COLORS } from "../data";

type EditTextPanelProps = {
  selected?: any;
  updateSelectedTextMeta: (patch: any) => void;
};

export default function EditTextPanel({
  selected,
  updateSelectedTextMeta,
}: EditTextPanelProps) {
  const fontSize = selected?.meta?.fontSize || 40;
  const rotation = selected?.meta?.rotation || 0;
  const letterSpacing = selected?.meta?.letterSpacing || 0;
  const textShape = selected?.meta?.textShape || "straight";
  const fontFamily = selected?.meta?.fontFamily;
  const color = selected?.meta?.color;

  return (
    <div className="space-y-5 pb-24 md:pb-7">
      {!selected && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 md:border-white/10 md:bg-white/[0.05] md:text-slate-400">
          Selecione um texto para editar.
        </div>
      )}

      <PanelCard title="Fonte">
        <div className="grid grid-cols-1 gap-3">
          {FONTS.map((font) => {
            const active = fontFamily === font;

            return (
              <button
                key={font}
                type="button"
                disabled={!selected}
                style={{ fontFamily: font }}
                onClick={() => updateSelectedTextMeta({ fontFamily: font })}
                className={`flex min-h-[54px] w-full items-center rounded-2xl border px-4 text-left text-base font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 ${
                  active
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-slate-200 bg-white text-slate-950 hover:border-violet-300 hover:bg-violet-50 md:border-white/10 md:bg-white/[0.06] md:text-white md:hover:bg-violet-500/15"
                }`}
              >
                <span className="truncate text-inherit">{font}</span>
              </button>
            );
          })}
        </div>
      </PanelCard>

      <PanelCard title="Tamanho">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 md:text-slate-400">
            Texto
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 md:bg-white/10 md:text-white">
            {fontSize}px
          </span>
        </div>

        <input
          type="range"
          min={12}
          max={120}
          value={fontSize}
          disabled={!selected}
          onChange={(e) =>
            updateSelectedTextMeta({
              fontSize: Number(e.target.value),
            })
          }
          className="mt-4 w-full accent-violet-600 disabled:opacity-35"
        />
      </PanelCard>

      <PanelCard title="Cor">
        <div className="grid grid-cols-7 gap-3 md:grid-cols-6">
          {COLORS.map((c) => {
            const active =
              String(color).toLowerCase() === String(c).toLowerCase();

            return (
              <button
                key={c}
                type="button"
                disabled={!selected}
                onClick={() => updateSelectedTextMeta({ color: c })}
                style={{ backgroundColor: c }}
                className={`h-9 w-9 rounded-full border shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
                  active
                    ? "border-violet-500 ring-4 ring-violet-500/25"
                    : "border-slate-200 hover:scale-110 hover:ring-4 hover:ring-violet-500/15 md:border-white/20"
                }`}
              />
            );
          })}
        </div>
      </PanelCard>

      <PanelCard title="Forma">
        <div className="grid grid-cols-3 gap-2.5">
          <OptionButton
            label="Reto"
            active={textShape === "straight"}
            disabled={!selected}
            onClick={() => updateSelectedTextMeta({ textShape: "straight" })}
          />
          <OptionButton
            label="Onda"
            active={textShape === "wave"}
            disabled={!selected}
            onClick={() => updateSelectedTextMeta({ textShape: "wave" })}
          />
          <OptionButton
            label="Arco"
            active={textShape === "arc"}
            disabled={!selected}
            onClick={() => updateSelectedTextMeta({ textShape: "arc" })}
          />
        </div>
      </PanelCard>

      <PanelCard title="Rodar">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 md:text-slate-400">
            Rotação
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 md:bg-white/10 md:text-white">
            {rotation}°
          </span>
        </div>

        <input
          type="range"
          min={-180}
          max={180}
          value={rotation}
          disabled={!selected}
          onChange={(e) =>
            updateSelectedTextMeta({
              rotation: Number(e.target.value),
            })
          }
          className="mt-4 w-full accent-violet-600 disabled:opacity-35"
        />

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <IconButton
            label="-15°"
            icon={<RotateCcw size={16} />}
            disabled={!selected}
            onClick={() =>
              updateSelectedTextMeta({
                rotation: Math.max(-180, rotation - 15),
              })
            }
          />
          <IconButton
            label="Reset"
            disabled={!selected}
            onClick={() => updateSelectedTextMeta({ rotation: 0 })}
          />
          <IconButton
            label="+15°"
            disabled={!selected}
            onClick={() =>
              updateSelectedTextMeta({
                rotation: Math.min(180, rotation + 15),
              })
            }
          />
        </div>
      </PanelCard>

      <PanelCard title="Inverter">
        <div className="grid grid-cols-2 gap-2.5">
          <IconButton
            label="Horizontal"
            icon={<FlipHorizontal size={16} />}
            disabled={!selected}
            active={!!selected?.meta?.flipX}
            onClick={() =>
              updateSelectedTextMeta({
                flipX: !selected?.meta?.flipX,
              })
            }
          />

          <IconButton
            label="Vertical"
            icon={<FlipVertical size={16} />}
            disabled={!selected}
            active={!!selected?.meta?.flipY}
            onClick={() =>
              updateSelectedTextMeta({
                flipY: !selected?.meta?.flipY,
              })
            }
          />
        </div>
      </PanelCard>

      <PanelCard title="Espaçamento">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 md:text-slate-400">
            Letras
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 md:bg-white/10 md:text-white">
            {letterSpacing}px
          </span>
        </div>

        <input
          type="range"
          min={-3}
          max={12}
          value={letterSpacing}
          disabled={!selected}
          onChange={(e) =>
            updateSelectedTextMeta({
              letterSpacing: Number(e.target.value),
            })
          }
          className="mt-4 w-full accent-violet-600 disabled:opacity-35"
        />
      </PanelCard>
    </div>
  );
}

function PanelCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:border-white/10 md:bg-white/[0.05]">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 md:text-slate-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function OptionButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-12 rounded-2xl border px-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "border-violet-500 bg-violet-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 md:border-white/10 md:bg-white/[0.06] md:text-slate-300 md:hover:bg-violet-500/15"
      }`}
    >
      {label}
    </button>
  );
}

function IconButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "border-violet-500 bg-violet-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 md:border-white/10 md:bg-white/[0.06] md:text-slate-300 md:hover:bg-violet-500/15"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}