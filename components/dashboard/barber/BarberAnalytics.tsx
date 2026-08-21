"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Scissors,
  UserPlus,
  Users,
} from "lucide-react";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type AnalyticsData = {
  totalMembers: number;
  newMembersToday: number;
  activeMembersThisMonth: number;
  freeDrinksThisMonth: number;
  rewardName: string;
};

export default function BarberAnalytics() {
  const { theme } = useCafeTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        setError("");

        const response = await fetch("/api/analytics", {
          cache: "no-store",
        });
        const responseText = await response.text();
        const result = responseText
          ? (JSON.parse(responseText) as Partial<AnalyticsData> & {
              message?: string;
            })
          : {};

        if (!response.ok) {
          throw new Error(
            result.message || "Could not load barber analytics."
          );
        }

        setData(result as AnalyticsData);
      } catch (loadError) {
        console.error("Barber analytics error:", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load barber analytics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAnalytics();

    const refresh = () => loadAnalytics(true);
    window.addEventListener("members-updated", refresh);

    return () => {
      window.removeEventListener("members-updated", refresh);
    };
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div
        className="flex min-h-36 items-center justify-center rounded-[24px] border"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <LoaderCircle
          size={24}
          className="animate-spin"
          style={{ color: theme.accent }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[24px] border border-red-400/15 bg-red-400/[0.05] p-5">
        <p className="text-sm text-red-200">
          {error || "Analytics are unavailable."}
        </p>
        <button
          type="button"
          onClick={() => loadAnalytics(true)}
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-100"
        >
          <RefreshCw size={13} />
          Try again
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: "Total clients",
      value: data.totalMembers,
      helper: "All loyalty clients",
      icon: Users,
    },
    {
      label: "New today",
      value: data.newMembersToday,
      helper: "Clients who joined today",
      icon: UserPlus,
    },
    {
      label: "Visited this month",
      value: data.activeMembersThisMonth,
      helper: "Unique active clients",
      icon: CheckCircle2,
    },
    {
      label: "Free cuts redeemed",
      value: data.freeDrinksThisMonth,
      helper: "Rewards this month",
      icon: Scissors,
    },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Today at a glance</p>
          <p
            className="mt-1 text-xs"
            style={{ color: theme.textMuted }}
          >
            Live client and visit activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          aria-label="Refresh analytics"
          className="flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-50"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textMuted,
          }}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-[22px] border p-4 sm:p-5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                boxShadow: theme.cardShadow,
              }}
            >
              <Icon size={17} style={{ color: theme.accent }} />
              <p className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                {card.value}
              </p>
              <p
                className="mt-2 text-xs font-medium"
                style={{ color: theme.textSecondary }}
              >
                {card.label}
              </p>
              <p
                className="mt-1 hidden text-[11px] sm:block"
                style={{ color: theme.textMuted }}
              >
                {card.helper}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
