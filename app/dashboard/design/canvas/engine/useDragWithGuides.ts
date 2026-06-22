"use client";

import { useState, useCallback, useRef } from "react";
import { snapPosition } from "../engine/snapping";

interface UseDragWithGuidesProps {
  element: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  safeArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  otherElements: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  onDragMove: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

export function useDragWithGuides({
  element,
  safeArea,
  otherElements,
  onDragMove,
  onDragEnd,
}: UseDragWithGuidesProps) {
  const [isDragging, setIsDragging] =
    useState(false);

  const [activeGuides, setActiveGuides] =
    useState<{
      x: number[];
      y: number[];
    }>({
      x: [],
      y: [],
    });

  const dragStartRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startX: element.x,
        startY: element.y,
      };

      setIsDragging(true);

      e.currentTarget.setPointerCapture?.(
        e.pointerId
      );

      const onPointerMove = (
        ev: PointerEvent
      ) => {
        if (!dragStartRef.current) return;

        const dx =
          ev.clientX -
          dragStartRef.current.x;

        const dy =
          ev.clientY -
          dragStartRef.current.y;

        const newX =
          dragStartRef.current.startX + dx;

        const newY =
          dragStartRef.current.startY + dy;

        const snapResult = snapPosition(
          {
            x: newX,
            y: newY,
            width: element.width,
            height: element.height,
          },
          safeArea,
          otherElements
        );

        setActiveGuides({
          x:
            snapResult.guides
              .verticalPosition !==
            undefined
              ? [
                  snapResult.guides
                    .verticalPosition,
                ]
              : [],
          y:
            snapResult.guides
              .horizontalPosition !==
            undefined
              ? [
                  snapResult.guides
                    .horizontalPosition,
                ]
              : [],
        });

        onDragMove(
          snapResult.x,
          snapResult.y
        );
      };

      const onPointerUp = () => {
        setIsDragging(false);

        setActiveGuides({
          x: [],
          y: [],
        });

        dragStartRef.current = null;

        onDragEnd?.();

        window.removeEventListener(
          "pointermove",
          onPointerMove
        );

        window.removeEventListener(
          "pointerup",
          onPointerUp
        );

        window.removeEventListener(
          "pointercancel",
          onPointerUp
        );
      };

      window.addEventListener(
        "pointermove",
        onPointerMove
      );

      window.addEventListener(
        "pointerup",
        onPointerUp
      );

      window.addEventListener(
        "pointercancel",
        onPointerUp
      );
    },
    [
      element,
      safeArea,
      otherElements,
      onDragMove,
      onDragEnd,
    ]
  );

  return {
    startDrag,
    isDragging,
    activeGuides,
  };
}