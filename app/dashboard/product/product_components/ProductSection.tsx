"use client";

import ProductCard from "./ProductCard";
import type { Currency, Product } from "./types";

type ProductSectionProps = {
  title: string;
  products: Product[];
  currency: Currency;
  likes: Record<string, boolean>;
  toggleLike?: (id: string) => void;
};

export default function ProductSection({
  title,
  products,
  currency,
  likes,
  toggleLike,
}: ProductSectionProps) {
  if (!products.length) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="shrink-0 text-lg font-black uppercase tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            likes={likes}
            toggleLike={toggleLike}
          />
        ))}
      </div>
    </section>
  );
}
