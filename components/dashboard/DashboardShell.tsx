"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import CafeMobileNavigation from "@/components/dashboard/CafeMobileNavigation";
import MobileLogoutButton from "@/components/dashboard/MobileLogoutButton";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import {
  cafeNavigation,
  isCafeCurrentPage,
} from "./cafe-navigation";

type Props = {
  children: ReactNode;
};

export default function DashboardShell({
  children,
}: Props) {
  const pathname = usePathname();
  const { theme, cafe } = useCafeTheme();

  function isActive(href: string) {
    return isCafeCurrentPage(pathname, href);
  }

  const currentPage =
    cafeNavigation.find((item) => isActive(item.href))
      ?.label || "Overview";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.pageBackground,
        color: theme.textPrimary,
      }}
    >
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:flex lg:flex-col"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <div
          className="flex min-h-24 items-center border-b px-6"
          style={{
            borderColor: theme.border,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            {cafe.logoUrl ? (
              <img
                src={cafe.logoUrl}
                alt={`${cafe.name} logo`}
                className="h-12 w-12 rounded-xl border object-cover"
                style={{ borderColor: theme.border }}
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accent,
                }}
              >
                {cafe.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p
                className="truncate text-lg font-semibold tracking-tight"
                style={{ color: theme.textPrimary }}
              >
                {cafe.name}
              </p>

              <p
                className="mt-1 text-xs"
                style={{ color: theme.textMuted }}
              >
                Loyalty Dashboard
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {cafeNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-11 items-center gap-3 px-3 text-sm font-medium transition hover:opacity-90"
                style={{
                  backgroundColor: active
                    ? theme.accentSoft
                    : "transparent",
                  color: active
                    ? theme.accent
                    : theme.textSecondary,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Icon size={18} />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="border-t p-4"
          style={{
            borderColor: theme.border,
          }}
        >
          <div
            className="mb-3 border px-3 py-3"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              borderRadius: theme.radiusMedium,
            }}
          >
            <p
              className="truncate text-sm font-medium"
              style={{
                color: theme.textPrimary,
              }}
            >
              {cafe.name}
            </p>

            <p
              className="mt-1 text-xs capitalize"
              style={{
                color: theme.textMuted,
              }}
            >
              {cafe.subscriptionStatus
                .toLowerCase()
                .replace("_", " ")}
            </p>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header
          className="sticky top-0 z-30 flex h-20 items-center justify-between border-b px-5 backdrop-blur-xl sm:px-7 lg:px-10"
          style={{
            borderColor: theme.border,
            backgroundColor: `${theme.pageBackground}E8`,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            {cafe.logoUrl ? (
              <img
                src={cafe.logoUrl}
                alt={`${cafe.name} logo`}
                className="h-10 w-10 shrink-0 rounded-xl border object-cover lg:hidden"
                style={{ borderColor: theme.border }}
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold lg:hidden"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accent,
                }}
              >
                {cafe.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p
                className="text-xs font-medium"
                style={{
                  color: theme.textMuted,
                }}
              >
                {cafe.name}
              </p>

              <h1
                className="truncate text-xl font-semibold tracking-tight"
                style={{
                  color: theme.textPrimary,
                }}
              >
                {currentPage}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              aria-label="Open settings"
              className="flex h-10 w-10 items-center justify-center border text-sm font-medium transition hover:opacity-80 sm:w-auto sm:gap-2 sm:px-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.textSecondary,
                borderRadius: theme.radiusMedium,
              }}
            >
              <Settings size={16} />

              <span className="hidden sm:inline">
                Settings
              </span>
            </Link>
            <MobileLogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10 lg:pt-9">
          {children}
        </main>
      </div>

      <CafeMobileNavigation />
    </div>
  );
}
