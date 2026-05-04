import ProductCard from "./ProductCard";


export default function ProductGrid({
  products,
  isLoading,
}: any) {
  return (
    <div
      className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        gap-3 md:gap-5
      "
    >
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        products.map((p: any) => (
          <ProductCard key={p.id} {...p} />
        ))
      )}
    </div>
  );
}