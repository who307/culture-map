import CultureCard from "@/components/culture/CultureCard";

export default function CultureList({ items = [], emptyMessage = "등록된 일정이 없습니다." }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-14 text-center text-sm text-ink-faint">
        {emptyMessage}
      </p>
    );
  }

  return (
    <section aria-labelledby="culture-list-heading">
      {/* 카드 제목(h3) 위에 h2가 오도록 화면에는 숨긴 목록 제목을 둠 */}
      <h2 id="culture-list-heading" className="sr-only">일정 목록</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => <CultureCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}