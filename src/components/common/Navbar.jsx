"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { label: "통합 홈", icon: "🏠", href: "/" },
  { label: "영화", icon: "🎬", href: "/movies" },
  { label: "콘서트", icon: "🎤", href: "/concerts" },
  { label: "뮤지컬", icon: "🎭", href: "/musicals" },
  { label: "지역 행사", icon: "🎪", href: "/festivals" },
  { label: "전시회", icon: "🖼️", href: "/exhibitions" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden shrink-0 items-center gap-1 font-medium lg:flex" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-sm transition-colors xl:px-3 ${
              isActive
                ? "bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <span aria-hidden="true" className="hidden xl:inline-flex text-base">{item.icon}</span>
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}