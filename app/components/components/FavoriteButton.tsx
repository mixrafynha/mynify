"use client"

import { Heart } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 🔥 cache simples do user (evita getUser várias vezes)
let cachedUser: any = null

async function getUserCached() {
  if (cachedUser) return cachedUser

  const { data } = await supabase.auth.getUser()
  cachedUser = data.user
  return cachedUser
}

export default function FavoriteButton({ productId }: { productId: string }) {
  const [isFav, setIsFav] = useState(false)
  const [loading, startTransition] = useTransition()

  // ✅ carregar estado inicial
  useEffect(() => {
    let mounted = true

    const checkFav = async () => {
      const user = await getUserCached()
      if (!user) return

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()

      if (mounted) setIsFav(!!data)
    }

    checkFav()

    return () => {
      mounted = false
    }
  }, [productId])

  // ✅ toggle otimizado (optimistic UI)
  const toggleFavorite = async () => {
    const user = await getUserCached()
    if (!user) return

    const previous = isFav

    // ⚡ atualização instantânea (UX rápida)
    setIsFav(!previous)

    startTransition(async () => {
      try {
        if (previous) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId)
        } else {
          await supabase.from("favorites").insert({
            user_id: user.id,
            product_id: productId,
          })
        }
      } catch (err) {
        // rollback se der erro
        setIsFav(previous)
        console.error("Favorite error:", err)
      }
    })
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        if (!loading) toggleFavorite()
      }}
      className="disabled:opacity-50"
    >
      <Heart
        size={18}
        className={`transition ${
          isFav ? "text-red-500 fill-red-500" : "text-gray-400"
        }`}
      />
    </button>
  )
}