"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ChevronDown,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CaseSensitive,
  Sparkles,
  Search,
} from "lucide-react";

import { FONT_OPTIONS, COLORS, getEditorFontFamily, loadEditorFont, loadVisibleEditorFonts } from "../data";

type EditTextPanelProps = {
  selected?: any;
  updateSelectedTextMeta: (patch: any) => void;
};

export default function EditTextPanel({
  selected,
  updateSelectedTextMeta,
}: EditTextPanelProps) {
  const [openFonts, setOpenFonts] = useState(false);
  const [search, setSearch] = useState("");
  const [fontRenderKey, setFontRenderKey] = useState(0);

  const meta = selected?.meta ?? {};

  const fontSize = meta.fontSize ?? 40;
  const rotation = meta.rotation ?? 0;
  const letterSpacing = meta.letterSpacing ?? 0;
  const fontFamily = meta.fontFamily ?? "Inter";
  const color = meta.color ?? "#ffffff";
  const opacity = meta.opacity ?? 1;

  const filteredFonts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return FONT_OPTIONS.slice(0, 80);

    return FONT_OPTIONS.filter((font) =>
      font.toLowerCase().includes(q)
    ).slice(0, 80);
  }, [search]);

  useEffect(() => {
    loadEditorFont(fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    if (!openFonts) return;
    let cancelled = false;
    loadVisibleEditorFonts(filteredFonts, filteredFonts.length).finally(() => {
      if (!cancelled) setFontRenderKey((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [filteredFonts, openFonts]);

  const patch = (data: any) => {
    if (!selected) return;

    updateSelectedTextMeta({
      ...(selected.meta ?? {}),
      ...data,
    });
  };

  return (
    <div className="space-y-4 pb-28 text-white md:pb-6">
      {!selected && (
        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-400">
          Select text to edit
        </div>
      )}

      <Card title="Preview">
        <div className="flex min-h-[96px] items-center justify-center rounded-[24px] border border-white/10 bg-[#0d1322] p-4">
          <span
            className="break-words text-center font-black"
            style={{
              fontFamily: getEditorFontFamily(fontFamily),
              fontSize: Math.min(fontSize, 44),
              color,
              opacity,
              letterSpacing,
              fontWeight: meta.fontWeight ?? 800,
              fontStyle: meta.fontStyle ?? "normal",
              textTransform: meta.textTransform ?? "none",
              textAlign: meta.textAlign ?? "center",
            }}
          >
            {selected?.text ?? "RYFIO Studio 123"}
          </span>
        </div>
      </Card>

      <Card title="Font">
        <button
          type="button"
          onClick={() => setOpenFonts((v) => !v)}
          className="flex h-14 w-full items-center justify-between rounded-[22px] border border-white/10 bg-[#0d1322] px-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Type size={17} />

            <span
              className="truncate font-bold"
              style={{
                fontFamily: getEditorFontFamily(fontFamily),
              }}
            >
              {fontFamily}
            </span>
          </div>

          <ChevronDown
            size={18}
            className={`transition ${openFonts ? "rotate-180" : ""}`}
          />
        </button>

        {openFonts && (
          <div className="mt-3 rounded-[22px] border border-white/10 bg-[#0d1322] p-3">
            <div className="mb-3 flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3">
              <Search size={16} className="text-slate-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search font..."
                className="h-full flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="max-h-[38dvh] space-y-2 overflow-y-auto pr-1 md:max-h-[260px]">
              {filteredFonts.map((font) => {
                const active = fontFamily === font;

                return (
                  <button
                    key={font}
                    type="button"
                    onClick={() => { loadEditorFont(font); patch({ fontFamily: font }); }}
                    className={`flex min-h-[56px] w-full items-center justify-between rounded-[18px] px-4 text-left transition active:scale-[0.98] ${
                      active
                        ? "bg-cyan-500 text-[#06111d]"
                        : "bg-white/[0.05] text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="min-w-0">
                      <FontPreviewText
                        key={`${font}-${fontRenderKey}`}
                        family={font}
                        text={selected?.text ?? "RYFIO Studio 123"}
                        className="truncate text-lg font-black"
                      />

                      <div className="truncate text-[11px] font-bold opacity-70">
                        {font}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Card title="Quick Style">
        <div className="grid grid-cols-4 gap-2">
          <SmallButton
            active={(meta.fontWeight ?? 800) >= 800}
            onClick={() =>
              patch({
                fontWeight: (meta.fontWeight ?? 800) >= 800 ? 500 : 900,
              })
            }
          >
            <Bold size={16} />
          </SmallButton>

          <SmallButton
            active={meta.fontStyle === "italic"}
            onClick={() =>
              patch({
                fontStyle:
                  meta.fontStyle === "italic" ? "normal" : "italic",
              })
            }
          >
            <Italic size={16} />
          </SmallButton>

          <SmallButton
            active={meta.textTransform === "uppercase"}
            onClick={() =>
              patch({
                textTransform:
                  meta.textTransform === "uppercase" ? "none" : "uppercase",
              })
            }
          >
            <CaseSensitive size={16} />
          </SmallButton>

          <SmallButton
            active={!!meta.shadow}
            onClick={() => patch({ shadow: !meta.shadow })}
          >
            <Sparkles size={16} />
          </SmallButton>
        </div>
      </Card>

      <SliderCard title="Size" value={`${fontSize}px`}>
        <input
          type="range"
          min={12}
          max={160}
          value={fontSize}
          onChange={(e) =>
            patch({
              fontSize: Number(e.target.value),
            })
          }
          className="w-full accent-cyan-400"
        />
      </SliderCard>

      <SliderCard title="Spacing" value={`${letterSpacing}px`}>
        <input
          type="range"
          min={-3}
          max={20}
          value={letterSpacing}
          onChange={(e) =>
            patch({
              letterSpacing: Number(e.target.value),
            })
          }
          className="w-full accent-cyan-400"
        />
      </SliderCard>

      <SliderCard title="Opacity" value={`${Math.round(opacity * 100)}%`}>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(e) =>
            patch({
              opacity: Number(e.target.value),
            })
          }
          className="w-full accent-cyan-400"
        />
      </SliderCard>

      <SliderCard title="Rotate" value={`${rotation}°`}>
        <input
          type="range"
          min={-180}
          max={180}
          value={rotation}
          onChange={(e) =>
            patch({
              rotation: Number(e.target.value),
            })
          }
          className="w-full accent-cyan-400"
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <ActionButton
            icon={<RotateCcw size={16} />}
            label="-15°"
            onClick={() => patch({ rotation: Math.max(-180, rotation - 15) })}
          />

          <ActionButton label="Reset" onClick={() => patch({ rotation: 0 })} />

          <ActionButton
            label="+15°"
            onClick={() => patch({ rotation: Math.min(180, rotation + 15) })}
          />
        </div>
      </SliderCard>

      <Card title="Align">
        <div className="grid grid-cols-3 gap-2">
          <SmallButton
            active={meta.textAlign === "left"}
            onClick={() => patch({ textAlign: "left" })}
          >
            <AlignLeft size={16} />
          </SmallButton>

          <SmallButton
            active={!meta.textAlign || meta.textAlign === "center"}
            onClick={() => patch({ textAlign: "center" })}
          >
            <AlignCenter size={16} />
          </SmallButton>

          <SmallButton
            active={meta.textAlign === "right"}
            onClick={() => patch({ textAlign: "right" })}
          >
            <AlignRight size={16} />
          </SmallButton>
        </div>
      </Card>

      <Card title="Flip">
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            icon={<FlipHorizontal size={16} />}
            label="Horizontal"
            active={!!meta.flipX}
            onClick={() => patch({ flipX: !meta.flipX })}
          />

          <ActionButton
            icon={<FlipVertical size={16} />}
            label="Vertical"
            active={!!meta.flipY}
            onClick={() => patch({ flipY: !meta.flipY })}
          />
        </div>
      </Card>

      <Card title="Color">
        <div className="grid grid-cols-7 gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => patch({ color: c })}
              style={{ backgroundColor: c }}
              className={`h-9 w-9 rounded-full border border-white/20 transition active:scale-95 ${
                color === c ? "ring-4 ring-cyan-400/40" : ""
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#08111f] p-4">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {title}
      </h3>

      {children}
    </div>
  );
}

function SliderCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Card title={title}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{title}</span>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
          {value}
        </span>
      </div>

      {children}
    </Card>
  );
}

function SmallButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center rounded-[18px] border transition active:scale-[0.97] ${
        active
          ? "border-cyan-400 bg-cyan-500 text-[#06111d]"
          : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.09]"
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-[18px] border px-2 text-xs font-bold transition active:scale-[0.97] ${
        active
          ? "border-cyan-400 bg-cyan-500 text-[#06111d]"
          : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.09]"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
function FontPreviewText({ family, text, className }: { family: string; text: string; className: string }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadEditorFont(family).finally(() => {
      if (!cancelled) setVersion((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [family]);

  return (
    <div
      key={`${family}-${version}`}
      className={className}
      style={{ fontFamily: getEditorFontFamily(family), fontWeight: 800 }}
    >
      {text}
    </div>
  );
}
