import CultureCard from "@/components/culture/CultureCard";

export default function CultureList({ items = [], emptyMessage = "등록된 일정이 없습니다." }) {
  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => <CultureCard key={item.id} item={item} />)}
    </div>
  );
}