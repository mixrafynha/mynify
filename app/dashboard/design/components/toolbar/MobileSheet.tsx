"use client";

import { X } from "lucide-react";

import TemplatesPanel from "./panels/TemplatesPanel";
import TextPanel from "./panels/TextPanel";
import UploadPanel from "./panels/UploadPanel";
import StickersPanel from "./panels/StickersPanel";
import IconsPanel from "./panels/IconsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import EditPanel from "./panels/EditPanel";
import AiPanel from "./panels/AiPanel";

const TOOLBAR_HEIGHT = 86;

export default function MobileSheet(props: any) {
  const {
    open,
    panel,
    setOpen,
    selected,
    onUploadClick,
    createElement,
    updateSelected,
    deleteSelected,
  } = props;

  if (!open) return null;

  const close = () => setOpen(false);

  const panels: Record<string, React.ReactNode> = {
    templates: (
      <TemplatesPanel createElement={createElement} />
    ),

    text: (
      <TextPanel createElement={createElement} />
    ),

    upload: (
      <UploadPanel onUploadClick={onUploadClick} />
    ),

    stickers: (
      <StickersPanel createElement={createElement} />
    ),

    icons: (
      <IconsPanel createElement={createElement} />
    ),

    colors: (
      <ColorsPanel
        selected={selected}
        updateSelected={updateSelected}
      />
    ),

    brand: (
      <ColorsPanel
        selected={selected}
        updateSelected={updateSelected}
      />
    ),

    edit: selected ? (
      <EditPanel
        selected={selected}
        createElement={createElement}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
      />
    ) : (
      <EmptyState />
    ),

    ai: (
      <AiPanel
        setOpen={setOpen}
        createElement={createElement}
      />
    ),
  };

  return (
    <>
      <div
        className="
          md:hidden fixed inset-0 z-30
          bg-black/30 backdrop-blur-[2px]
        "
        onClick={close}
      />

      <div
        className="
          md:hidden fixed inset-x-0 bottom-0 z-40
          overflow-hidden
          rounded-t-[32px]
          border-t border-slate-200
          bg-white
          shadow-[0_-10px_40px_rgba(0,0,0,0.14)]
        "
        style={{
          height: "72dvh",
          paddingBottom: `calc(env(safe-area-inset-bottom) + 10px)`,
        }}
      >
        <div
          className="
            flex items-center justify-between
            border-b border-slate-100
            px-5 py-4
          "
        >
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-black text-slate-950">
              {getTitle(panel)}
            </h2>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {getSubtitle(panel)}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-full bg-slate-100
              text-slate-700
              transition active:scale-95
            "
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="
            h-full overflow-y-auto
            overscroll-contain
            px-4 py-4
          "
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: TOOLBAR_HEIGHT + 40,
          }}
        >
          {panels[panel]}
        </div>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div
      className="
        flex min-h-[220px]
        flex-col items-center justify-center
        rounded-3xl border border-dashed
        border-slate-200 bg-slate-50
        px-6 text-center
      "
    >
      <div
        className="
          mb-4 flex h-14 w-14
          items-center justify-center
          rounded-2xl bg-white
          text-violet-600 shadow-sm
        "
      >
        ✨
      </div>

      <h3 className="text-sm font-black text-slate-900">
        Select an element
      </h3>

      <p className="mt-1 max-w-[260px] text-xs font-medium leading-5 text-slate-500">
        Tap text, image or sticker on the canvas to edit.
      </p>
    </div>
  );
}

function getTitle(panel: string) {
  const titles: Record<string, string> = {
    templates: "Templates",
    text: "Text",
    upload: "Uploads",
    edit: "Edit",
    ai: "AI",
    stickers: "Stickers",
    icons: "Elements",
    colors: "Colors",
    brand: "Brand",
  };

  return titles[panel] || "Editor";
}

function getSubtitle(panel: string) {
  const subtitles: Record<string, string> = {
    templates: "Choose a template",
    text: "Write and customize",
    upload: "Add image",
    edit: "Customize selected item",
    ai: "Generate with AI",
    stickers: "Emoji and stickers",
    icons: "Shapes and elements",
    colors: "Choose colors",
    brand: "Brand styles",
  };

  return subtitles[panel] || "Premium editor";
}