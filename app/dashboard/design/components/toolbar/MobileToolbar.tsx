"use client";

import {
  Image,
  Type,
  Wand2,
  Star,
  Palette,
  LayoutTemplate,
  SlidersHorizontal,
} from "lucide-react";

import ToolButton from "./ToolButton";

export default function MobileToolbar({
  open,
  panel,
  setOpen,
  setPanel,
  selected,
}: any) {
  const openPanel = (nextPanel: string) => {
    setOpen(true);
    setPanel(nextPanel);
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#1b1e31]/95 backdrop-blur-xl text-white shadow-[0_-18px_50px_rgba(0,0,0,0.30)]">
      <div className="px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <div className="grid grid-cols-7 gap-1.5">
          <ToolButton
            active={open && panel === "templates"}
            icon={<LayoutTemplate size={21} />}
            label="Mods"
            onClick={() => openPanel("templates")}
          />

          <ToolButton
            active={open && panel === "icons"}
            icon={<Star size={21} />}
            label="Elems"
            onClick={() => openPanel("icons")}
          />

          <ToolButton
            active={open && panel === "text"}
            icon={<Type size={21} />}
            label="Texto"
            onClick={() => openPanel("text")}
          />

          <ToolButton
            active={open && panel === "edit"}
            icon={<SlidersHorizontal size={21} />}
            label="Editar"
            disabled={!selected}
            onClick={() => openPanel("edit")}
          />

          <ToolButton
            active={open && panel === "stickers"}
            icon={<Wand2 size={21} />}
            label="IA"
            badge="AI"
            onClick={() => openPanel("stickers")}
          />

          <ToolButton
            active={open && panel === "upload"}
            icon={<Image size={21} />}
            label="Upload"
            onClick={() => openPanel("upload")}
          />

          <ToolButton
            active={open && panel === "colors"}
            icon={<Palette size={21} />}
            label="Marca"
            disabled={!selected}
            onClick={() => openPanel("colors")}
          />
        </div>
      </div>
    </div>
  );
}