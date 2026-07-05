"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Image,
  Type,
  Wand2,
  Sparkles,
  LayoutTemplate,
  ChevronLeft,
  Shapes,
  Box,
  Images,
  Layers,
} from "lucide-react";

import { PRINT_IMAGE_LIMITS, bytesToMb, validatePrintImage } from "./data";

const PanelLoading = () => (
  <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-[0.14em] text-violet-200/70">
    Loading
  </div>
);

const TemplatesPanel = dynamic(() => import("./panels/TemplatesPanel"), { loading: PanelLoading });
const TextPanel = dynamic(() => import("./panels/TextPanel"), { loading: PanelLoading });
const StickersPanel = dynamic(() => import("./panels/StickersPanel"), { loading: PanelLoading });
const IconsPanel = dynamic(() => import("./panels/IconsPanel"), { loading: PanelLoading });
const ImageTemplatesPanel = dynamic(() => import("./panels/ImageTemplatesPanel"), { loading: PanelLoading });
const Assets3DPanel = dynamic(() => import("./panels/Assets3DPanel"), { loading: PanelLoading });
const AiPanel = dynamic(() => import("./panels/AiPanel"), { loading: PanelLoading });
const LayersPanel = dynamic(() => import("./panels/LayersPanel"), { loading: PanelLoading });

type Panel =
  | "ai"
  | "templates"
  | "stickers"
  | "icons"
  | "images"
  | "assets3d"
  | "text"
  | "layers"
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
  elements?: any[];
  setSelectedId?: (id: string | null) => void;
  setSelectedElement?: (el: any | null) => void;
  updateElement?: (id: string, patch: any) => void;
  deleteElement?: (id: string) => void;
};

const PANEL_WIDTH = 420;
const MAX_FILE_SIZE = PRINT_IMAGE_LIMITS.maxBytes;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const TEXT_INSERT_LOCK_MS = 450;
const TEXT_Y_OFFSET = 20;

const PANEL_TITLES: Record<
  Exclude<Panel, null>,
  { title: string; subtitle: string }
> = {
  ai: {
    title: "AI Studio",
    subtitle: "Generate transparent print graphics",
  },
  templates: {
    title: "Templates",
    subtitle: "Ready-made layouts",
  },
  stickers: {
    title: "Stickers",
    subtitle: "Quick expressive stickers",
  },
  icons: {
    title: "Elements",
    subtitle: "Symbols and shapes",
  },
  images: {
    title: "Images",
    subtitle: "HD print SVG graphics",
  },
  assets3d: {
    title: "3D Assets",
    subtitle: "High-DPI lightweight SVG",
  },
  text: {
    title: "Text",
    subtitle: "Create text only",
  },
  layers: {
    title: "Layers",
    subtitle: "Order, lock and visibility",
  },
};

export default function DesktopToolbar({
  onUpload,
  onAddText,
  createElement,
  selected,
  elements = [],
  setSelectedId,
  setSelectedElement,
  updateElement,
  deleteElement,
}: DesktopToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInsertLockedRef = useRef(false);
  const textInsertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activePanel, setActivePanel] = useState<Panel>(null);

  const panelInfo = useMemo(() => {
    if (!activePanel) return null;
    return PANEL_TITLES[activePanel];
  }, [activePanel]);

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
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        alert(`Image should be under ${bytesToMb(MAX_FILE_SIZE)}MB.`);
        e.target.value = "";
        return;
      }

      try {
        const quality = await validatePrintImage(file);

        if (!quality.ok) {
          alert(quality.message);
          e.target.value = "";
          return;
        }

        if (quality.label !== "PRO") {
        }

        onUpload?.(file);
      } catch {
        alert("Não foi possível validar esta imagem. Usa PNG, JPG ou WEBP em alta resolução.");
      } finally {
        e.target.value = "";
      }
    },
    [onUpload]
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
    [createElement]
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
        <nav className="relative flex h-full w-[76px] shrink-0 flex-col items-center overflow-hidden border-r border-white/10 bg-[#070713]/88 shadow-[18px_0_60px_rgba(0,0,0,0.42)] backdrop-blur-3xl lg:w-[88px] xl:w-[96px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.28),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent)]" />

          <div className="relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative mb-4 h-1.5 w-12 shrink-0 self-center rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 shadow-[0_0_28px_rgba(217,70,239,0.55)]" />

            <NavGroup>
              <SideItem icon={<Wand2 size={22} />} label="AI" active={activePanel === "ai"} onClick={() => openPanel("ai")} premium />
              <SideItem icon={<LayoutTemplate size={22} />} label="Templates" active={activePanel === "templates"} onClick={() => openPanel("templates")} />
              <SideItem icon={<Type size={23} />} label="Text" active={activePanel === "text"} onClick={() => openPanel("text")} />
              <SideItem icon={<Shapes size={23} />} label="Elements" active={activePanel === "icons"} onClick={() => openPanel("icons")} />
              <SideItem icon={<Images size={22} />} label="Images" active={activePanel === "images"} onClick={() => openPanel("images")} />
              <SideItem icon={<Box size={22} />} label="3D" active={activePanel === "assets3d"} onClick={() => openPanel("assets3d")} />
              <SideItem icon={<Sparkles size={22} />} label="Stickers" active={activePanel === "stickers"} onClick={() => openPanel("stickers")} />
              <SideItem icon={<Layers size={22} />} label="Layers" active={activePanel === "layers"} onClick={() => openPanel("layers")} />
            </NavGroup>

            <Divider />

            <NavGroup>
              <SideItem icon={<Image size={22} />} label="Upload" onClick={openUploadPicker} />
            </NavGroup>
          </div>
        </nav>

        <section
          className="relative h-full shrink-0 overflow-visible border-r border-white/10 bg-[#0b0c17]/92 shadow-[22px_0_70px_rgba(0,0,0,0.38)] backdrop-blur-3xl transition-[width,opacity,transform] duration-300 ease-out"
          style={{
            width: activePanel ? "min(420px,calc(100vw - 96px))" : 0,
            opacity: activePanel ? 1 : 0,
            pointerEvents: activePanel ? "auto" : "none",
          }}
        >
          {activePanel && panelInfo && (
            <div className="flex h-full flex-col overflow-hidden" style={{ width: "min(420px,calc(100vw - 96px))" }}>
              <PanelHeader title={panelInfo.title} subtitle={panelInfo.subtitle} onClose={closePanel} />

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%),#0b0c17] px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(168,85,247,.8)_transparent] lg:px-5 lg:py-5">
                {activePanel === "ai" && <AiPanel createElement={safeCreateElement} />}
                {activePanel === "templates" && <TemplatesPanel createElement={safeCreateElement} />}
                {activePanel === "text" && <TextPanel createElement={safeCreateElement} onAddText={safeOnAddText} />}
                {activePanel === "stickers" && <StickersPanel createElement={safeCreateElement} />}
                {activePanel === "icons" && <IconsPanel createElement={safeCreateElement} />}
                {activePanel === "images" && <ImageTemplatesPanel createElement={safeCreateElement} />}
                {activePanel === "assets3d" && <Assets3DPanel createElement={safeCreateElement} />}
                {activePanel === "layers" && <LayersPanel elements={elements} selected={selected} setSelectedId={setSelectedId} setSelectedElement={setSelectedElement} updateElement={updateElement} deleteElement={deleteElement} />}
              </div>
            </div>
          )}
        </section>
      </aside>
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
        <h2 className="text-[24px] font-extrabold leading-none tracking-[-0.055em] text-white lg:text-[26px]">
          {title}
        </h2>

        <p className="mt-2 max-w-[260px] text-[12px] font-medium leading-relaxed tracking-[-0.015em] text-slate-400">
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
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  premium?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      type="button"
      disabled={disabled}
      className={`group relative flex h-[66px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[22px] border border-transparent px-1 text-[11px] font-semibold tracking-[-0.02em] transition-all duration-200 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 lg:h-[70px] ${
        active
          ? "border-white/25 bg-white text-slate-950 shadow-[0_18px_44px_rgba(255,255,255,0.09)]"
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
