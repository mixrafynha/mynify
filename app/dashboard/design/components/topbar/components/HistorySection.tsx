"use client";

import { memo } from "react";
import { Redo2, RotateCcw, Undo2 } from "lucide-react";
import TopBarButton from "./TopBarButton";

interface HistorySectionProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onRevert?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

function HistorySection({ onUndo, onRedo, onRevert, canUndo = true, canRedo = true, disabled, compact }: HistorySectionProps) {
  const size = compact ? 12 : 16;
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <TopBarButton title="Undo" onClick={onUndo} disabled={!onUndo || !canUndo || disabled}>
        <Undo2 size={size} />
      </TopBarButton>
      <TopBarButton title="Redo" onClick={onRedo} disabled={!onRedo || !canRedo || disabled}>
        <Redo2 size={size} />
      </TopBarButton>
      <TopBarButton title="Revert" onClick={onRevert} disabled={!onRevert || disabled}>
        <RotateCcw size={size} />
      </TopBarButton>
    </div>
  );
}

export default memo(HistorySection);
