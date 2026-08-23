"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import {
  cafeNavigation,
  isCafeCurrentPage,
} from "./cafe-navigation";

export default function CafeMobileNavigation() {
  const pathname = usePathname();
  const { theme } = useCafeTheme();

  return (
    <nav
      aria-label="Café dashboard navigation"
      className="fixed inset-x-3 z-50 grid grid-cols-5 rounded-[22px] border p-2 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden"
      style={{
        bottom: "max(0.75rem, env(safe-area-inset-bottom))",
        borderColor: theme.border,
        backgroundColor: `${theme.surface}F2`,
      }}
    >
      {cafeNavigation.map((item) => {
        const Icon = item.icon;
        const active = isCafeCurrentPage(
          pathname,
          item.href,
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition"
            style={{
              backgroundColor: active
                ? theme.accentSoft
                : "transparent",
              color: active
                ? theme.accent
                : theme.textMuted,
            }}
          >
            <Icon size={18} />
            <span className="truncate">
              {item.mobileLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
