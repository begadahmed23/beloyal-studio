"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors, Settings } from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import BarberMobileNavigation from "./BarberMobileNavigation";
import { barberNavigation } from "./barber-navigation";

type Props = {
  children: ReactNode;
};

function isCurrentPage(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/scanner") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function BarberDashboardShell({
  children,
}: Props) {
  const pathname = usePathname();
  const { cafe, theme } = useCafeTheme();

  const currentPage =
    barberNavigation.find((item) =>
      isCurrentPage(pathname, item.href)
    )?.label ?? "Overview";

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme.pageBackground,
        color: theme.textPrimary,
      }}
    >
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r lg:flex lg:flex-col"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <div
          className="flex min-h-24 items-center gap-3 border-b px-6"
          style={{ borderColor: theme.border }}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border"
            style={{
              borderColor: theme.inputBorder,
              backgroundColor: theme.accentSoft,
              color: theme.accent,
            }}
          >
            <Scissors size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              {cafe.name}
            </p>
            <p
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.accent }}
            >
              Barber loyalty
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          {barberNavigation.map((item) => {
            const Icon = item.icon;
            const active = isCurrentPage(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition hover:opacity-85"
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="border-t p-4"
          style={{ borderColor: theme.border }}
        >
          <div
            className="mb-3 rounded-2xl border p-4"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
            }}
          >
            <div className="flex items-center gap-3">
              {cafe.logoUrl ? (
                <img
                  src={cafe.logoUrl}
                  alt={`${cafe.name} logo`}
                  className="h-10 w-10 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: theme.accentSoft,
                    color: theme.accent,
                  }}
                >
                  {cafe.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {cafe.name}
                </p>
                <p
                  className="mt-0.5 text-xs capitalize"
                  style={{ color: theme.textMuted }}
                >
                  {cafe.subscriptionStatus
                    .toLowerCase()
                    .replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header
          className="sticky top-0 z-30 flex h-20 items-center justify-between border-b px-5 backdrop-blur-xl sm:px-7 lg:px-10"
          style={{
            borderColor: theme.border,
            backgroundColor: `${theme.pageBackground}E8`,
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em] lg:hidden"
              style={{ color: theme.accent }}
            >
              {cafe.name}
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">
              {currentPage}
            </h1>
          </div>

          <Link
            href="/dashboard/settings"
            aria-label="Open settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-80"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.textSecondary,
            }}
          >
            <Settings size={17} />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10 lg:pt-9">
          {children}
        </main>
      </div>

      <BarberMobileNavigation />
    </div>
  );
}
