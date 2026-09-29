export default function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-3/4 w-full bg-slate-200" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="pt-2 flex justify-between">
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}