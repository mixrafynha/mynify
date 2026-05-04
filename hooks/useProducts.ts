"use client"

import { useEffect, useState } from "react"
import { formatProduct } from "@/lib/formatProduct"
import type { Product, ProductAPI } from "@/types/product" // 🔥 ADD

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)

        const res = await fetch("/api/products", {
          signal: controller.signal,
          cache: "no-store",
        })

        const json = await res.json()
        const data: ProductAPI[] = json.data ?? [] // 🔥 FIX

        const formatted: Product[] = data.map(formatProduct)

        setProducts(formatted)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [])

  return { products, loading }
}