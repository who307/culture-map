export default function SortSelect({ value, onChange, category }) {
  const options = category === "movie"
    ? [
        { value: "popularityRank", label: "순위순" },
        { value: "audienceCount", label: "관객수순" },
        { value: "salesAmount", label: "매출액순" },
        { value: "title", label: "이름순" },
      ]
    : [
        { value: "popularityRank", label: "인기순" },
        { value: "startDate", label: "시작일순" },
        { value: "title", label: "이름순" },
      ];

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span>정렬</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}