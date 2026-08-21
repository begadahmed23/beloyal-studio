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
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type RatingBreakdown = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

type RecentRating = {
  id: string;
  rating: number;
  updatedAt: string;
  customer: {
    name: string;
    memberNumber: string;
  };
};

type AnalyticsData = {
  totalMembers: number;
  newMembersToday: number;
  activeMembersThisMonth: number;
  freeDrinksThisMonth: number;
  rewardName: string;
  reviews: {
    averageRating: number;
    totalRatings: number;
    breakdown: RatingBreakdown;
    recentRatings: RecentRating[];
  };
};

function formatRatingDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

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

  const reviews = data.reviews ?? {
    averageRating: 0,
    totalRatings: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentRatings: [],
  };
  const averageRating = Number(reviews.averageRating || 0);
  const totalRatings = reviews.totalRatings || 0;
  const recentRatings = (reviews.recentRatings || []).slice(0, 5);

  return (
    <div className="space-y-7">
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

      <section
        className="rounded-[26px] border p-5 sm:p-6"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.accent }}
            >
              <Star size={14} fill="currentColor" />
              Client ratings
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">
              How clients rate their visit
            </h3>
            <p
              className="mt-2 text-sm"
              style={{ color: theme.textMuted }}
            >
              Private ratings submitted from digital loyalty cards.
            </p>
          </div>

          <div className="flex items-end gap-4">
            <p className="text-5xl font-semibold tracking-[-0.05em]">
              {totalRatings > 0 ? averageRating.toFixed(1) : "—"}
            </p>
            <div className="pb-1">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const filled =
                    index + 1 <= Math.round(averageRating);

                  return (
                    <Star
                      key={index}
                      size={17}
                      fill={filled ? "currentColor" : "none"}
                      style={{
                        color: filled
                          ? theme.accent
                          : theme.textMuted,
                      }}
                    />
                  );
                })}
              </div>
              <p
                className="mt-1 text-xs"
                style={{ color: theme.textMuted }}
              >
                {totalRatings === 1
                  ? "1 rating"
                  : `${totalRatings} ratings`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div
            className="rounded-[20px] border p-5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
            }}
          >
            <p className="text-sm font-semibold">Rating breakdown</p>
            <div className="mt-5 space-y-3.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  reviews.breakdown[
                    rating as keyof RatingBreakdown
                  ] || 0;
                const percentage =
                  totalRatings > 0
                    ? (count / totalRatings) * 100
                    : 0;

                return (
                  <div
                    key={rating}
                    className="grid grid-cols-[36px_1fr_28px] items-center gap-3"
                  >
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: theme.textSecondary }}
                    >
                      {rating}
                      <Star size={11} fill="currentColor" />
                    </span>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: theme.accentSoft }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: theme.accent,
                        }}
                      />
                    </div>
                    <span
                      className="text-right text-xs"
                      style={{ color: theme.textMuted }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-[20px] border p-5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
            }}
          >
            <p className="text-sm font-semibold">Recent ratings</p>

            {recentRatings.length === 0 ? (
              <div className="flex min-h-44 flex-col items-center justify-center text-center">
                <Star
                  size={24}
                  style={{ color: theme.textMuted }}
                />
                <p className="mt-3 text-sm font-medium">
                  No ratings yet
                </p>
                <p
                  className="mt-1 text-xs"
                  style={{ color: theme.textMuted }}
                >
                  New client ratings will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {recentRatings.map((review) => (
                  <article
                    key={review.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {review.customer.name}
                      </p>
                      <p
                        className="mt-1 truncate text-[11px]"
                        style={{ color: theme.textMuted }}
                      >
                        {review.customer.memberNumber} ·{" "}
                        {formatRatingDate(review.updatedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={14}
                          fill={
                            index < review.rating
                              ? "currentColor"
                              : "none"
                          }
                          style={{
                            color:
                              index < review.rating
                                ? theme.accent
                                : theme.textMuted,
                          }}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
