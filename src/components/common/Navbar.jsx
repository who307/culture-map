"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/utils/categories";

export const NAV_ITEMS = [
  { label: "통합 홈", href: "/" },
  ...CATEGORIES.map(({ label, href }) => ({ label, href })),
  { label: "위시리스트", href: "/bookmarks" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden shrink-0 items-center gap-0.5 lg:flex" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative inline-flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm transition-colors duration-150 ${
              isActive
                ? "font-semibold text-ink after:absolute after:inset-x-3 after:-bottom-3 after:h-0.5 after:rounded-full after:bg-accent"
                : "font-medium text-ink-soft hover:bg-sunken hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
