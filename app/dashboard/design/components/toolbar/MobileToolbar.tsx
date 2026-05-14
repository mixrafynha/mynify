"use client";

import {
  Image,
  Type,
  Wand2,
  Star,
  Palette,
  LayoutTemplate,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import ToolButton from "./ToolButton";

const tools = [
  {
    id: "ai",
    label: "AI",
    icon: <Wand2 size={22} />,
    badge: "AI",
    requiresSelection: false,
  },

  {
    id: "templates",
    label: "Templates",
    icon: <LayoutTemplate size={22} />,
    requiresSelection: false,
  },

  {
    id: "icons",
    label: "Elements",
    icon: <Star size={22} />,
    requiresSelection: false,
  },

  {
    id: "text",
    label: "Text",
    icon: <Type size={22} />,
    requiresSelection: false,
  },

  {
    id: "edit",
    label: "Edit",
    icon: <SlidersHorizontal size={22} />,
    requiresSelection: true,
  },

  {
    id: "replace",
    label: "Replace",
    icon: <RotateCcw size={22} />,
    requiresSelection: true,
  },

  {
    id: "effects",
    label: "Tools",
    icon: <Sparkles size={22} />,
    requiresSelection: true,
  },

  {
    id: "upload",
    label: "Upload",
    icon: <Image size={22} />,
    requiresSelection: false,
  },

  {
    id: "brand",
    label: "Brand",
    icon: <Palette size={22} />,
    requiresSelection: true,
  },
];

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
    <div
      className="
        md:hidden fixed inset-x-0 bottom-0 z-50
        border-t border-slate-200
        bg-white/95 backdrop-blur-xl
        shadow-[0_-10px_35px_rgba(15,23,42,0.12)]
      "
    >
      <div className="overflow-x-auto overscroll-x-contain scrollbar-hide">
        <div
          className="
            flex min-w-max items-center gap-1
            px-3 pt-2
            pb-[calc(env(safe-area-inset-bottom)+10px)]
          "
        >
          {tools.map((tool) => {
            const disabled =
              tool.requiresSelection && !selected;

            return (
              <ToolButton
                key={tool.id}
                active={open && panel === tool.id}
                icon={tool.icon}
                label={tool.label}
                badge={tool.badge}
                disabled={disabled}
                onClick={() => openPanel(tool.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}