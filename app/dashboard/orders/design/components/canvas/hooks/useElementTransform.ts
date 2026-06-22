"use client";

import { useCallback, useRef } from "react";

const MIN_SIZE = 20;
const ROTATION_SNAP = 5;

interface TransformableElement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type?: "image" | "text";
}

interface TransformState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function useElementTransform(
  element: TransformableElement,
  updateElement: (patch: Partial<TransformableElement>) => void
) {
  const dragRef = useRef<TransformState | null>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
      };

      const startX = e.clientX;
      const startY = e.clientY;

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;

        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        updateElement({
          x: Math.round(dragRef.current.x + dx),
          y: Math.round(dragRef.current.y + dy),
        });
      };

      const onUp = () => {
        dragRef.current = null;

        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [element, updateElement]
  );

  const startResize = useCallback(
    (
      e: React.PointerEvent,
      direction: string,
      keepAspect = false
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;

      const startWidth = element.width;
      const startHeight = element.height;

      const startPosX = element.x;
      const startPosY = element.y;

      const aspectRatio = startWidth / startHeight;

      const lockAspect =
        keepAspect || element.type === "image";

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        let newX = startPosX;
        let newY = startPosY;

        // EAST
        if (
          direction === "e" ||
          direction === "ne" ||
          direction === "se"
        ) {
          newWidth = Math.max(
            MIN_SIZE,
            startWidth + dx
          );
        }

        // WEST
        if (
          direction === "w" ||
          direction === "nw" ||
          direction === "sw"
        ) {
          newWidth = Math.max(
            MIN_SIZE,
            startWidth - dx
          );

          newX =
            startPosX +
            (startWidth - newWidth);
        }

        // SOUTH
        if (
          direction === "s" ||
          direction === "se" ||
          direction === "sw"
        ) {
          newHeight = Math.max(
            MIN_SIZE,
            startHeight + dy
          );
        }

        // NORTH
        if (
          direction === "n" ||
          direction === "ne" ||
          direction === "nw"
        ) {
          newHeight = Math.max(
            MIN_SIZE,
            startHeight - dy
          );

          newY =
            startPosY +
            (startHeight - newHeight);
        }

        if (lockAspect) {
          if (
            direction.includes("e") ||
            direction.includes("w")
          ) {
            newHeight = newWidth / aspectRatio;

            if (direction.includes("n")) {
              newY =
                startPosY +
                (startHeight - newHeight);
            }
          } else {
            newWidth = newHeight * aspectRatio;

            if (direction.includes("w")) {
              newX =
                startPosX +
                (startWidth - newWidth);
            }
          }
        }

        updateElement({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      };

      const onUp = () => {
        window.removeEventListener(
          "pointermove",
          onMove
        );

        window.removeEventListener(
          "pointerup",
          onUp
        );
      };

      window.addEventListener(
        "pointermove",
        onMove
      );

      window.addEventListener(
        "pointerup",
        onUp
      );
    },
    [element, updateElement]
  );

  const startRotate = useCallback(
    (
      e: React.PointerEvent,
      centerX: number,
      centerY: number
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const startAngle =
        (Math.atan2(
          e.clientY - centerY,
          e.clientX - centerX
        ) *
          180) /
        Math.PI;

      const startRotation =
        element.rotation || 0;

      const onMove = (ev: PointerEvent) => {
        const currentAngle =
          (Math.atan2(
            ev.clientY - centerY,
            ev.clientX - centerX
          ) *
            180) /
          Math.PI;

        let newRotation =
          startRotation +
          (currentAngle - startAngle);

        newRotation =
          ((newRotation % 360) + 360) % 360;

        const snapAngles = [
          0,
          45,
          90,
          135,
          180,
          225,
          270,
          315,
        ];

        for (const angle of snapAngles) {
          if (
            Math.abs(
              newRotation - angle
            ) <= ROTATION_SNAP
          ) {
            newRotation = angle;
            break;
          }
        }

        updateElement({
          rotation: Math.round(
            newRotation
          ),
        });
      };

      const onUp = () => {
        window.removeEventListener(
          "pointermove",
          onMove
        );

        window.removeEventListener(
          "pointerup",
          onUp
        );
      };

      window.addEventListener(
        "pointermove",
        onMove
      );

      window.addEventListener(
        "pointerup",
        onUp
      );
    },
    [element, updateElement]
  );

  return {
    startDrag,
    startResize,
    startRotate,
  };
}