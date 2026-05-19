import ProductCard from "./ProductCard";
import { Package } from "lucide-react";

export default function ProductGrid({
  products,
  isLoading,
}: any) {
  return (
    <section className="w-full">
      {isLoading ? (
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            md:gap-5
          "
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="
                h-[260px]
                animate-pulse
                rounded-[28px]
                bg-white/[0.055]
                sm:h-[330px]
              "
            />
          ))}
        </div>
      ) : products?.length ? (
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            md:gap-5
          "
        >
          {products.map((p: any) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[34px] border border-white/[0.05] bg-white/[0.045] p-10 text-center backdrop-blur-xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[0.07] text-cyan-100">
            <Package size={24} />
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            No products found
          </h3>

          <p className="mt-2 text-sm font-medium text-white/45">
            Try another search or add a new product.
          </p>
        </div>
      )}
    </section>
  );
}