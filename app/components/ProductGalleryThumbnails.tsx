"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const PLACEHOLDER_IMAGE = "/placeholder.png";

type ProductGalleryThumbnailsProps = {
  images: string[];
  title?: string | null;
  activeIndex: number;
  failedImages: Record<string, boolean>;
  onSelect: (index: number) => void;
  onError: (imageUrl: string) => void;
};

export default function ProductGalleryThumbnails({
  images,
  title,
  activeIndex,
  failedImages,
  onSelect,
  onError,
}: ProductGalleryThumbnailsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  }>({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const container = scrollRef.current;
      const dragState = dragStateRef.current;

      if (!container || !dragState.isDragging) return;

      const deltaX = event.clientX - dragState.startX;

      if (Math.abs(deltaX) > 5) {
        dragState.moved = true;
      }

      container.scrollLeft = dragState.scrollLeft - deltaX;
    };

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const container = scrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
      moved: false,
    };
    event.preventDefault();
  };

  return (
    <div
      ref={scrollRef}
      className="w-full cursor-grab overflow-x-auto overflow-y-hidden touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
      onMouseDown={handleMouseDown}
    >
      <div className="flex w-max min-w-full gap-2.5">
        {images.map((image, index) => {
          const thumbnailSrc = failedImages[image] ? PLACEHOLDER_IMAGE : image;

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => {
                if (dragStateRef.current.moved) {
                  dragStateRef.current.moved = false;
                  return;
                }

                onSelect(index);
              }}
              onDragStart={(event) => event.preventDefault()}
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`relative h-[76px] w-[76px] flex-shrink-0 overflow-hidden border bg-[#f3f3f1] sm:h-[92px] sm:w-[92px] ${
                index === activeIndex
                  ? "border-fuchsia-400"
                  : "border-[#d8d8dd]"
              }`}
              draggable={false}
            >
              <Image
                src={thumbnailSrc}
                alt={`${title?.trim() || "Product"} image ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 76px, 92px"
                className="pointer-events-none scale-[1.1] object-contain object-center select-none"
                onError={() => onError(image)}
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
