"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import { isDashboardCurrentPage } from "./cafe-navigation";

type MobileNavigationItem = {
  label: string;
  mobileLabel: string;
  href: string;
  icon: LucideIcon;
  desktopOnly?: boolean;
};

export default function DashboardMobileNavigation({
  items,
}: {
  items: readonly MobileNavigationItem[];
}) {
  const pathname = usePathname();
  const { theme } = useCafeTheme();
  const mobileItems = items.filter((item) => !item.desktopOnly);

  return (
    <nav
      aria-label="Business dashboard navigation"
      className="sticky bottom-0 z-20 grid shrink-0 gap-0.5 border-t bg-[var(--dashboard-chrome)] px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
      style={{
        borderColor: theme.border,
        gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`,
      }}
    >
      {mobileItems.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isDashboardCurrentPage(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className="flex min-h-12 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 text-[11px] leading-tight font-semibold transition-colors active:opacity-70"
            style={{
              backgroundColor: active ? theme.accentSoft : undefined,
              color: active ? theme.accent : theme.textMuted,
            }}
          >
            <Icon size={19} aria-hidden="true" />
            <span className="max-w-full truncate">{mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
