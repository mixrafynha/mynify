"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Currency, rates } from "@/lib/currency"

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD"

    const saved = localStorage.getItem("currency")

    if (saved && saved in rates) {
      return saved as Currency
    }

    return "USD"
  })

  // LOAD SUPABASE
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      const meta = user?.user_metadata?.currency

      if (meta && meta in rates) {
        setCurrency(meta as Currency)
      }
    }

    load()
  }, [])

  // SAVE
  useEffect(() => {
    localStorage.setItem("currency", currency)

    const update = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return

      await supabase.auth.updateUser({
        data: { currency },
      })
    }

    update()
  }, [currency])

  return { currency, setCurrency }
}