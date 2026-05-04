// /hooks/useFavorites.ts
"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useFavorites() {
  const [likes, setLikes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return

      const { data: favs } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id)

      const map: Record<string, boolean> = {}
      favs?.forEach(f => (map[f.product_id] = true))

      setLikes(map)
    }

    load()
  }, [])

  const toggleLike = useCallback(async (productId: string) => {
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) return

    const isLiked = !!likes[productId]

    setLikes(prev => ({ ...prev, [productId]: !isLiked }))

    try {
      if (isLiked) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId })
      }
    } catch (err) {
      setLikes(prev => ({ ...prev, [productId]: isLiked }))
    }
  }, [likes])

  return { likes, toggleLike }
}