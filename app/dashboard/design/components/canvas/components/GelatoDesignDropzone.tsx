"use client";

import { memo, useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

type Props = {
  visible: boolean;
  onUpload: (file: File) => void;
};

function isImageFile(file: File) {
  return /^image\/(png|jpe?g|webp)$/i.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
}

function GelatoDesignDropzone({ visible, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const pickFile = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    (file?: File | null) => {
      if (!file || !isImageFile(file)) return;
      onUpload(file);
      setDragging(false);
    },
    [onUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  if (!visible) return null;

  return (
    <div
      data-gelato-dropzone
      className="pointer-events-none absolute inset-0 z-[35] flex items-center justify-center"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickFile();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          pointer-events-auto
          flex
          h-[124px]
          w-[124px]
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-full
          border
          bg-white/95
          px-5
          text-center
          shadow-[0_18px_45px_rgba(15,23,42,0.16)]
          backdrop-blur
          transition
          hover:scale-[1.03]
          active:scale-[0.98]
          ${dragging ? "border-orange-400 ring-4 ring-orange-300/35" : "border-neutral-200 ring-1 ring-black/5"}
        `}
      >
        <UploadCloud className="mb-1 h-5 w-5 text-neutral-700" />
        <div className="text-[14px] font-bold leading-[17px] text-neutral-800">
          Add your
          <br />
          design
        </div>
        <div className="mt-2 text-[11px] font-medium leading-[13px] text-neutral-600">
          Click to upload,
          <br />
          drag your file
          <br />
          here.
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export default memo(GelatoDesignDropzone);
