export default function ProductSkeletonGrid() {
  return (
    <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="h-[260px] animate-pulse rounded-[28px] bg-white/[0.055] sm:h-[330px]"
        />
      ))}
    </section>
  );
}
