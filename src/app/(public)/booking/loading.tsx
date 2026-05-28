export default function BookingLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <section className="py-14 bg-stone/10 text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-3">
          <div className="h-3 w-20 rounded-full bg-stone/30 mx-auto" />
          <div className="h-8 w-56 rounded-full bg-stone/30 mx-auto" />
          <div className="h-4 w-80 rounded-full bg-stone/20 mx-auto" />
        </div>
      </section>
      {/* Widget skeleton */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl border border-stone/20 bg-white p-8 space-y-4">
            <div className="h-5 w-40 rounded-full bg-stone/20" />
            <div className="h-64 rounded-xl bg-stone/10" />
            <div className="h-10 w-full rounded-full bg-stone/15" />
          </div>
        </div>
      </section>
    </div>
  );
}
