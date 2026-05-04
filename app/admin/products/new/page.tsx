/* ================= IMAGES MANAGER ================= */

import { useState } from "react";
import Image from "next/image";
import { Trash2, ImagePlus } from "lucide-react";

function ImagesManager({
  images,
  setImages,
}: {
  images: string[];
  setImages: (imgs: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addImage = () => {
    if (!input.trim()) return;

    setImages([...images, input.trim()]);
    setInput("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">

      {/* INPUT R2 / URL */}
      <div className="flex gap-2">

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste R2 image URL..."
          className="flex-1 h-11 px-3 rounded-xl border bg-gray-50 text-sm"
        />

        <button
          onClick={addImage}
          className="px-4 rounded-xl bg-black text-white text-sm"
        >
          Add
        </button>

      </div>

      {/* GRID IMAGES */}
      <div className="grid grid-cols-3 gap-3">

        {images?.map((img, i) => (
          <div
            key={i}
            className="relative group aspect-square rounded-xl overflow-hidden border bg-gray-100"
          >

            <Image
              src={img}
              alt="product image"
              fill
              className="object-cover"
            />

            {/* DELETE */}
            <button
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 size={14} />
            </button>

          </div>
        ))}

        {/* EMPTY STATE */}
        {images.length === 0 && (
          <div className="col-span-3 text-center text-xs text-gray-400 py-6 border rounded-xl">
            No images yet — add your first R2 URL
          </div>
        )}

      </div>
    </div>
  );
}