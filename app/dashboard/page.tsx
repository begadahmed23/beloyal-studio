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

import KatoMark from "@/components/brand/KatoMark";
import AdminFeedbackPanel from "@/components/dashboard/AdminFeedbackPanel";
import BirthdaySummary from "@/components/dashboard/BirthdaySummary";
import CashierDashboardHome from "@/components/dashboard/CashierDashboardHome";
import JoinQRCode from "@/components/dashboard/JoinQRCode";
import SimpleAnalytics from "@/components/dashboard/SimpleAnalytics";
import BarberDashboardHome from "@/components/dashboard/barber/BarberDashboardHome";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function DashboardPage() {
  const { cafe, userRole } = useCafeTheme();

  if (userRole === "CASHIER") {
    return <CashierDashboardHome />;
  }

  if (cafe.businessType === "BARBERSHOP") {
    return <BarberDashboardHome />;
  }

  return <CafeDashboardHome />;
}

function CafeDashboardHome() {
  const { cafe, theme } = useCafeTheme();

  const normalizedCafeName = cafe.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const isKato =
    cafe.slug.toLowerCase().includes("kato") ||
    normalizedCafeName.includes("kato");
  const isKeka =
    cafe.slug.toLowerCase().includes("keka") ||
    normalizedCafeName.includes("keka");

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
      {isKeka ? (
        <section className="relative overflow-hidden rounded-[26px] border border-[#F4E5C6]/15 bg-[linear-gradient(135deg,#7F2023_0%,#741A1D_58%,#5A1013_100%)] px-5 py-6 text-[#FFF6E6] shadow-[0_18px_50px_rgba(32,3,5,0.2)] sm:rounded-[30px] sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#F4E5C6]/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                {cafe.logoUrl ? (
                  <img
                    src={cafe.logoUrl}
                    alt="Keka logo"
                    className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
                  />
                ) : null}
                <div>
                  <p className="font-serif text-xl font-semibold text-[#F4E5C6] sm:text-2xl">
                    Keka
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#F4E5C6]/55">
                    Little Rituals, Big Comfort
                  </p>
                </div>
              </div>

              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#FFF6E6] sm:text-3xl">
                Little rituals · bigger days
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#F4E5C6]/65">
                Your Keka loyalty workspace — members, rewards, birthdays, and returning visits.
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-4 rounded-[20px] border border-[#F4E5C6]/12 bg-[#3D080B]/25 px-4 py-3.5 sm:min-w-[245px] sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#F4E5C6]/50">
                  The ritual
                </p>
                <p className="mt-1 text-lg font-semibold text-[#FFF6E6]">
                  {Math.max(cafe.rewardTarget - 1, 1)} visits
                </p>
              </div>
              <div className="h-9 w-px bg-[#F4E5C6]/15" />
              <p className="max-w-[110px] text-xs leading-5 text-[#F4E5C6]/65">
                then {cafe.rewardName || "a Keka reward"}
              </p>
            </div>
          </div>
        </section>
      ) : isKato ? (
        <section className="relative overflow-hidden rounded-[30px] border border-[#DCE3EA] bg-white p-6 shadow-[0_22px_60px_rgba(16,43,73,0.09)] sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_320px] lg:items-stretch">
            <div>
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[2.2rem] font-light leading-none tracking-[-0.07em] text-[#102B49] sm:text-[2.7rem]">
                    KATŌ
                  </p>
                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#7F8DA0]">
                    Specialty Coffee
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#102B49] text-[#E9E6D8]">
                  <KatoMark size={40} />
                </div>
              </div>

              <p className="mt-8 text-sm font-medium text-[#7F8DA0]">
                Loyalty overview
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-[#0A223E] sm:text-4xl">
                Keep every visit moving smoothly.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#7F8DA0]">
                Track members, rewards, birthdays, and daily loyalty activity from one clean workspace.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(145deg,#16395C_0%,#102B49_58%,#0A223E_100%)] p-6 text-white shadow-[0_18px_42px_rgba(16,43,73,0.18)]">
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/[0.05] blur-3xl" />

              <p className="relative text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
                Loyalty rule
              </p>

              <p className="relative mt-4 text-3xl font-semibold tracking-[-0.04em]">
                Buy {Math.max(cafe.rewardTarget - 1, 1)}
              </p>

              <p className="relative mt-1 text-sm text-white/65">
                & get 1 {cafe.rewardName || "reward"}
              </p>

              <div className="relative mt-7 h-[3px] overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-[#E9E6D8]/80" />
              </div>

              <p className="relative mt-4 text-xs text-white/55">
                Customer card settings update automatically.
              </p>
            </div>
          </div>
        </section>
      ) : (
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
      )}

      <BirthdaySummary />

      <SimpleAnalytics />

      <AdminFeedbackPanel />

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
