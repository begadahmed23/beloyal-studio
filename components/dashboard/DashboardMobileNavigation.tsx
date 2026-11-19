"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { SlidingSelection } from "@/components/ui/sliding-selection";

import type { DashboardNavigationItem } from "./DashboardFrame";
import { isDashboardCurrentPage } from "./cafe-navigation";

export default function DashboardMobileNavigation({ items }: { items: readonly DashboardNavigationItem[] }) {
  const pathname = usePathname();
  const { t } = useBeLoyalLanguage();
  const { theme } = useCafeTheme();
  const mobileItems = items.filter((item) => !item.desktopOnly);

  return (
    <nav
      aria-label={t("Business dashboard navigation")}
      className="z-20 shrink-0 border-t bg-[var(--dashboard-chrome)] px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
      style={{ borderColor: theme.border }}
    >
      <SlidingSelection
        value={pathname}
        indicatorColor={theme.accentSoft}
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}
      >
        {mobileItems.map(({ href, label, mobileLabel, icon: Icon }) => {
          const active = isDashboardCurrentPage(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-label={t(label)}
              aria-current={active ? "page" : undefined}
              data-selection={active ? "active" : undefined}
              className="flex min-h-12 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 text-[11px] leading-tight font-semibold active:opacity-75 motion-safe:transition-colors"
              style={{ color: active ? theme.accent : theme.textSecondary }}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="max-w-full truncate">{t(mobileLabel)}</span>
            </Link>
          );
        })}
      </SlidingSelection>
    </nav>
  );
}
