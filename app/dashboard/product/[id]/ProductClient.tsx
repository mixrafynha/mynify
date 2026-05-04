"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import { supabase } from "@/lib/supabase";

import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductLeft } from "./ProductLeft";
import { ProductRight } from "./ProductRight";

type Variant = {
  id: string;
  size?: string;
  color?: string;
  stock?: number;
};

export default function ProductClient({
  product,
  images,
  id,
}: {
  product: any;
  images: string[];
  id: string;
}) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const userRef = useRef<any>(null);
  const lastSaveRef = useRef(0);

  /* ================= SAFE IMAGES ================= */
  const safeImages = useMemo(() => {
    return images?.length ? images : ["/placeholder.png"];
  }, [images]);

  /* ================= FETCH VARIANTS ================= */
  useEffect(() => {
    if (!id) return;

    const loadVariants = async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id);

      if (error) return console.error(error);

      const list = data || [];
      setVariants(list);

      const initial =
        list.find((v) => (v.stock ?? 0) > 0) || list[0];

      if (initial) {
        setSelectedVariant(initial);
        setSelectedColor(initial.color ?? null);
      }
    };

    loadVariants();
  }, [id]);

  /* ================= SAVE (THROTTLED SAFE) ================= */
  const saveSelection = useCallback(
    async (variant: Variant | null, color: string | null) => {
      try {
        const now = Date.now();
        if (now - lastSaveRef.current < 700) return;
        lastSaveRef.current = now;

        if (!userRef.current) {
          const { data } = await supabase.auth.getUser();
          userRef.current = data?.user ?? null;
        }

        const user = userRef.current;
        if (!user?.id || !variant || !id) return;

        await supabase.from("user_selections").upsert(
          {
            user_id: user.id,
            product_id: id,
            size: variant.size ?? null,
            color,
          },
          { onConflict: "user_id,product_id" }
        );
      } catch (err) {
        console.error(err);
      }
    },
    [id]
  );

  /* ================= HANDLERS ================= */
  const handleColorChange = useCallback(
    (color: string, variant: Variant) => {
      setSelectedColor(color);
      setSelectedVariant(variant);
      saveSelection(variant, color);
    },
    [saveSelection]
  );

  const handleSizeChange = useCallback(
    (variant: Variant) => {
      const nextColor = variant?.color ?? selectedColor;

      setSelectedVariant(variant);
      setSelectedColor(nextColor);

      saveSelection(variant, nextColor);
    },
    [saveSelection, selectedColor]
  );

  /* ================= UI (FLAT PREMIUM LAYOUT) ================= */
  return (
    <div className="w-full space-y-6">

      {/* breadcrumb leve */}
      <div className="px-1 sm:px-0">
        <ProductBreadcrumb title={product?.title} />
      </div>

      {/* layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">

        <ProductLeft
          images={safeImages}
          product={product}
          variants={variants}
          selectedColor={selectedColor}
          selectedVariant={selectedVariant}
          onColorChange={handleColorChange}
          onSizeChange={handleSizeChange}
        />

        <ProductRight
          product={product}
          selectedVariant={selectedVariant}
        />

      </div>
    </div>
  );
}