"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Monitor,
  ScanLine,
  UserPlus,
  Users,
} from "lucide-react";

import BirthdaySummary from "@/components/dashboard/BirthdaySummary";
import JoinQRCode from "@/components/dashboard/JoinQRCode";
import SimpleAnalytics from "@/components/dashboard/SimpleAnalytics";
import BarberDashboardHome from "@/components/dashboard/barber/BarberDashboardHome";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function DashboardPage() {
  const { cafe } = useCafeTheme();

  if (cafe.businessType === "BARBERSHOP") {
    return <BarberDashboardHome />;
  }

  return <CafeDashboardHome />;
}

function CafeDashboardHome() {
  const { cafe, theme } = useCafeTheme();

  const actions = [
    {
      label: "Scan a card",
      helper: "Use the phone camera",
      href: "/dashboard/scanner/phone",
      icon: ScanLine,
      primary: true,
    },
    {
      label: "Add a member",
      helper: "Create a loyalty card",
      href: "/dashboard/members",
      icon: UserPlus,
    },
    {
      label: "View members",
      helper: "Search stamps and rewards",
      href: "/dashboard/members",
      icon: Users,
    },
    {
      label: "Counter scanner",
      helper: "Use the USB scanner",
      href: "/dashboard/scanner",
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-7">
      <section
        className="relative overflow-hidden rounded-[30px] border p-6 sm:p-8"
        style={{
          borderColor: theme.border,
          background: `linear-gradient(135deg, ${theme.surfaceRaised} 0%, ${theme.surface} 58%, ${theme.pageBackground} 100%)`,
          boxShadow: theme.cardShadow,
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: theme.accentSoft }}
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: theme.accent }}
            >
              <Coffee size={14} />
              Café command center
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Turn every coffee run into another visit.
            </h2>
            <p
              className="mt-4 max-w-xl text-sm leading-6"
              style={{ color: theme.textMuted }}
            >
              Record stamps, follow member activity, and manage rewards
              from one focused workspace.
            </p>
          </div>

          <div
            className="rounded-[22px] border p-5 lg:min-w-60"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.accentSoft,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Loyalty rule
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {Math.max(cafe.rewardTarget - 1, 1)} stamps
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: theme.textMuted }}
            >
              then {cafe.rewardName || "Free Drink"}
            </p>
          </div>
        </div>
      </section>

      <SimpleAnalytics />

      <BirthdaySummary />

      <section>
        <div>
          <p className="text-sm font-semibold">Counter tools</p>
          <p
            className="mt-1 text-xs"
            style={{ color: theme.textMuted }}
          >
            Fast actions for the daily café workflow.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex min-h-32 items-center justify-between rounded-[22px] border p-5 transition hover:-translate-y-0.5"
                style={{
                  borderColor: action.primary
                    ? theme.accent
                    : theme.border,
                  backgroundColor: action.primary
                    ? theme.accent
                    : theme.surface,
                  color: action.primary
                    ? theme.buttonText
                    : theme.textPrimary,
                }}
              >
                <div>
                  <Icon
                    size={20}
                    style={{
                      color: action.primary
                        ? theme.buttonText
                        : theme.accent,
                    }}
                  />
                  <p className="mt-5 text-sm font-semibold">
                    {action.label}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: action.primary
                        ? theme.buttonText
                        : theme.textMuted,
                      opacity: action.primary ? 0.68 : 1,
                    }}
                  >
                    {action.helper}
                  </p>
                </div>
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            );
          })}
        </div>
      </section>

      <JoinQRCode />
    </div>
  );
}
