"use client";

import Link from "next/link";
import {
  ArrowRight,
  LoaderCircle,
  Monitor,
  ScanLine,
  UserRound,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type SummaryResponse = {
  summary: {
    totalCustomers: number;
    newToday: number;
  };
};

export default function CashierDashboardHome() {
  const { cafe, theme } = useCafeTheme();
  const isBarbershop =
    cafe.businessType === "BARBERSHOP";

  const [summary, setSummary] = useState({
    totalCustomers: 0,
    newToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const response = await fetch(
          "/api/cashier/members",
          { cache: "no-store" },
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as SummaryResponse;

        if (active) {
          setSummary(data.summary);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      active = false;
    };
  }, []);

  const actions = [
    {
      label: isBarbershop ? "View clients" : "View members",
      helper: isBarbershop
        ? "Search clients, record visits, and redeem rewards"
        : "Search members, add stamps, and redeem rewards",
      href: "/dashboard/members",
      icon: UserRound,
      primary: true,
    },
    {
      label: "Phone scanner",
      helper: "Scan a customer QR code using the camera",
      href: "/dashboard/scanner/phone",
      icon: ScanLine,
    },
    {
      label: "USB scanner",
      helper: "Use the counter scanner",
      href: "/dashboard/scanner",
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-7">
      <section>
        <p
          className="text-sm font-medium"
          style={{ color: theme.textMuted }}
        >
          Counter overview
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          {cafe.name}
        </h2>

        <p
          className="mt-2 text-sm"
          style={{ color: theme.textMuted }}
        >
          Manage today&apos;s loyalty activity from the counter.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-[24px] border p-5"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            boxShadow: theme.cardShadow,
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-sm"
              style={{ color: theme.textMuted }}
            >
              Total customers
            </p>

            <Users
              size={18}
              style={{ color: theme.accent }}
            />
          </div>

          <p className="mt-5 text-3xl font-semibold tabular-nums">
            {loading ? (
              <LoaderCircle
                size={24}
                className="animate-spin"
              />
            ) : (
              summary.totalCustomers
            )}
          </p>
        </div>

        <div
          className="rounded-[24px] border p-5"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            boxShadow: theme.cardShadow,
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-sm"
              style={{ color: theme.textMuted }}
            >
              New today
            </p>

            <UserRound
              size={18}
              style={{ color: theme.accent }}
            />
          </div>

          <p className="mt-5 text-3xl font-semibold tabular-nums">
            {loading ? (
              <LoaderCircle
                size={24}
                className="animate-spin"
              />
            ) : (
              summary.newToday
            )}
          </p>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold">
          Counter tools
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex min-h-36 items-center justify-between rounded-[22px] border p-5 transition hover:-translate-y-0.5"
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
                    size={21}
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
                    className="mt-1 max-w-[220px] text-xs leading-5"
                    style={{
                      color: action.primary
                        ? theme.buttonText
                        : theme.textMuted,
                      opacity: action.primary ? 0.72 : 1,
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
    </div>
  );
}
