"use client";

import { memo } from "react";
import ResizeHandles, { Direction } from "./ResizeHandles";

export type SelectionFrameProps = {
  isSelected: boolean;
  editing?: boolean;
  locked?: boolean;

  showDPI?: boolean;
  dpiBadge?: React.ReactNode;
  outside?: boolean;
  severity?: "ok" | "warning" | "error";

  rotateElement: (e: React.PointerEvent) => void;
  resizeElement: (e: React.PointerEvent, direction: Direction) => void;

  flipElement: (e: React.PointerEvent) => void;
  duplicateElement: (e: React.PointerEvent) => void;
  removeElement: (e: React.PointerEvent) => void;
  fitToBounds: (e: React.PointerEvent) => void;
  toggleLock: (e: React.PointerEvent) => void;

  bringForward: () => void;
  sendBackward: () => void;
};

const SelectionFrame = memo(function SelectionFrame({
  isSelected,
  editing = false,
  locked = false,
  showDPI = true,
  dpiBadge,
  outside = false,
  severity = "ok",
  resizeElement,
}: SelectionFrameProps) {
  if (editing) return null;

  const badge = showDPI ? dpiBadge : null;

  if (!isSelected) {
    return <>{badge}</>;
  }

  const borderClass = outside && severity === "error" ? "border-rose-500" : "border-violet-500";

  return (
    <>
      {badge}

      <div
        data-selection-frame
        className={`pointer-events-none absolute inset-0 z-30 rounded-[1px] border-2 ${borderClass}`}
      />

      {!locked && (
        <ResizeHandles
          resizeElement={resizeElement}
          isSelected={isSelected}
          size="medium"
        />
      )}
    </>
  );
});

SelectionFrame.displayName = "SelectionFrame";

export default SelectionFrame;
