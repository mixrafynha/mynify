"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useProductVariants(id: string) {
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const userCache = useRef<any>(null);
  const lastCall = useRef(0);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id);

      if (error) {
        console.error(error);
        return;
      }

      const safe = data || [];

      setVariants(safe);

      const first =
        safe.find((v: any) => (v.stock ?? 0) > 0) || safe[0];

      if (first) {
        setSelectedVariant(first);
        setSelectedColor(first.color);
      }
    }

    load();
  }, [id]);

  const saveSelection = useCallback(
    async (variant: any, color: string | null) => {
      try {
        const now = Date.now();
        if (now - lastCall.current < 800) return;
        lastCall.current = now;

        if (!userCache.current) {
          const { data } = await supabase.auth.getUser();
          userCache.current = data?.user || null;
        }

        const user = userCache.current;
        if (!user?.id || !id || !variant) return;

        await supabase.from("user_selections").upsert(
          {
            user_id: user.id,
            product_id: id,
            size: variant?.size ?? null,
            color: color ?? null,
          },
          { onConflict: "user_id,product_id" }
        );
      } catch (err) {
        console.error(err);
      }
    },
    [id]
  );

  const handleColorChange = useCallback(
    (color: string, variant: any) => {
      setSelectedColor(color);
      setSelectedVariant(variant);

      if (variant) saveSelection(variant, color);
    },
    [saveSelection]
  );

  const handleSizeChange = useCallback(
    (variant: any) => {
      setSelectedVariant(variant);
      setSelectedColor(variant?.color || selectedColor);

      if (variant) {
        saveSelection(variant, variant?.color || selectedColor);
      }
    },
    [saveSelection, selectedColor]
  );

  return {
    variants,
    selectedVariant,
    selectedColor,
    handleColorChange,
    handleSizeChange,
  };
}