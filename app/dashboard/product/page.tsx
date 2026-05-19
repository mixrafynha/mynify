"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import CartDrawer from "@/app/components/ui/CartDrawer";
import ProductSection from "@/app/dashboard/product/product_components/ProductSection";
import ProductSkeletonGrid from "@/app/dashboard/product/product_components/ProductSkeletonGrid";
import ProductsHeader from "@/app/dashboard/product/product_components/ProductsHeader";
import type { AudienceName } from "@/app/dashboard/product/product_components/productConstants";
import type { Product } from "@/app/dashboard/product/product_components/types";

import { useCurrency } from "@/hooks/useCurrency";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPage() {
  const { products = [], loading } = useProducts();
  const { likes = {}, toggleLike } = useFavorites();
  const { currency, setCurrency } = useCurrency();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [audience, setAudience] = useState<AudienceName>("All");

  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const safeSearch = useMemo(
    () => search.replace(/[<>]/g, "").trim().toLowerCase().slice(0, 50),
    [search]
  );

  const normalizedCategory = useMemo(() => {
    switch (category) {
      case "T-Shirts":
        return "tshirt";

      case "Hoodies":
        return "hoodie";

      case "Caps":
        return "caps";

      case "Mugs":
        return "mug";

      case "Posters":
        return "poster";

      default:
        return category.toLowerCase();
    }
  }, [category]);

  const filtered = useMemo(() => {
    return (products as Product[]).filter((product: any) => {
      const title = String(product.title ?? "").toLowerCase();

      const productCategory = String(
        product.category ?? ""
      ).toLowerCase();

      const productAudience = String(
        product.audience ?? "unisex"
      ).toLowerCase();

      const selectedAudience = audience.toLowerCase();

      const matchesAudience =
        audience === "All" ||
        productAudience === "unisex" ||
        productAudience === selectedAudience;

      const matchesSearch =
        !safeSearch || title.includes(safeSearch);

      const matchesCategory =
        category === "All" ||
        productCategory.includes(normalizedCategory);

      return (
        matchesAudience &&
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    safeSearch,
    category,
    audience,
    normalizedCategory,
  ]);

  const newProducts = useMemo(
    () =>
      filtered
        .filter((product) => Boolean(product.is_new))
        .slice(0, 10),
    [filtered]
  );

  const hotProducts = useMemo(
    () =>
      filtered
        .filter((product) => Boolean(product.is_hot))
        .slice(0, 10),
    [filtered]
  );

  const bestSellerProducts = useMemo(
    () =>
      [...filtered]
        .filter(
          (product) =>
            Number(product.sales_count ?? 0) > 0
        )
        .sort(
          (a, b) =>
            Number(b.sales_count ?? 0) -
            Number(a.sales_count ?? 0)
        )
        .slice(0, 10),
    [filtered]
  );

  const loadCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      const total = items.reduce(
        (acc: number, item: any) =>
          acc + Number(item.quantity || 1),
        0
      );

      setCartCount(total);
    } catch (error) {
      console.error("Cart error:", error);
    }
  }, []);

  useEffect(() => {
    loadCart();

    const onFocus = () => loadCart();

    window.addEventListener("focus", onFocus);

    return () =>
      window.removeEventListener("focus", onFocus);
  }, [loadCart]);

  useEffect(() => {
    loadCart();
  }, [cartOpen, loadCart]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080814] text-white">
      <div className="relative z-10 mx-auto max-w-[1550px] px-3 pb-10 pt-3 sm:px-5 md:px-8">
        <ProductsHeader
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          audience={audience}
          setAudience={setAudience}
          currency={currency}
          setCurrency={setCurrency}
          cartCount={cartCount}
          onOpenCart={() => {
            setCartOpen(true);
            loadCart();
          }}
        />

        {loading ? (
          <ProductSkeletonGrid />
        ) : (
          <>
            {newProducts.length > 0 && (
              <ProductSection
                title="New Products"
                products={newProducts}
                currency={currency}
                likes={likes}
                toggleLike={toggleLike}
              />
            )}

            {hotProducts.length > 0 && (
              <ProductSection
                title="Hot Products"
                products={hotProducts}
                currency={currency}
                likes={likes}
                toggleLike={toggleLike}
              />
            )}

            {bestSellerProducts.length > 0 && (
              <ProductSection
                title="Best Sellers"
                products={bestSellerProducts}
                currency={currency}
                likes={likes}
                toggleLike={toggleLike}
              />
            )}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-16 rounded-[34px] border border-white/[0.05] bg-white/[0.045] p-10 text-center backdrop-blur-xl">
            <p className="text-xl font-black text-white">
              No products found
            </p>

            <p className="mt-2 text-sm text-white/45">
              Try another search or category.
            </p>
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          loadCart();
        }}
      />
    </main>
  );
}