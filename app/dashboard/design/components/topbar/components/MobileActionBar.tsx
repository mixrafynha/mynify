"use client";

import { memo } from "react";
import { Redo2, Undo2 } from "lucide-react";
import PreviewButton from "./PreviewButton";
import SaveButton from "./SaveButton";
import TopBarButton from "./TopBarButton";
import ZoomSection from "./ZoomSection";

interface MobileActionBarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview: () => void;
  onSave: () => void;
  saving?: boolean;
  previewing?: boolean;
  disabled?: boolean;
}

function MobileActionBar({
  zoom,
  setZoom,
  onUndo,
  onRedo,
  onPreview,
  onSave,
  saving,
  previewing,
  disabled,
}: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-400/18 bg-[#090714]/96 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.52),0_0_24px_rgba(168,85,247,0.12)] backdrop-blur-2xl md:hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/55 to-transparent" />

      <div className="mx-auto grid max-w-[560px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex items-center gap-1.5">
          <TopBarButton title="Undo" onClick={onUndo} disabled={!onUndo || disabled} className="scale-[1.5]">
            <Undo2 size={17} />
          </TopBarButton>
          <TopBarButton title="Redo" onClick={onRedo} disabled={!onRedo || disabled} className="scale-[1.5]">
            <Redo2 size={17} />
          </TopBarButton>
        </div>

        <div className="flex min-w-0 justify-center">
          <ZoomSection zoom={zoom} setZoom={setZoom} disabled={disabled} mobile />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <PreviewButton compact previewing={previewing} onClick={onPreview} disabled={disabled} />
          <SaveButton compact saving={saving} onClick={onSave} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

export default memo(MobileActionBar);
