"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleGauge,
  Coffee,
  Gift,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type AnalyticsData = {
  totalMembers: number;
  newMembersToday: number;
  totalStamps: number;
  rewardsReady: number;
  rewardTarget: number;
  rewardName: string;
};

export default function SimpleAnalytics() {
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

        let responseData: Partial<AnalyticsData> & {
          message?: string;
        } = {};

        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            throw new Error(
              "Analytics returned an invalid response."
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Failed to load analytics."
          );
        }

        setData(responseData as AnalyticsData);
      } catch (error) {
        console.error("Analytics load error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load analytics."
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

    function handleMembersUpdated() {
      loadAnalytics(true);
    }

    window.addEventListener(
      "members-updated",
      handleMembersUpdated
    );

    return () => {
      window.removeEventListener(
        "members-updated",
        handleMembersUpdated
      );
    };
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div
        className="flex min-h-40 items-center justify-center border p-8"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          borderRadius: theme.radiusLarge,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="text-center">
          <LoaderCircle
            size={27}
            className="mx-auto animate-spin"
            style={{
              color: theme.accent,
            }}
          />

          <p
            className="mt-4 text-sm"
            style={{
              color: theme.textMuted,
            }}
          >
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="border p-7 text-center"
        style={{
          borderColor: `${theme.danger}45`,
          backgroundColor: `${theme.danger}12`,
          borderRadius: theme.radiusLarge,
        }}
      >
        <TriangleAlert
          size={26}
          className="mx-auto"
          style={{
            color: theme.danger,
          }}
        />

        <p
          className="mt-4 font-medium"
          style={{
            color: theme.textPrimary,
          }}
        >
          Analytics could not load
        </p>

        <p
          className="mt-2 text-sm"
          style={{
            color: theme.textMuted,
          }}
        >
          {error || "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() => loadAnalytics(true)}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 border px-4 text-sm font-medium transition hover:opacity-90"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surfaceRaised,
            color: theme.textPrimary,
            borderRadius: theme.radiusMedium,
          }}
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: "Total members",
      value: data.totalMembers,
      helper: "All loyalty members",
      icon: Users,
    },
    {
      label: "New today",
      value: data.newMembersToday,
      helper: "Members added today",
      icon: UserPlus,
    },
    {
      label: "Total stamps",
      value: data.totalStamps,
      helper: "Current active stamps",
      icon: Coffee,
    },
    {
      label: "Rewards ready",
      value: data.rewardsReady,
      helper:
        data.rewardsReady === 1
          ? `1 ${data.rewardName.toLowerCase()} ready`
          : `${data.rewardsReady} rewards ready`,
      icon: Gift,
    },
  ];

  return (
    <section
      className="border p-5 sm:p-6"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        borderRadius: theme.radiusLarge,
        boxShadow: theme.cardShadow,
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              color: theme.textSecondary,
            }}
          >
            <CircleGauge size={15} />
            Overview
          </div>

          <h2
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{
              color: theme.textPrimary,
            }}
          >
            Loyalty activity
          </h2>

          <p
            className="mt-2 text-sm"
            style={{
              color: theme.textMuted,
            }}
          >
            A simple view of members, stamps, and rewards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="flex h-10 items-center justify-center gap-2 border px-4 text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surfaceRaised,
            color: theme.textPrimary,
            borderRadius: theme.radiusMedium,
          }}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="border p-5 transition duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accent,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Icon size={20} />
              </div>

              <p
                className="mt-5 text-3xl font-semibold tracking-tight"
                style={{
                  color: theme.textPrimary,
                }}
              >
                {card.value}
              </p>

              <p
                className="mt-2 text-sm font-medium"
                style={{
                  color: theme.textSecondary,
                }}
              >
                {card.label}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: theme.textMuted,
                }}
              >
                {card.helper}
              </p>
            </article>
          );
        })}
      </div>

      <div
        className="mt-5 flex flex-col gap-3 border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.accentSoft,
          borderRadius: theme.radiusMedium,
        }}
      >
        <span
          style={{
            color: theme.textMuted,
          }}
        >
          Reward program
        </span>

        <span
          className="font-medium"
          style={{
            color: theme.textPrimary,
          }}
        >
          {data.rewardTarget} stamps → {data.rewardName}
        </span>
      </div>
    </section>
  );
}