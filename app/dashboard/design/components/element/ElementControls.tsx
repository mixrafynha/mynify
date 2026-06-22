"use client";

import { memo, useCallback } from "react";
import {
  RotateCw,
  FlipHorizontal,
  Copy,
  Trash2,
  Maximize2,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface ElementControlsProps {
  rotateElement: (e: React.PointerEvent) => void;
  flipElement: (e: React.PointerEvent) => void;
  duplicateElement: (e: React.PointerEvent) => void;
  removeElement: (e: React.PointerEvent) => void;

  fitToBounds?: (e: React.PointerEvent) => void;
  showTransformControls?: (e: React.PointerEvent) => void;

  locked?: boolean;
  toggleLock?: (e: React.PointerEvent) => void;

  bringForward?: () => void;
  sendBackward?: () => void;

  /**
   * Usa true quando o rotate já vem do SelectionFrame.
   * Evita botão duplicado.
   */
  hideRotate?: boolean;

  /**
   * Compacto por defeito para não tapar o design.
   */
  compact?: boolean;
}

function stopPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

const Divider = memo(function Divider() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />;
});

type ToolButtonProps = {
  label: string;
  danger?: boolean;
  compact?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
};

const ToolButton = memo(function ToolButton({
  label,
  danger = false,
  compact = true,
  onPointerDown,
  onClick,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={[
        "flex shrink-0 items-center justify-center gap-1.5",
        compact ? "h-8 min-w-8 px-2" : "h-9 min-w-9 px-3",
        "rounded-lg text-xs font-medium",
        "touch-none select-none",
        "transition active:scale-95",
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
});

const ElementControls = memo(function ElementControls({
  rotateElement,
  flipElement,
  duplicateElement,
  removeElement,
  fitToBounds,
  showTransformControls,
  locked = false,
  toggleLock,
  bringForward,
  sendBackward,
  hideRotate = false,
  compact = true,
}: ElementControlsProps) {
  const handlePointer = useCallback(
    (fn?: (e: React.PointerEvent) => void) =>
      (e: React.PointerEvent<HTMLButtonElement>) => {
        stopPointer(e);
        fn?.(e);
      },
    []
  );

  const handleClick = useCallback(
    (fn?: () => void) =>
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        fn?.();
      },
    []
  );

  return (
    <>
      {!hideRotate && (
        <button
          type="button"
          aria-label="Rotate"
          title="Rotate"
          data-element-control
          onPointerDown={handlePointer(rotateElement)}
          className="
            absolute
            -top-11
            left-1/2
            z-50
            flex
            h-8
            w-8
            -translate-x-1/2
            items-center
            justify-center
            rounded-full
            bg-violet-600
            text-white
            shadow-lg
            ring-2
            ring-white
            transition
            hover:scale-105
            active:scale-95
            touch-none
          "
        >
          <RotateCw size={15} />
        </button>
      )}

      <div
        data-element-control
        onPointerDown={stopPointer}
        className="
          flex
          max-w-[min(92vw,520px)]
          items-center
          gap-0.5
          overflow-x-auto
          rounded-xl
          border
          border-white/10
          bg-neutral-950/95
          px-1.5
          py-1
          text-white
          shadow-xl
          backdrop-blur-md
          scrollbar-none
        "
      >
        {showTransformControls && (
          <>
            <ToolButton
              label="Transform"
              compact={compact}
              onPointerDown={handlePointer(showTransformControls)}
            >
              <Maximize2 size={14} />
              <span className="hidden sm:inline">Transform</span>
            </ToolButton>
            <Divider />
          </>
        )}

        {toggleLock && (
          <>
            <ToolButton
              label={locked ? "Unlock" : "Lock"}
              compact={compact}
              onPointerDown={handlePointer(toggleLock)}
            >
              {locked ? <Unlock size={14} /> : <Lock size={14} />}
              <span className="hidden sm:inline">
                {locked ? "Unlock" : "Lock"}
              </span>
            </ToolButton>
            <Divider />
          </>
        )}

        <ToolButton
          label="Flip"
          compact={compact}
          onPointerDown={handlePointer(flipElement)}
        >
          <FlipHorizontal size={14} />
          <span className="hidden sm:inline">Flip</span>
        </ToolButton>

        {fitToBounds && (
          <>
            <Divider />
            <ToolButton
              label="Fit"
              compact={compact}
              onPointerDown={handlePointer(fitToBounds)}
            >
              <Maximize2 size={14} />
              <span className="hidden sm:inline">Fit</span>
            </ToolButton>
          </>
        )}

        {(bringForward || sendBackward) && (
          <>
            <Divider />

            {bringForward && (
              <ToolButton
                label="Bring forward"
                compact={compact}
                onClick={handleClick(bringForward)}
              >
                <ChevronUp size={14} />
              </ToolButton>
            )}

            {sendBackward && (
              <ToolButton
                label="Send backward"
                compact={compact}
                onClick={handleClick(sendBackward)}
              >
                <ChevronDown size={14} />
              </ToolButton>
            )}
          </>
        )}

        <Divider />

        <ToolButton
          label="Duplicate"
          compact={compact}
          onPointerDown={handlePointer(duplicateElement)}
        >
          <Copy size={14} />
          <span className="hidden sm:inline">Duplicate</span>
        </ToolButton>

        <Divider />

        <ToolButton
          label="Delete"
          danger
          compact={compact}
          onPointerDown={handlePointer(removeElement)}
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Delete</span>
        </ToolButton>
      </div>
    </>
  );
});

ElementControls.displayName = "ElementControls";

export default ElementControls;