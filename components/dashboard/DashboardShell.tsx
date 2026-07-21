"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Gift,
  Menu,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Users,
  X,
  Monitor,
Smartphone,
} from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Props = {
  children: ReactNode;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Members",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "USB Scanner",
    href: "/dashboard/scanner",
    icon: Monitor,
  },
  {
    label: "Phone Scanner",
    href: "/dashboard/scanner/phone",
    icon: Smartphone,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardShell({
  children,
}: Props) {
  const pathname = usePathname();
  const { theme, cafe } = useCafeTheme();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  const currentPage =
    navigation.find((item) => isActive(item.href))
      ?.label || "Dashboard";

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
         <div className="flex items-center gap-3 min-w-0">
  {cafe.logoUrl ? (
    <img
      src={cafe.logoUrl}
      alt={`${cafe.name} logo`}
      className="h-12 w-12 rounded-xl object-cover border"
      style={{
        borderColor: theme.border,
      }}
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
      style={{
        color: theme.textPrimary,
      }}
    >
      {cafe.name}
    </p>

    <p
      className="mt-1 text-xs"
      style={{
        color: theme.textMuted,
      }}
    >
      Loyalty Dashboard
    </p>
  </div>
</div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
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

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside
            className="relative flex h-full w-[min(82vw,320px)] flex-col border-r shadow-2xl"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
            }}
          >
            <div
              className="flex min-h-20 items-center justify-between border-b px-5"
              style={{
                borderColor: theme.border,
              }}
            >
              <div className="min-w-0">
                <p
                  className="truncate font-semibold"
                  style={{
                    color: theme.textPrimary,
                  }}
                >
                  {cafe.name}
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  Loyalty dashboard
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center border"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceRaised,
                  color: theme.textSecondary,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="flex h-12 items-center gap-3 px-3 text-sm font-medium"
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
                    {item.label}
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
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-64">
        <header
          className="sticky top-0 z-30 flex h-20 items-center justify-between border-b px-5 backdrop-blur-xl sm:px-7 lg:px-10"
          style={{
            borderColor: theme.border,
            backgroundColor: `${theme.pageBackground}E8`,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center border lg:hidden"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.textPrimary,
                borderRadius: theme.radiusMedium,
              }}
            >
              <Menu size={19} />
            </button>

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

          <Link
            href="/dashboard/settings"
            className="flex h-10 items-center justify-center gap-2 border px-3 text-sm font-medium transition hover:opacity-80"
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
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}