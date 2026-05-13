"use client";

import { useMemo, useState } from "react";
import {
  Image,
  Type,
  Wand2,
  ZoomIn,
  ZoomOut,
  Star,
  Palette,
  Trash2,
  LayoutTemplate,
  Folder,
  Grid2X2Plus,
  Layers,
  ChevronLeft,
} from "lucide-react";

import TemplatesPanel from "./panels/TemplatesPanel";
import TextPanel from "./panels/TextPanel";
import StickersPanel from "./panels/StickersPanel";
import IconsPanel from "./panels/IconsPanel";
import FontsPanel from "./panels/FontsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import EditTextPanel from "./panels/EditTextPanel";

type Panel =
  | "templates"
  | "stickers"
  | "icons"
  | "text"
  | "fonts"
  | "colors"
  | "edit"
  | null;

type DesktopToolbarProps = {
  selected?: any;
  onUploadClick?: () => void;
  onAddText?: () => void;
  createElement?: (element: any) => void;
  updateSelected?: (update: any) => void;
  deleteSelected?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
};

const PANEL_WIDTH = 390;

const PANEL_TITLES: Record<
  Exclude<Panel, null>,
  { title: string; subtitle: string }
> = {
  templates: {
    title: "Modelos",
    subtitle: "Comece com layouts prontos",
  },
  stickers: {
    title: "IA & Stickers",
    subtitle: "Adicione detalhes rápidos",
  },
  icons: {
    title: "Elementos",
    subtitle: "Ícones e formas para o design",
  },
  text: {
    title: "Texto",
    subtitle: "Escreva, escolha fonte, cor, tamanho e estilo",
  },
  fonts: {
    title: "Fontes",
    subtitle: "Escolha a fonte do item selecionado",
  },
  colors: {
    title: "Marca",
    subtitle: "Cores rápidas para o item selecionado",
  },
  edit: {
    title: "Editar texto",
    subtitle: "Tamanho, rotação, inversão, onda e espaçamento",
  },
};

export default function DesktopToolbar({
  selected,
  onUploadClick,
  onAddText,
  createElement,
  updateSelected,
  deleteSelected,
  zoomIn,
  zoomOut,
}: DesktopToolbarProps) {
  const [activePanel, setActivePanel] = useState<Panel>("templates");

  const panelInfo = useMemo(() => {
    if (!activePanel) return null;
    return PANEL_TITLES[activePanel];
  }, [activePanel]);

  const openPanel = (panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const updateSelectedTextMeta = (patch: any) => {
    if (!selected) return;

    updateSelected?.({
      meta: patch,
    });
  };

  return (
    <aside className="hidden h-full shrink-0 overflow-visible bg-[#070711] text-white md:flex">
      <nav className="flex h-full w-[92px] shrink-0 flex-col items-center border-r border-white/10 bg-[#0b0b16] px-2.5 py-3 shadow-[8px_0_30px_rgba(0,0,0,0.24)]">
        <div className="mb-3 h-1.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />

        <div className="flex w-full flex-col items-center gap-2">
          <SideItem
            icon={<LayoutTemplate size={24} />}
            label="Modelos"
            active={activePanel === "templates"}
            onClick={() => openPanel("templates")}
          />

          <SideItem
            icon={<Star size={24} />}
            label="Elementos"
            active={activePanel === "icons"}
            onClick={() => openPanel("icons")}
          />

          <SideItem
            icon={<Type size={24} />}
            label="Texto"
            active={activePanel === "text"}
            onClick={() => openPanel("text")}
          />

          <SideItem
            icon={<Palette size={24} />}
            label="Marca"
            active={activePanel === "colors"}
            onClick={() => openPanel("colors")}
            premium
          />

          <SideItem
            icon={<Image size={24} />}
            label="Importar"
            onClick={onUploadClick}
          />

          <SideItem
            icon={<Wand2 size={24} />}
            label="IA"
            active={activePanel === "stickers"}
            onClick={() => openPanel("stickers")}
          />

          <SideItem icon={<Folder size={24} />} label="Projetos" />
          <SideItem icon={<Grid2X2Plus size={24} />} label="Apps" />
        </div>

        <div className="my-3 h-px w-12 bg-white/10" />

        <SideItem
          icon={<Layers size={24} />}
          label="Editar"
          active={activePanel === "edit"}
          disabled={!selected}
          onClick={() => openPanel("edit")}
        />

        <SideItem
          icon={<Type size={24} />}
          label="Fontes"
          active={activePanel === "fonts"}
          disabled={!selected}
          onClick={() => openPanel("fonts")}
        />

        <div className="mt-auto flex w-full flex-col items-center gap-2 border-t border-white/10 pt-3">
          <SideItem icon={<ZoomIn size={23} />} label="Zoom +" onClick={zoomIn} compact />
          <SideItem icon={<ZoomOut size={23} />} label="Zoom -" onClick={zoomOut} compact />

          {selected && (
            <SideItem
              icon={<Trash2 size={23} />}
              label="Apagar"
              danger
              onClick={deleteSelected}
              compact
            />
          )}
        </div>
      </nav>

      <section
        className="relative h-full shrink-0 overflow-visible border-r border-white/10 bg-[#0f1020] shadow-[18px_0_45px_rgba(0,0,0,0.28)] transition-[width,opacity] duration-300 ease-out"
        style={{
          width: activePanel ? PANEL_WIDTH : 0,
          opacity: activePanel ? 1 : 0,
        }}
      >
        {activePanel && panelInfo && (
          <div className="flex h-full flex-col overflow-hidden" style={{ width: PANEL_WIDTH }}>
            <div className="relative shrink-0 border-b border-white/10 bg-[#0f1020]/95 px-6 pb-5 pt-5 backdrop-blur">
              <button
                onClick={() => setActivePanel(null)}
                type="button"
                aria-label="Fechar painel"
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] backdrop-blur transition hover:scale-105 hover:bg-white/15 active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="pr-14">
                <h2 className="text-2xl font-black leading-none tracking-[-0.04em] text-white">
                  {panelInfo.title}
                </h2>
                <p className="mt-2 text-sm font-medium leading-none text-slate-400">
                  {panelInfo.subtitle}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(168,85,247,.75)_transparent]">
              {activePanel === "templates" && (
                <TemplatesPanel createElement={createElement} />
              )}

              {activePanel === "text" && (
                <TextPanel createElement={createElement} onAddText={onAddText} />
              )}

              {activePanel === "stickers" && (
                <StickersPanel createElement={createElement} />
              )}

              {activePanel === "icons" && (
                <IconsPanel createElement={createElement} />
              )}

              {activePanel === "fonts" && (
                <FontsPanel selected={selected} updateSelected={updateSelected} />
              )}

              {activePanel === "colors" && (
                <ColorsPanel selected={selected} updateSelected={updateSelected} />
              )}

              {activePanel === "edit" && (
                <EditTextPanel
                  selected={selected}
                  updateSelectedTextMeta={updateSelectedTextMeta}
                />
              )}
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}

function SideItem({
  icon,
  label,
  onClick,
  active,
  premium,
  danger,
  compact,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  premium?: boolean;
  danger?: boolean;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className={`group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 ${
        compact ? "h-[60px]" : "h-[66px]"
      } ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : active
          ? "bg-white text-slate-950 shadow-[0_12px_28px_rgba(0,0,0,0.25)]"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
      )}

      {premium && (
        <span className="absolute right-1.5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] text-[#070711] shadow-sm">
          ♛
        </span>
      )}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
          active ? "text-violet-600" : danger ? "text-red-400" : "group-hover:text-violet-300"
        }`}
      >
        {icon}
      </div>

      <span className="max-w-[76px] truncate leading-none">{label}</span>
    </button>
  );
}