"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { label: "통합 홈", href: "/" },
  { label: "영화", href: "/movies" },
  { label: "콘서트", href: "/concerts" },
  { label: "뮤지컬", href: "/musicals" },
  { label: "지역 행사", href: "/festivals" },
  { label: "전시회", href: "/exhibitions" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 font-medium lg:flex" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}