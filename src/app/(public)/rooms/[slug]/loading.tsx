export default function RoomDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[16/6] rounded-2xl bg-stone/20 mb-8" />
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-3 w-16 rounded-full bg-stone/20" />
          <div className="h-8 w-48 rounded-full bg-stone/25" />
          <div className="h-4 w-64 rounded-full bg-stone/15" />
          <div className="space-y-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 w-full rounded-full bg-stone/10" />
            ))}
          </div>
        </div>
        <div className="h-64 rounded-2xl bg-stone/15" />
      </div>
    </div>
  );
}
