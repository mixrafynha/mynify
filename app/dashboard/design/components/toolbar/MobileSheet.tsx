"use client";

import { useMemo, useState } from "react";
import {
  Crown,
  Image,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Search,
  Wand2,
} from "lucide-react";

import SheetHeader from "./SheetHeader";

import {
  TEMPLATES,
  STICKERS,
  ICONS,
  FONTS,
  COLORS,
  AI_STYLES,
  QUICK_PROMPTS,
} from "./data";

export default function MobileSheet({
  open,
  panel,
  setOpen,
  selected,
  onUploadClick,
  createElement,
  updateSelected,
  deleteSelected,
}: any) {
  const [query, setQuery] = useState("");
  const [textValue, setTextValue] = useState("Dream big");
  const [textFont, setTextFont] = useState(FONTS?.[0] || "Arial");
  const [textColor, setTextColor] = useState(COLORS?.[0] || "#111827");
  const [textSize, setTextSize] = useState(42);
  const [textShape, setTextShape] = useState<"straight" | "wave" | "arc">(
    "straight"
  );

  const filteredTemplates = useMemo(
    () =>
      TEMPLATES.filter((t) =>
        t.text.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const filteredFonts = useMemo(
    () => FONTS.filter((font) => font.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  if (!open) return null;

  const addCustomText = () => {
    const text = textValue.trim().slice(0, 48);
    if (!text) return;

    createElement?.({
      type: "text",
      text,
      meta: {
        fontFamily: textFont,
        color: textColor,
        fontSize: textSize,
        textShape,
      },
    });
  };

  const updateMeta = (patch: any) => {
    if (!selected) return;
    updateSelected?.({ meta: patch });
  };

  return (
    <div className="md:hidden fixed inset-x-3 bottom-[82px] z-50 max-h-[48dvh] overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-950 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="max-h-[48dvh] overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
        <SheetHeader
          title={getTitle(panel)}
          subtitle={getSubtitle(panel)}
          onClose={() => setOpen(false)}
        />

        {panel === "templates" && (
          <div className="space-y-4">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Pesquisar templates..."
            />

            <div className="flex gap-3 overflow-x-auto pb-2">
              {filteredTemplates.map((t, i) => (
                <button
                  key={`${t.text}-${i}`}
                  onClick={() =>
                    createElement?.({
                      type: "text",
                      text: t.text,
                      meta: {
                        fontFamily: t.fontFamily,
                        color: t.color,
                        fontSize: t.fontSize,
                        textShape: "straight",
                      },
                    })
                  }
                  className={`relative flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-3xl border border-black/10 px-3 text-center shadow-sm transition active:scale-95 ${t.bg}`}
                >
                  {t.premium && (
                    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-black shadow-sm">
                      <Crown size={14} />
                    </span>
                  )}

                  <span
                    className="font-black leading-tight"
                    style={{
                      fontFamily: t.fontFamily,
                      color: t.color,
                      fontSize: 16,
                    }}
                  >
                    {t.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {panel === "text" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value.slice(0, 48))}
                maxLength={48}
                rows={2}
                placeholder="Escreve o texto..."
                className="w-full resize-none bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />

              <div className="mt-3 flex min-h-[72px] items-center justify-center rounded-2xl bg-white px-3 text-center shadow-sm">
                <span
                  className="font-black leading-tight"
                  style={{
                    fontFamily: textFont,
                    color: textColor,
                    fontSize: Math.min(textSize, 44),
                    transform:
                      textShape === "wave"
                        ? "skewY(-5deg) rotate(-2deg)"
                        : textShape === "arc"
                        ? "rotate(-5deg)"
                        : "none",
                  }}
                >
                  {textValue || "Texto"}
                </span>
              </div>
            </div>

            <button
              onClick={addCustomText}
              disabled={!textValue.trim()}
              className="h-12 w-full rounded-2xl bg-violet-600 font-black text-white shadow-lg shadow-violet-600/20 transition active:scale-[0.98] disabled:opacity-40"
            >
              + Adicionar texto
            </button>

            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Pesquisar fontes..."
            />

            <div className="grid grid-cols-2 gap-3">
              {filteredFonts.map((font) => {
                const active = textFont === font;

                return (
                  <button
                    key={font}
                    type="button"
                    style={{ fontFamily: font }}
                    onClick={() => setTextFont(font)}
                    className={`min-h-12 rounded-2xl border px-3 text-sm font-black shadow-sm transition active:scale-95 ${
                      active
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-slate-200 bg-white text-slate-950 hover:bg-violet-50"
                    }`}
                  >
                    {font}
                  </button>
                );
              })}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">
                  Tamanho
                </span>
                <span className="text-xs font-black text-slate-500">
                  {textSize}px
                </span>
              </div>

              <input
                type="range"
                min={16}
                max={96}
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="mt-3 w-full accent-violet-600"
              />
            </div>

            <div className="grid grid-cols-7 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTextColor(color)}
                  style={{ backgroundColor: color }}
                  className={`h-9 w-9 rounded-full border border-slate-200 shadow-sm ${
                    textColor === color
                      ? "ring-2 ring-violet-500 ring-offset-2"
                      : ""
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <ShapeButton
                label="Reto"
                active={textShape === "straight"}
                onClick={() => setTextShape("straight")}
              />
              <ShapeButton
                label="Ondulado"
                active={textShape === "wave"}
                onClick={() => setTextShape("wave")}
              />
              <ShapeButton
                label="Arco"
                active={textShape === "arc"}
                onClick={() => setTextShape("arc")}
              />
            </div>
          </div>
        )}

        {panel === "upload" && (
          <button
            onClick={onUploadClick}
            className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50 font-black text-violet-700 active:scale-[0.98]"
          >
            <Image size={28} />
            Upload imagem
            <span className="text-xs font-medium opacity-70">
              PNG, JPG ou WEBP
            </span>
          </button>
        )}

        {panel === "stickers" && (
          <div className="grid grid-cols-6 gap-2">
            {STICKERS.map((s, i) => (
              <button
                key={`${s}-${i}`}
                onClick={() =>
                  createElement?.({
                    type: "text",
                    text: s,
                    meta: {
                      fontSize: 42,
                      fontFamily: "Arial",
                      color: "#000",
                      textShape: "straight",
                    },
                  })
                }
                className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {panel === "icons" && (
          <div className="grid grid-cols-7 gap-2">
            {ICONS.map((icon, i) => (
              <button
                key={`${icon}-${i}`}
                onClick={() =>
                  createElement?.({
                    type: "text",
                    text: icon,
                    meta: {
                      fontSize: 36,
                      fontFamily: "Arial",
                      color: "#000",
                      textShape: "straight",
                    },
                  })
                }
                className="flex h-11 items-center justify-center rounded-2xl bg-slate-100 text-xl active:scale-95"
              >
                {icon}
              </button>
            ))}
          </div>
        )}

        {panel === "colors" && (
          <div className="space-y-3">
            {!selected && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                Selecione um item para aplicar uma cor.
              </div>
            )}

            <div className="grid grid-cols-8 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  disabled={!selected}
                  onClick={() => updateMeta({ color })}
                  className="h-9 w-9 rounded-full border border-black/10 shadow-sm disabled:opacity-35"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {panel === "edit" && selected && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500">
                  Tamanho
                </label>
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
                Copiar
              </button>

              <button
                onClick={deleteSelected}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 font-bold text-red-600"
              >
                <Trash2 size={16} />
                Apagar
              </button>
            </div>
          </div>
        )}

        {panel === "ai" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                placeholder="Ex: dragão streetwear..."
                className="h-12 min-w-0 flex-1 rounded-2xl bg-slate-100 px-4 text-sm text-slate-950 outline-none"
              />

              <button className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <Sparkles size={20} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {AI_STYLES.map((style) => (
                <button
                  key={style}
                  className="h-10 shrink-0 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700"
                >
                  {style}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="h-10 shrink-0 rounded-full bg-violet-50 px-4 text-sm font-bold text-violet-700"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-3 rounded-3xl bg-violet-50 p-3 text-violet-700">
              <Wand2 size={20} />
              <div>
                <h4 className="text-sm font-black">IA Premium</h4>
                <p className="text-xs">
                  Gera imagens únicas para os teus produtos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShapeButton({ label, active, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-2xl border text-xs font-black transition active:scale-95 ${
        active
          ? "border-violet-500 bg-violet-600 text-white"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function getTitle(panel: string) {
  const titles: Record<string, string> = {
    templates: "Templates",
    text: "Texto",
    upload: "Uploads",
    edit: "Editar",
    ai: "IA",
    stickers: "Stickers",
    icons: "Ícones",
    colors: "Cores",
  };

  return titles[panel] || "Editor";
}

function getSubtitle(panel: string) {
  const subtitles: Record<string, string> = {
    templates: "Escolhe um template",
    text: "Escreve e personaliza",
    upload: "Adiciona uma imagem",
    edit: "Tamanho e ações",
    ai: "Gera imagens com prompt",
    stickers: "Adiciona stickers",
    icons: "Adiciona símbolos",
    colors: "Escolhe uma cor",
  };

  return subtitles[panel] || "Editor premium";
}

function SearchBox({ value, onChange, placeholder }: any) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3">
      <Search size={16} className="text-slate-400" />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}