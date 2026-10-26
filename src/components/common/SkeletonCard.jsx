export default function SkeletonCard() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="aspect-3/4 w-full animate-pulse bg-sunken" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-sunken" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-sunken" />
        <div className="flex justify-between pt-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-sunken" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-sunken" />
        </div>
      </div>
    </div>
  );
}
