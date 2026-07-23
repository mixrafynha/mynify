"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Image, LayoutTemplate, Layers, Sparkles, Star, Type, Wand2, X } from "lucide-react";
import ToolButton from "./ToolButton";

const tools = [
  { id: "ai", label: "AI", icon: <Wand2 size={18} strokeWidth={1.85} />, badge: "AI" },
  { id: "templates", label: "Layouts", icon: <LayoutTemplate size={18} strokeWidth={1.85} /> },
  { id: "text", label: "Text", icon: <Type size={18} strokeWidth={1.85} /> },
  { id: "icons", label: "Icons", icon: <Star size={18} strokeWidth={1.85} /> },
  { id: "stickers", label: "Stickers", icon: <Sparkles size={18} strokeWidth={1.85} /> },
  { id: "layers", label: "Layers", icon: <Layers size={18} strokeWidth={1.85} /> },
  { id: "upload", label: "Upload", icon: <Image size={18} strokeWidth={1.85} /> },
] as const;

type MobileToolbarProps = {
  open: boolean;
  panel: string;
  setOpen: (value: boolean) => void;
  setPanel: (value: string) => void;
  selected?: unknown;
};

function HexagonIcon() {
  return <span aria-hidden="true" className="relative block h-8 w-8"><svg viewBox="0 0 48 48" className="h-full w-full overflow-visible"><path d="M24 3.8 41.2 13.9v20.2L24 44.2 6.8 34.1V13.9L24 3.8Z" fill="rgba(0,0,0,.96)" stroke="rgb(196,76,255)" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

function MobileToolbar({ open, panel, setOpen, setPanel }: MobileToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setMenuOpen(false);
  }, [open]);

  const showMenu = useCallback(() => setMenuOpen(true), []);
  const hideMenu = useCallback(() => setMenuOpen(false), []);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    startX.current = event.clientX;
    setDragX(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (startX.current === null) return;
    setDragX(Math.max(-90, Math.min(120, event.clientX - startX.current)));
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragX > 42) showMenu();
    if (dragX < -42) hideMenu();
    startX.current = null;
    setDragX(0);
  }, [dragX, hideMenu, showMenu]);

  const openPanel = useCallback((nextPanel: string) => {
    setPanel(nextPanel);
    setMenuOpen(false);
    setOpen(true);
  }, [setOpen, setPanel]);

  if (open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] md:hidden">
      {!menuOpen && <button type="button" aria-label="Open editor tools" onClick={showMenu} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{ transform: `translateX(calc(-50% + ${dragX}px))`, bottom: "max(2px, env(safe-area-inset-bottom))" }} className="pointer-events-auto fixed left-1/2 z-[92] flex h-12 w-12 touch-none items-center justify-center bg-transparent p-0 outline-none transition-transform duration-300 ease-[cubic-bezier(.2,.9,.2,1)] active:scale-95">
        <span className="animate-[editor-hex-float_2.4s_cubic-bezier(.45,0,.2,1)_infinite] drop-shadow-[0_0_10px_rgba(192,76,255,.75)]"><HexagonIcon /></span>
      </button>}

      {menuOpen && <button type="button" aria-label="Close editor tools" onClick={hideMenu} className="pointer-events-auto fixed inset-0 z-[90] cursor-default bg-transparent" />}

      <nav aria-label="Editor tools" onClick={(event) => event.stopPropagation()} className={`pointer-events-auto fixed bottom-[max(5px,env(safe-area-inset-bottom))] left-1/2 z-[91] h-[58px] w-[calc(100%_-_14px)] max-w-[520px] -translate-x-1/2 rounded-[20px] border border-purple-300/20 bg-[#050711]/97 px-2 py-1 text-white shadow-[0_8px_22px_rgba(0,0,0,.38),0_0_12px_rgba(168,85,247,.09)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.9,.2,1)] ${menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+40px)] opacity-0"}`}>
        <div className="flex h-full touch-pan-x items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tools.map((tool, index) => <div key={tool.id} className="shrink-0 transition-all duration-300" style={{ transitionDelay: menuOpen ? `${60 + index * 28}ms` : "0ms", opacity: menuOpen ? 1 : 0, transform: menuOpen ? "translateY(0)" : "translateY(8px)" }}><ToolButton compact active={panel === tool.id} icon={tool.icon} label={tool.label} badge={"badge" in tool ? tool.badge : undefined} onClick={() => openPanel(tool.id)} /></div>)}
          <button type="button" aria-label="Close tools" onClick={hideMenu} className="ml-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-white/70 transition-colors active:bg-white/10 active:text-white"><X size={14} strokeWidth={2} /></button>
        </div>
      </nav>

      <style jsx>{`
        @keyframes editor-hex-float {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 8px rgba(192,76,255,.55)); }
          45% { transform: translateY(-4px) scale(1.045); filter: drop-shadow(0 0 15px rgba(192,76,255,.85)); }
          70% { transform: translateY(-1px) scale(.99); filter: drop-shadow(0 0 10px rgba(192,76,255,.65)); }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileToolbar);
