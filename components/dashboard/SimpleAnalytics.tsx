"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Coffee,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Star,
  TriangleAlert,
  UserCheck,
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
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    memberNumber: string;
  };
};

type RecentFeedback = {
  id: string;
  comment: string;
  createdAt: string;
  rating: number | null;
  customer: {
    id: string;
    name: string;
    memberNumber: string;
  };
};

type AnalyticsData = {
  totalMembers: number;
  newMembersToday: number;
  activeMembersThisMonth: number;
  freeDrinksThisMonth: number;
  rewardTarget: number;
  rewardName: string;
  reviews: {
    averageRating: number;
    totalRatings: number;
    breakdown: RatingBreakdown;
    recentRatings: RecentRating[];
    recentFeedback: RecentFeedback[];
  };
};

type ActivityTab = "ratings" | "comments";

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

export default function SimpleAnalytics() {
  const { theme } = useCafeTheme();

  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<ActivityTab>("ratings");

  const [showAllRatings, setShowAllRatings] =
    useState(false);

  const [showAllComments, setShowAllComments] =
    useState(false);

  const loadAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        setError("");

        const response = await fetch(
          "/api/analytics",
          {
            cache: "no-store",
          },
        );

        const responseText =
          await response.text();

        let responseData:
          | (Partial<AnalyticsData> & {
              message?: string;
            })
          | undefined = {};

        if (responseText) {
          try {
            responseData =
              JSON.parse(responseText);
          } catch {
            throw new Error(
              "Analytics returned an invalid response.",
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            responseData?.message ||
              "Failed to load analytics.",
          );
        }

        setData(
          responseData as AnalyticsData,
        );
      } catch (error) {
        console.error(
          "Analytics load error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load analytics.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadAnalytics();

    function handleMembersUpdated() {
      loadAnalytics(true);
    }

    window.addEventListener(
      "members-updated",
      handleMembersUpdated,
    );

    return () => {
      window.removeEventListener(
        "members-updated",
        handleMembersUpdated,
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
          borderRadius:
            theme.radiusLarge,
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
          borderRadius:
            theme.radiusLarge,
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
          {error ||
            "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() =>
            loadAnalytics(true)
          }
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 border px-4 text-sm font-medium transition hover:opacity-90"
          style={{
            borderColor: theme.border,
            backgroundColor:
              theme.surfaceRaised,
            color: theme.textPrimary,
            borderRadius:
              theme.radiusMedium,
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
      helper:
        "Members who joined today",
      icon: UserPlus,
    },
    {
      label: "Active this month",
      value:
        data.activeMembersThisMonth,
      helper:
        data.activeMembersThisMonth ===
        1
          ? "1 member used the program"
          : "Unique members who used the program",
      icon: UserCheck,
    },
    {
      label:
        "Free drinks this month",
      value:
        data.freeDrinksThisMonth,
      helper:
        data.freeDrinksThisMonth ===
        1
          ? `1 ${data.rewardName.toLowerCase()} redeemed`
          : `${data.rewardName} rewards redeemed`,
      icon: Coffee,
    },
  ];

  const averageRating = Number(
    data.reviews.averageRating || 0,
  );

  const totalRatings =
    data.reviews.totalRatings || 0;

  const recentRatings =
    data.reviews.recentRatings || [];

  const recentFeedback =
    data.reviews.recentFeedback || [];

  const visibleRatings =
    showAllRatings
      ? recentRatings
      : recentRatings.slice(0, 5);

  const visibleComments =
    showAllComments
      ? recentFeedback
      : recentFeedback.slice(0, 5);

  const hasMoreRatings =
    recentRatings.length > 5;

  const hasMoreComments =
    recentFeedback.length > 5;

  function changeTab(tab: ActivityTab) {
    setActiveTab(tab);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section
        className="border p-4 sm:p-6"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          borderRadius:
            theme.radiusLarge,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                color:
                  theme.textSecondary,
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
              Member growth, monthly
              engagement, and rewards.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadAnalytics(true)
            }
            disabled={refreshing}
            aria-label="Refresh analytics"
            className="flex h-10 w-10 items-center justify-center gap-2 border text-sm font-medium transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-4"
            style={{
              borderColor: theme.border,
              backgroundColor:
                theme.surfaceRaised,
              color: theme.textPrimary,
              borderRadius:
                theme.radiusMedium,
            }}
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="border p-4 transition duration-200 hover:-translate-y-0.5 sm:p-5"
                style={{
                  borderColor:
                    theme.border,
                  backgroundColor:
                    theme.surfaceRaised,
                  borderRadius:
                    theme.radiusMedium,
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center sm:h-11 sm:w-11"
                  style={{
                    backgroundColor:
                      theme.accentSoft,
                    color: theme.accent,
                    borderRadius:
                      theme.radiusMedium,
                  }}
                >
                  <Icon size={18} />
                </div>

                <p
                  className="mt-4 text-2xl font-semibold tracking-tight sm:mt-5 sm:text-3xl"
                  style={{
                    color:
                      theme.textPrimary,
                  }}
                >
                  {card.value}
                </p>

                <p
                  className="mt-2 text-xs font-medium sm:text-sm"
                  style={{
                    color:
                      theme.textSecondary,
                  }}
                >
                  {card.label}
                </p>

                <p
                  className="mt-1 hidden text-xs sm:block"
                  style={{
                    color:
                      theme.textMuted,
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
            backgroundColor:
              theme.accentSoft,
            borderRadius:
              theme.radiusMedium,
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
            {Math.max(
              data.rewardTarget - 1,
              1,
            )}{" "}
            paid stamps →{" "}
            {data.rewardName}
          </span>
        </div>
      </section>

      <section
        className="border p-4 sm:p-6"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          borderRadius:
            theme.radiusLarge,
          boxShadow: theme.cardShadow,
        }}
      >
        <div>
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              color:
                theme.textSecondary,
            }}
          >
            <Star size={15} />
            Customer ratings
          </div>

          <h2
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{
              color: theme.textPrimary,
            }}
          >
            Rating overview
          </h2>

          <p
            className="mt-2 text-sm"
            style={{
              color: theme.textMuted,
            }}
          >
            Private star ratings
            submitted by your members.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div
            className="flex flex-col items-center justify-center border p-5 text-center sm:min-h-60 sm:p-6"
            style={{
              borderColor: theme.border,
              backgroundColor:
                theme.surfaceRaised,
              borderRadius:
                theme.radiusMedium,
            }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center"
              style={{
                backgroundColor:
                  theme.accentSoft,
                color: theme.accent,
                borderRadius:
                  theme.radiusMedium,
              }}
            >
              <Star
                size={25}
                fill="currentColor"
              />
            </div>

            <p
              className="mt-5 text-5xl font-semibold tracking-tight"
              style={{
                color: theme.textPrimary,
              }}
            >
              {totalRatings > 0
                ? averageRating.toFixed(1)
                : "—"}
            </p>

            <div className="mt-3 flex items-center justify-center gap-1">
              {Array.from({
                length: 5,
              }).map((_, index) => {
                const filled =
                  index + 1 <=
                  Math.round(
                    averageRating,
                  );

                return (
                  <Star
                    key={index}
                    size={18}
                    fill={
                      filled
                        ? "currentColor"
                        : "none"
                    }
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
              className="mt-3 text-sm"
              style={{
                color: theme.textMuted,
              }}
            >
              {totalRatings === 1
                ? "Based on 1 rating"
                : `Based on ${totalRatings} ratings`}
            </p>
          </div>

          <div
            className="border p-5"
            style={{
              borderColor: theme.border,
              backgroundColor:
                theme.surfaceRaised,
              borderRadius:
                theme.radiusMedium,
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{
                color: theme.textPrimary,
              }}
            >
              Rating breakdown
            </p>

            <div className="mt-5 space-y-4">
              {[5, 4, 3, 2, 1].map(
                (rating) => {
                  const count =
                    data.reviews.breakdown[
                      rating as keyof RatingBreakdown
                    ] || 0;

                  const percentage =
                    totalRatings > 0
                      ? (count /
                          totalRatings) *
                        100
                      : 0;

                  return (
                    <div
                      key={rating}
                      className="grid grid-cols-[42px_1fr_36px] items-center gap-3"
                    >
                      <div
                        className="flex items-center gap-1 text-sm"
                        style={{
                          color:
                            theme.textSecondary,
                        }}
                      >
                        {rating}

                        <Star
                          size={13}
                          fill="currentColor"
                          style={{
                            color:
                              theme.accent,
                          }}
                        />
                      </div>

                      <div
                        className="h-2 overflow-hidden"
                        style={{
                          backgroundColor:
                            theme.accentSoft,
                          borderRadius:
                            999,
                        }}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              theme.accent,
                            borderRadius:
                              999,
                          }}
                        />
                      </div>

                      <span
                        className="text-right text-sm"
                        style={{
                          color:
                            theme.textMuted,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-8 border-t pt-6"
          style={{
            borderColor: theme.border,
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div
                className="flex items-center gap-2"
                style={{
                  color:
                    theme.textPrimary,
                }}
              >
                <MessageCircle
                  size={18}
                />

                <h3 className="text-base font-semibold">
                  Customer activity
                </h3>
              </div>

              <p
                className="mt-1 text-sm"
                style={{
                  color:
                    theme.textMuted,
                }}
              >
                Browse star ratings
                and written feedback
                separately.
              </p>
            </div>

            <div
              className="grid w-full grid-cols-2 gap-1 border p-1 sm:w-auto sm:min-w-[240px]"
              style={{
                borderColor:
                  theme.border,
                backgroundColor:
                  theme.surfaceRaised,
                borderRadius:
                  theme.radiusMedium,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  changeTab("ratings")
                }
                className="flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium transition"
                style={{
                  backgroundColor:
                    activeTab ===
                    "ratings"
                      ? theme.accentSoft
                      : "transparent",
                  color:
                    activeTab ===
                    "ratings"
                      ? theme.accent
                      : theme.textMuted,
                  borderRadius:
                    theme.radiusMedium,
                }}
              >
                <Star size={14} />
                Ratings
              </button>

              <button
                type="button"
                onClick={() =>
                  changeTab("comments")
                }
                className="flex h-9 items-center justify-center gap-2 px-4 text-sm font-medium transition"
                style={{
                  backgroundColor:
                    activeTab ===
                    "comments"
                      ? theme.accentSoft
                      : "transparent",
                  color:
                    activeTab ===
                    "comments"
                      ? theme.accent
                      : theme.textMuted,
                  borderRadius:
                    theme.radiusMedium,
                }}
              >
                <MessageCircle
                  size={14}
                />
                Comments
              </button>
            </div>
          </div>

          {activeTab === "ratings" ? (
            <>
              {recentRatings.length ===
              0 ? (
                <div
                  className="mt-4 border p-8 text-center"
                  style={{
                    borderColor:
                      theme.border,
                    backgroundColor:
                      theme.surfaceRaised,
                    borderRadius:
                      theme.radiusMedium,
                  }}
                >
                  <Star
                    size={25}
                    className="mx-auto"
                    style={{
                      color:
                        theme.textMuted,
                    }}
                  />

                  <p
                    className="mt-4 font-medium"
                    style={{
                      color:
                        theme.textPrimary,
                    }}
                  >
                    No ratings yet
                  </p>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color:
                        theme.textMuted,
                    }}
                  >
                    Customer ratings
                    will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {visibleRatings.map(
                      (review) => (
                        <article
                          key={
                            review.id
                          }
                          className="flex flex-col gap-4 border p-4 sm:flex-row sm:items-center sm:justify-between"
                          style={{
                            borderColor:
                              theme.border,
                            backgroundColor:
                              theme.surfaceRaised,
                            borderRadius:
                              theme.radiusMedium,
                          }}
                        >
                          <div className="min-w-0">
                            <p
                              className="truncate font-medium"
                              style={{
                                color:
                                  theme.textPrimary,
                              }}
                            >
                              {
                                review
                                  .customer
                                  .name
                              }
                            </p>

                            <p
                              className="mt-1 text-xs"
                              style={{
                                color:
                                  theme.textMuted,
                              }}
                            >
                              Member #
                              {
                                review
                                  .customer
                                  .memberNumber
                              }{" "}
                              ·{" "}
                              {formatRatingDate(
                                review.updatedAt,
                              )}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            {Array.from({
                              length: 5,
                            }).map(
                              (
                                _,
                                index,
                              ) => {
                                const filled =
                                  index <
                                  review.rating;

                                return (
                                  <Star
                                    key={
                                      index
                                    }
                                    size={17}
                                    fill={
                                      filled
                                        ? "currentColor"
                                        : "none"
                                    }
                                    style={{
                                      color:
                                        filled
                                          ? theme.accent
                                          : theme.textMuted,
                                    }}
                                  />
                                );
                              },
                            )}

                            <span
                              className="ml-2 text-sm font-medium"
                              style={{
                                color:
                                  theme.textSecondary,
                              }}
                            >
                              {
                                review.rating
                              }
                              /5
                            </span>
                          </div>
                        </article>
                      ),
                    )}
                  </div>

                  {hasMoreRatings ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllRatings(
                          (current) =>
                            !current,
                        )
                      }
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 border text-sm font-medium transition hover:opacity-85"
                      style={{
                        borderColor:
                          theme.border,
                        backgroundColor:
                          theme.surfaceRaised,
                        color:
                          theme.textPrimary,
                        borderRadius:
                          theme.radiusMedium,
                      }}
                    >
                      {showAllRatings ? (
                        <>
                          <ChevronUp
                            size={16}
                          />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown
                            size={16}
                          />
                          View all ratings
                        </>
                      )}
                    </button>
                  ) : null}
                </>
              )}
            </>
          ) : (
            <>
              {recentFeedback.length ===
              0 ? (
                <div
                  className="mt-4 border p-8 text-center"
                  style={{
                    borderColor:
                      theme.border,
                    backgroundColor:
                      theme.surfaceRaised,
                    borderRadius:
                      theme.radiusMedium,
                  }}
                >
                  <MessageCircle
                    size={25}
                    className="mx-auto"
                    style={{
                      color:
                        theme.textMuted,
                    }}
                  />

                  <p
                    className="mt-4 font-medium"
                    style={{
                      color:
                        theme.textPrimary,
                    }}
                  >
                    No comments yet
                  </p>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color:
                        theme.textMuted,
                    }}
                  >
                    Written customer
                    feedback will
                    appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {visibleComments.map(
                      (feedback) => (
                        <article
                          key={
                            feedback.id
                          }
                          className="border p-4 sm:p-5"
                          style={{
                            borderColor:
                              theme.border,
                            backgroundColor:
                              theme.surfaceRaised,
                            borderRadius:
                              theme.radiusMedium,
                          }}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p
                                className="truncate font-medium"
                                style={{
                                  color:
                                    theme.textPrimary,
                                }}
                              >
                                {
                                  feedback
                                    .customer
                                    .name
                                }
                              </p>

                              <p
                                className="mt-1 text-xs"
                                style={{
                                  color:
                                    theme.textMuted,
                                }}
                              >
                                Member #
                                {
                                  feedback
                                    .customer
                                    .memberNumber
                                }{" "}
                                ·{" "}
                                {formatRatingDate(
                                  feedback.createdAt,
                                )}
                              </p>
                            </div>

                            {feedback.rating !==
                            null ? (
                              <div className="flex shrink-0 items-center gap-1">
                                {Array.from({
                                  length: 5,
                                }).map(
                                  (
                                    _,
                                    index,
                                  ) => {
                                    const filled =
                                      index <
                                      feedback.rating!;

                                    return (
                                      <Star
                                        key={
                                          index
                                        }
                                        size={
                                          16
                                        }
                                        fill={
                                          filled
                                            ? "currentColor"
                                            : "none"
                                        }
                                        style={{
                                          color:
                                            filled
                                              ? theme.accent
                                              : theme.textMuted,
                                        }}
                                      />
                                    );
                                  },
                                )}

                                <span
                                  className="ml-1 text-xs font-medium"
                                  style={{
                                    color:
                                      theme.textSecondary,
                                  }}
                                >
                                  {
                                    feedback.rating
                                  }
                                  /5
                                </span>
                              </div>
                            ) : (
                              <span
                                className="shrink-0 text-xs"
                                style={{
                                  color:
                                    theme.textMuted,
                                }}
                              >
                                No rating
                              </span>
                            )}
                          </div>

                          <div
                            className="mt-4 border-t pt-4"
                            style={{
                              borderColor:
                                theme.border,
                            }}
                          >
                            <p
                              className="whitespace-pre-wrap break-words text-sm leading-6"
                              style={{
                                color:
                                  theme.textSecondary,
                              }}
                            >
                              “
                              {
                                feedback.comment
                              }
                              ”
                            </p>
                          </div>
                        </article>
                      ),
                    )}
                  </div>

                  {hasMoreComments ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllComments(
                          (current) =>
                            !current,
                        )
                      }
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 border text-sm font-medium transition hover:opacity-85"
                      style={{
                        borderColor:
                          theme.border,
                        backgroundColor:
                          theme.surfaceRaised,
                        color:
                          theme.textPrimary,
                        borderRadius:
                          theme.radiusMedium,
                      }}
                    >
                      {showAllComments ? (
                        <>
                          <ChevronUp
                            size={16}
                          />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown
                            size={16}
                          />
                          View all comments
                        </>
                      )}
                    </button>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
