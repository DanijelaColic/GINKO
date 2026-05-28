export default function RoomsLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <section className="py-16 bg-stone/10 text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-3">
          <div className="h-3 w-20 rounded-full bg-stone/30 mx-auto animate-pulse" />
          <div className="h-8 w-48 rounded-full bg-stone/30 mx-auto animate-pulse" />
          <div className="h-4 w-72 rounded-full bg-stone/20 mx-auto animate-pulse" />
        </div>
      </section>
      {/* Card grid skeleton */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-stone/10 animate-pulse">
              <div className="aspect-[4/3] rounded-t-2xl bg-stone/20" />
              <div className="p-5 space-y-2">
                <div className="h-4 w-32 rounded-full bg-stone/20" />
                <div className="h-3 w-48 rounded-full bg-stone/15" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
