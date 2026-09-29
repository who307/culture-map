export default function SortSelect({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span>정렬</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="popularityRank">인기순</option>
        <option value="startDate">시작일순</option>
        <option value="title">이름순</option>
      </select>
    </label>
  );
}