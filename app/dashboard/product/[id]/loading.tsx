export default function ProductLoading() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#10091a] text-white">
      <header className="sticky top-0 z-50 h-[69px] border-b border-white/10 bg-[#10091a]/90 backdrop-blur-xl" />

      <div className="mx-auto max-w-7xl px-2.5 pb-5 pt-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-2 sm:p-3">
            <div className="aspect-square animate-pulse rounded-[22px] bg-white/[0.05]" />
            <div className="mt-4 h-24 animate-pulse rounded-[22px] bg-white/[0.035]" />
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="h-7 w-32 animate-pulse rounded-full bg-white/[0.05]" />
            <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-white/[0.06]" />
            <div className="h-5 w-full animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-32 animate-pulse rounded-3xl bg-white/[0.04]" />
            <div className="h-14 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </main>
  );
}
