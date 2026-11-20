"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";

import LanguageToggle, { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import DashboardMobileNavigation from "./DashboardMobileNavigation";
import DashboardLogoutButton from "./DashboardLogoutButton";
import DashboardViewport from "./DashboardViewport";
import { isDashboardCurrentPage } from "./cafe-navigation";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { SlidingSelection } from "@/components/ui/sliding-selection";

export type DashboardNavigationItem = {
  label: string;
  mobileLabel: string;
  href: string;
  icon: LucideIcon;
  desktopOnly?: boolean;
};

type Props = {
  children: ReactNode;
  items: readonly DashboardNavigationItem[];
  name: string;
  subtitle?: string;
  mark: ReactNode;
};

export default function DashboardFrame({ children, items, name, subtitle, mark }: Props) {
  const { t } = useBeLoyalLanguage();
  const { cafe, theme } = useCafeTheme();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pane = content.current;
    if (pane && window.getComputedStyle(pane).overflowY === "auto") pane.scrollTop = 0;
  }, [pathname]);

  const current = items.find((item) => isDashboardCurrentPage(pathname, item.href));
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <DashboardViewport>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-start">
        <aside
          className={`sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-e lg:flex motion-safe:transition-[width] motion-safe:duration-200 ${collapsed ? "w-20" : "w-60 xl:w-64"}`}
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <div className={`flex min-h-20 shrink-0 items-center gap-3 border-b px-4 ${collapsed ? "justify-center" : ""}`} style={{ borderColor: theme.border }}>
            {mark}
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                {subtitle && <p className="mt-0.5 truncate text-xs" style={{ color: theme.textMuted }}>{t(subtitle)}</p>}
              </div>
            )}
          </div>
          <nav id="dashboard-sidebar-links" aria-label={t("Business dashboard sidebar")} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <SlidingSelection value={current?.href ?? ""} indicatorColor={theme.accentSoft} className="grid gap-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = current?.href === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label={t(label)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? t(label) : undefined}
                    data-selection={active ? "active" : undefined}
                    className={`flex h-11 min-w-0 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] motion-safe:transition-colors ${collapsed ? "justify-center" : ""}`}
                    style={{ color: active ? theme.accent : theme.textSecondary, outlineColor: theme.accent }}
                  >
                    <Icon size={19} className="shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{t(label)}</span>}
                  </Link>
                );
              })}
            </SlidingSelection>
          </nav>
          <div className="shrink-0 border-t px-3 py-3" style={{ borderColor: theme.border }}>
            {!collapsed && (
              <div className="mb-2 px-3 py-2">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="mt-0.5 text-xs capitalize" style={{ color: theme.textSecondary }}>
                  {cafe.subscriptionStatus.toLowerCase().replaceAll("_", " ")}
                </p>
              </div>
            )}
            <DashboardLogoutButton compact={collapsed} />
          </div>
        </aside>

        <div ref={content} data-dashboard-content="" className="min-h-0 min-w-0 flex-1 lg:min-h-screen">
          <header
            className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-[var(--dashboard-chrome)] px-4 sm:px-6 lg:min-h-18 lg:bg-[var(--dashboard-desktop-header)] lg:px-8 lg:backdrop-blur-md"
            style={{ borderColor: theme.border }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}
                aria-expanded={!collapsed}
                aria-controls="dashboard-sidebar-links"
                title={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}
                className="hidden size-10 shrink-0 place-items-center rounded-xl border transition-colors hover:bg-black/5 focus-visible:outline-2 lg:grid"
                style={{ borderColor: theme.border, color: theme.textSecondary, outlineColor: theme.accent }}
                onClick={() => setCollapsed((value) => !value)}
              >
                <ToggleIcon size={19} aria-hidden="true" />
              </button>
              <div className="shrink-0 lg:hidden">{mark}</div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium" style={{ color: theme.textSecondary }}>{name}</p>
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{t(current?.label ?? "Overview")}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <LanguageToggle />
              <div className="lg:hidden"><DashboardLogoutButton compact /></div>
            </div>
          </header>

          <main className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 xl:px-9 xl:py-8">
            {children}
          </main>
        </div>
        <DashboardMobileNavigation items={items} />
      </div>
    </DashboardViewport>
  );
}
