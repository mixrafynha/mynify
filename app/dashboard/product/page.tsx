"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";

import ProductSection from "@/app/dashboard/product/product_components/ProductSection";
import ProductSkeletonGrid from "@/app/dashboard/product/product_components/ProductSkeletonGrid";
import ProductsHeader from "@/app/dashboard/product/product_components/ProductsHeader";
import type { AudienceName } from "@/app/dashboard/product/product_components/productConstants";
import type { Product } from "@/app/dashboard/product/product_components/types";

import { useCurrency } from "@/hooks/useCurrency";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";

const CartDrawer = dynamic(() => import("@/app/components/ui/CartDrawer"), {
  ssr: false,
  loading: () => null,
});

const CATEGORY_MAP: Record<string, string> = {
  "T-Shirts": "tshirt",
  Hoodies: "hoodie",
  Caps: "caps",
  Mugs: "mug",
  Posters: "poster",
};

export default function ProductsPage() {
  const { products = [], loading } = useProducts();
  const { likes = {}, toggleLike } = useFavorites();
  const { currency, setCurrency } = useCurrency();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [audience, setAudience] = useState<AudienceName>("All");

  const [cartOpen, setCartOpen] = useState(false);
  const [cartMounted, setCartMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const cartRequestRef = useRef<Promise<void> | null>(null);
  const deferredSearch = useDeferredValue(search);

  const safeSearch = useMemo(
    () =>
      deferredSearch
        .replace(/[<>]/g, "")
        .trim()
        .toLowerCase()
        .slice(0, 50),
    [deferredSearch]
  );

  const normalizedCategory = useMemo(
    () => CATEGORY_MAP[category] ?? category.toLowerCase(),
    [category]
  );

  const {
    filteredCount,
    newProducts,
    hotProducts,
    bestSellerProducts,
  } = useMemo(() => {
    const newItems: Product[] = [];
    const hotItems: Product[] = [];
    const bestSellerItems: Product[] = [];
    const selectedAudience = audience.toLowerCase();
    let count = 0;

    for (const product of products as Product[]) {
      const title = String(product.title ?? "").toLowerCase();
      const productCategory = String(product.category ?? "").toLowerCase();
      const productAudience = String(product.audience ?? "unisex").toLowerCase();

      const matchesAudience =
        audience === "All" ||
        productAudience === "unisex" ||
        productAudience === selectedAudience;

      const matchesSearch = !safeSearch || title.includes(safeSearch);
      const matchesCategory =
        category === "All" || productCategory.includes(normalizedCategory);

      if (!matchesAudience || !matchesSearch || !matchesCategory) continue;

      count += 1;

      if (product.is_new && newItems.length < 10) {
        newItems.push(product);
      }

      if (product.is_hot && hotItems.length < 10) {
        hotItems.push(product);
      }

      if (Number(product.sales_count ?? 0) > 0) {
        bestSellerItems.push(product);
      }
    }

    bestSellerItems.sort(
      (a, b) => Number(b.sales_count ?? 0) - Number(a.sales_count ?? 0)
    );

    return {
      filteredCount: count,
      newProducts: newItems,
      hotProducts: hotItems,
      bestSellerProducts: bestSellerItems.slice(0, 10),
    };
  }, [products, safeSearch, category, audience, normalizedCategory]);

  const loadCart = useCallback(async () => {
    if (cartRequestRef.current) return cartRequestRef.current;

    const request = (async () => {
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

        const nextCount = items.reduce(
          (total: number, item: { quantity?: number | string }) =>
            total + Number(item.quantity || 1),
          0
        );

        setCartCount((currentCount) =>
          currentCount === nextCount ? currentCount : nextCount
        );
      } catch (error) {
        console.error("Cart error:", error);
      } finally {
        cartRequestRef.current = null;
      }
    })();

    cartRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    void loadCart();

    const refreshCart = () => {
      if (document.visibilityState === "visible") {
        void loadCart();
      }
    };

    window.addEventListener("focus", refreshCart, { passive: true });
    document.addEventListener("visibilitychange", refreshCart, {
      passive: true,
    });

    return () => {
      window.removeEventListener("focus", refreshCart);
      document.removeEventListener("visibilitychange", refreshCart);
    };
  }, [loadCart]);

  const openCart = useCallback(() => {
    setCartMounted(true);
    setCartOpen(true);
    void loadCart();
  }, [loadCart]);

  const closeCart = useCallback(() => {
    setCartOpen(false);
    void loadCart();
  }, [loadCart]);

  return (
    <main className="min-h-screen w-full min-w-0 overflow-hidden bg-[#080814] text-white">
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1550px] px-3 pb-10 pt-3 sm:px-5 md:px-8">
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
          onOpenCart={openCart}
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

        {!loading && filteredCount === 0 && (
          <div className="mt-16 rounded-[34px] border border-white/[0.05] bg-white/[0.045] p-10 text-center backdrop-blur-xl">
            <p className="text-xl font-black text-white">No products found</p>
            <p className="mt-2 text-sm text-white/45">
              Try another search or category.
            </p>
          </div>
        )}
      </div>

      {cartMounted && <CartDrawer open={cartOpen} onClose={closeCart} />}
    </main>
  );
}
