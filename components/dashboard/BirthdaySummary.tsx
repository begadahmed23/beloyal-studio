"use client";

import { Cake, CheckCircle2, Clock3, Gift } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Summary = {
  today: number;
  tomorrow: number;
  activeOffers: number;
  redeemedToday: number;
};

type BirthdaySummaryResponse = {
  enabled: boolean;
  summary: Summary;
  message?: string;
};

const EMPTY_SUMMARY: Summary = {
  today: 0,
  tomorrow: 0,
  activeOffers: 0,
  redeemedToday: 0,
};

export default function BirthdaySummary() {
  const { cafe, theme } = useCafeTheme();
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(
    cafe.birthdayRewardsEnabled,
  );

  const loadSummary = useCallback(async (showLoading = true) => {
    if (!cafe.birthdayRewardsEnabled) {
      setEnabled(false);
      setSummary(EMPTY_SUMMARY);
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/cafe/birthdays", {
        cache: "no-store",
      });

      const data = (await response.json()) as BirthdaySummaryResponse;

      if (!response.ok) {
        throw new Error(
          data.message ?? "Unable to load birthday summary.",
        );
      }

      setEnabled(data.enabled);
      setSummary(data.summary);
    } catch (error) {
      console.error("Birthday summary load error:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [cafe.birthdayRewardsEnabled]);

  useEffect(() => {
    void loadSummary();

    function handleBirthdayRewardsUpdated() {
      void loadSummary(false);
    }

    window.addEventListener(
      "birthday-rewards-updated",
      handleBirthdayRewardsUpdated,
    );

    return () => {
      window.removeEventListener(
        "birthday-rewards-updated",
        handleBirthdayRewardsUpdated,
      );
    };
  }, [loadSummary]);

  if (!enabled && !loading) {
    return null;
  }

  const items = [
    {
      label: "Birthdays today",
      value: summary.today,
      icon: Cake,
    },
    {
      label: "Birthdays tomorrow",
      value: summary.tomorrow,
      icon: Clock3,
    },
    {
      label: "Active offers",
      value: summary.activeOffers,
      icon: Gift,
    },
    {
      label: "Redeemed today",
      value: summary.redeemedToday,
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      className="rounded-[26px] border p-5 sm:p-6"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        boxShadow: theme.cardShadow,
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.accent }}
          >
            Birthday rewards
          </p>
          <h3
            className="mt-2 text-lg font-semibold tracking-tight"
            style={{ color: theme.textPrimary }}
          >
            Today at a glance
          </h3>
        </div>

        <p
          className="text-xs"
          style={{ color: theme.textMuted }}
        >
          {cafe.birthdayRewardName || "Birthday reward"}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[20px] border p-4"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <Icon
                  size={18}
                  style={{ color: theme.accent }}
                />
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: theme.textPrimary }}
                >
                  {loading ? "—" : item.value}
                </span>
              </div>

              <p
                className="mt-4 text-xs font-medium"
                style={{ color: theme.textMuted }}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
