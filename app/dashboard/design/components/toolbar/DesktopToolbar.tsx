"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Image,
  Type,
  Wand2,
  Sparkles,
  Palette,
  Trash2,
  LayoutTemplate,
  Folder,
  Grid2X2Plus,
  SlidersHorizontal,
  ChevronLeft,
  Shapes,
} from "lucide-react";

import TemplatesPanel from "./panels/TemplatesPanel";
import TextPanel from "./panels/TextPanel";
import StickersPanel from "./panels/StickersPanel";
import IconsPanel from "./panels/IconsPanel";
import FontsPanel from "./panels/FontsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import EditTextPanel from "./panels/EditTextPanel";
import AiPanel from "./panels/AiPanel";

type Panel =
  | "ai"
  | "templates"
  | "stickers"
  | "icons"
  | "text"
  | "fonts"
  | "colors"
  | "edit"
  | null;

type SelectedElement = {
  id?: string;
  type?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

type DesktopToolbarProps = {
  selected?: SelectedElement | null;
  onUpload?: (file: File) => void;
  onAddText?: () => void;
  createElement?: (element: unknown) => void;
  updateSelected?: (update: Record<string, unknown>) => void;
  deleteSelected?: () => void;
};

const PANEL_WIDTH = 420;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const TEXT_INSERT_LOCK_MS = 450;
const TEXT_Y_OFFSET = 20;

const PANEL_TITLES: Record<
  Exclude<Panel, null>,
  { title: string; subtitle: string }
> = {
  ai: {
    title: "AI Studio",
    subtitle: "Generate premium graphics with transparent background",
  },
  templates: {
    title: "Templates",
    subtitle: "Start faster with polished ready-made layouts",
  },
  stickers: {
    title: "Stickers",
    subtitle: "Add expressive visual details to your design",
  },
  icons: {
    title: "Elements",
    subtitle: "Icons, symbols and shapes for your product",
  },
  text: {
    title: "Text",
    subtitle: "Add clean typography and customize your design",
  },
  fonts: {
    title: "Fonts",
    subtitle: "Change the font of the selected item",
  },
  colors: {
    title: "Brand",
    subtitle: "Apply colors to the selected item",
  },
  edit: {
    title: "Edit",
    subtitle: "Size, rotation, flip, wave and spacing",
  },
};

export default function DesktopToolbar({
  selected = null,
  onUpload,
  onAddText,
  createElement,
  updateSelected,
  deleteSelected,
}: DesktopToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInsertLockedRef = useRef(false);
  const textInsertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activePanel, setActivePanel] = useState<Panel>(null);

  const panelInfo = useMemo(() => {
    if (!activePanel) return null;
    return PANEL_TITLES[activePanel];
  }, [activePanel]);

  const canEditSelected = Boolean(selected);

  const openPanel = useCallback((panel: Exclude<Panel, null>) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const openUploadPicker = useCallback(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }, []);

  const handleUploadChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isValidType =
        ALLOWED_TYPES.includes(file.type) ||
        /\.(png|jpg|jpeg|webp)$/i.test(file.name);

      if (!isValidType) {
        alert("Apenas PNG, JPG ou WEBP.");
        e.target.value = "";
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert("Image should be under 2MB.");
        e.target.value = "";
        return;
      }

      onUpload?.(file);
      e.target.value = "";
    },
    [onUpload],
  );

  const updateSelectedTextMeta = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selected || !updateSelected) return;

      updateSelected({
        meta: {
          ...(selected.meta ?? {}),
          ...patch,
        },
      });
    },
    [selected, updateSelected],
  );

  const safeOnAddText = useCallback(() => {
    if (!onAddText) return;
    if (textInsertLockedRef.current) return;

    textInsertLockedRef.current = true;
    onAddText();

    if (textInsertTimerRef.current) {
      clearTimeout(textInsertTimerRef.current);
    }

    textInsertTimerRef.current = setTimeout(() => {
      textInsertLockedRef.current = false;
    }, TEXT_INSERT_LOCK_MS);
  }, [onAddText]);

  const safeCreateElement = useCallback(
    (element: unknown) => {
      if (!createElement) return;

      if (!element || typeof element !== "object") {
        createElement(element);
        return;
      }

      const item = element as Record<string, unknown>;

      createElement({
        ...item,
        ...(typeof item.y === "number" ? { y: item.y + TEXT_Y_OFFSET } : {}),
        ...(typeof item.top === "number" ? { top: item.top + TEXT_Y_OFFSET } : {}),
        meta: {
          ...((item.meta ?? {}) as Record<string, unknown>),
          insertedYOffset: TEXT_Y_OFFSET,
        },
      });
    },
    [createElement],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleUploadChange}
      />

      <aside className="hidden h-full shrink-0 overflow-visible bg-[#05050d] text-white md:flex">
        <nav className="relative flex h-full w-[82px] shrink-0 flex-col items-center overflow-hidden border-r border-white/10 bg-[#070713]/90 shadow-[22px_0_70px_rgba(0,0,0,0.5)] backdrop-blur-3xl lg:w-[96px] xl:w-[104px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.28),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent)]" />

          <div className="relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative mb-4 h-1.5 w-12 shrink-0 self-center rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 shadow-[0_0_28px_rgba(217,70,239,0.55)]" />

          <NavGroup>
            <SideItem icon={<Wand2 size={22} />} label="AI" active={activePanel === "ai"} onClick={() => openPanel("ai")} premium />
            <SideItem icon={<LayoutTemplate size={22} />} label="Templates" active={activePanel === "templates"} onClick={() => openPanel("templates")} />
            <SideItem icon={<Type size={23} />} label="Text" active={activePanel === "text"} onClick={() => openPanel("text")} />
            <SideItem icon={<Shapes size={23} />} label="Elements" active={activePanel === "icons"} onClick={() => openPanel("icons")} />
          </NavGroup>

          <Divider />

          <NavGroup>
            <SideItem icon={<Palette size={22} />} label="Brand" active={activePanel === "colors"} disabled={!canEditSelected} onClick={() => openPanel("colors")} />
            <SideItem icon={<Image size={22} />} label="Upload" onClick={openUploadPicker} />
            <SideItem icon={<Folder size={22} />} label="Projects" disabled />
            <SideItem icon={<Grid2X2Plus size={22} />} label="Apps" disabled />
          </NavGroup>

          <Divider />

          <NavGroup>
            <SideItem icon={<SlidersHorizontal size={22} />} label="Edit" active={activePanel === "edit"} disabled={!canEditSelected} onClick={() => openPanel("edit")} />
            <SideItem icon={<Type size={22} />} label="Fonts" active={activePanel === "fonts"} disabled={!canEditSelected} onClick={() => openPanel("fonts")} />
            <SideItem icon={<Sparkles size={22} />} label="Stickers" active={activePanel === "stickers"} onClick={() => openPanel("stickers")} />
          </NavGroup>

            <div className="relative mt-auto flex w-full flex-col items-center gap-2 border-t border-white/10 pt-3">
              {canEditSelected && (
                <SideItem icon={<Trash2 size={21} />} label="Delete" danger onClick={deleteSelected} compact />
              )}
            </div>
          </div>
        </nav>

        <section
          className="relative h-full shrink-0 overflow-visible border-r border-white/10 bg-[#101120]/95 shadow-[28px_0_80px_rgba(0,0,0,0.46)] transition-[width,opacity,transform] duration-300 ease-out"
          style={{
            width: activePanel ? PANEL_WIDTH : 0,
            opacity: activePanel ? 1 : 0,
            pointerEvents: activePanel ? "auto" : "none",
          }}
        >
          {activePanel && panelInfo && (
            <div className="flex h-full flex-col overflow-hidden" style={{ width: PANEL_WIDTH }}>
              <PanelHeader title={panelInfo.title} subtitle={panelInfo.subtitle} onClose={closePanel} />

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.1),transparent_30%),#0f1020] px-4 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(168,85,247,.8)_transparent] lg:px-6 lg:py-6">
                {activePanel === "ai" && <AiPanel createElement={safeCreateElement} />}
                {activePanel === "templates" && <TemplatesPanel createElement={safeCreateElement} />}
                {activePanel === "text" && <TextPanel createElement={safeCreateElement} onAddText={safeOnAddText} />}
                {activePanel === "stickers" && <StickersPanel createElement={safeCreateElement} />}
                {activePanel === "icons" && <IconsPanel createElement={safeCreateElement} />}

                {activePanel === "fonts" && canEditSelected && (
                  <FontsPanel selected={selected} updateSelected={updateSelected} />
                )}

                {activePanel === "colors" && canEditSelected && (
                  <ColorsPanel selected={selected} updateSelected={updateSelected} />
                )}

                {activePanel === "edit" && canEditSelected && (
                  <EditTextPanel selected={selected} updateSelectedTextMeta={updateSelectedTextMeta} />
                )}
              </div>
            </div>
          )}
        </section>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-[#080812]/92 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-22px_60px_rgba(0,0,0,0.55)] backdrop-blur-3xl md:hidden">
        <div className="relative overflow-x-auto overscroll-x-contain px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-3 px-2 py-1.5">
            <MobileItem icon={<Wand2 size={21} />} label="AI" active={activePanel === "ai"} onClick={() => openPanel("ai")} />
            <MobileItem icon={<LayoutTemplate size={21} />} label="Templates" active={activePanel === "templates"} onClick={() => openPanel("templates")} />
            <MobileItem icon={<Type size={22} />} label="Text" active={activePanel === "text"} onClick={() => openPanel("text")} />
            <MobileItem icon={<Shapes size={22} />} label="Elements" active={activePanel === "icons"} onClick={() => openPanel("icons")} />
            <MobileItem icon={<Sparkles size={21} />} label="Stickers" active={activePanel === "stickers"} onClick={() => openPanel("stickers")} />
            <MobileItem icon={<Palette size={21} />} label="Brand" active={activePanel === "colors"} disabled={!canEditSelected} onClick={() => openPanel("colors")} />
            <MobileItem icon={<SlidersHorizontal size={21} />} label="Edit" active={activePanel === "edit"} disabled={!canEditSelected} onClick={() => openPanel("edit")} />
            <MobileItem icon={<Type size={21} />} label="Fonts" active={activePanel === "fonts"} disabled={!canEditSelected} onClick={() => openPanel("fonts")} />
            <MobileItem icon={<Image size={21} />} label="Upload" onClick={openUploadPicker} />
          </div>
        </div>
      </div>

      {activePanel && panelInfo && (
        <div className="fixed inset-x-0 bottom-[74px] z-[79] max-h-[78dvh] overflow-hidden rounded-t-[32px] border border-b-0 border-white/10 bg-[#101120]/95 text-white shadow-[0_-28px_80px_rgba(0,0,0,0.62)] backdrop-blur-3xl md:hidden">
          <PanelHeader title={panelInfo.title} subtitle={panelInfo.subtitle} onClose={closePanel} />

          <div className="max-h-[calc(78dvh-92px)] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.1),transparent_28%),#0f1020] px-4 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(168,85,247,.8)_transparent] sm:px-6">
            {activePanel === "ai" && <AiPanel createElement={safeCreateElement} />}
            {activePanel === "templates" && <TemplatesPanel createElement={safeCreateElement} />}
            {activePanel === "text" && <TextPanel createElement={safeCreateElement} onAddText={safeOnAddText} />}
            {activePanel === "stickers" && <StickersPanel createElement={safeCreateElement} />}
            {activePanel === "icons" && <IconsPanel createElement={safeCreateElement} />}

            {activePanel === "fonts" && canEditSelected && (
              <FontsPanel selected={selected} updateSelected={updateSelected} />
            )}

            {activePanel === "colors" && canEditSelected && (
              <ColorsPanel selected={selected} updateSelected={updateSelected} />
            )}

            {activePanel === "edit" && canEditSelected && (
              <EditTextPanel selected={selected} updateSelectedTextMeta={updateSelectedTextMeta} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PanelHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="relative shrink-0 overflow-hidden border-b border-white/10 bg-[#111224]/90 px-5 pb-5 pt-5 backdrop-blur-3xl lg:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.24),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(236,72,153,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

      <button
        onClick={onClose}
        type="button"
        aria-label="Close panel"
        className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.09] text-white shadow-[0_14px_34px_rgba(0,0,0,0.36)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/[0.16] active:scale-95"
      >
        <ChevronLeft size={20} strokeWidth={2.6} />
      </button>

      <div className="relative pr-14">
        <h2 className="text-[28px] font-extrabold leading-none tracking-[-0.055em] text-white lg:text-[31px]">
          {title}
        </h2>

        <p className="mt-2 max-w-[280px] text-[13px] font-medium leading-relaxed tracking-[-0.015em] text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function NavGroup({ children }: { children: ReactNode }) {
  return <div className="relative flex w-full flex-col items-center gap-2">{children}</div>;
}

function Divider() {
  return <div className="relative my-3 h-px w-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />;
}

function SideItem({
  icon,
  label,
  onClick,
  active = false,
  premium = false,
  danger = false,
  compact = false,
  disabled = false,
}: {
  icon: ReactNode;
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
      onClick={disabled ? undefined : onClick}
      type="button"
      disabled={disabled}
      className={`group relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[24px] border border-transparent px-1 text-[11px] font-semibold tracking-[-0.02em] transition-all duration-200 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 ${
        compact ? "h-[58px]" : "h-[66px] lg:h-[70px]"
      } ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : active
            ? "border-white/30 bg-white text-slate-950 shadow-[0_22px_55px_rgba(255,255,255,0.1)]"
            : "text-slate-400 hover:border-white/10 hover:bg-white/[0.065] hover:text-white"
      }`}
    >
      {active && (
        <>
          <span className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-white to-slate-100" />
          <span className="absolute left-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_18px_rgba(217,70,239,0.78)]" />
        </>
      )}

      {premium && (
        <span className="absolute right-1.5 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-1 text-[9px] font-black leading-none text-[#070711] shadow-[0_5px_14px_rgba(251,191,36,0.3)]">
          AI
        </span>
      )}

      <div
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-[17px] transition-all duration-200 lg:h-11 lg:w-11 ${
          active
            ? "bg-gradient-to-b from-violet-100 to-violet-200 text-violet-700 shadow-[0_10px_35px_rgba(139,92,246,0.25)]"
            : danger
              ? "text-red-400 group-hover:bg-red-500/10"
              : "group-hover:bg-violet-500/10 group-hover:text-violet-300"
        }`}
      >
        {icon}
      </div>

      <span className="relative z-10 max-w-[76px] truncate leading-none lg:max-w-[80px]">
        {label}
      </span>
    </button>
  );
}

function MobileItem({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold tracking-[-0.02em] transition active:scale-95 disabled:pointer-events-none disabled:opacity-35 ${
        active ? "text-violet-300" : "text-slate-400 hover:text-white"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
          active ? "bg-violet-500/15 text-violet-200" : "text-current"
        }`}
      >
        {icon}
      </div>
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}