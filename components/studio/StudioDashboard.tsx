"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coffee,
  Gift,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import CreateCafeDialog from "@/components/studio/CreateCafeDialog";
import type {
  AttentionReason,
  StudioApiResponse,
  StudioBusiness,
  SubscriptionStatus,
} from "@/components/studio/studio-types";

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "TRIAL"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED";

type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "NAME"
  | "MEMBERS"
  | "ACTIVITY";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLastActivity(value: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No recent activity";
  }

  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return "Active today";
  }

  if (days === 1) {
    return "Active yesterday";
  }

  return `Active ${days} days ago`;
}

function getDaysUntil(value: string | null) {
  if (!value) {
    return null;
  }

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const difference = target.getTime() - Date.now();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  );
}

function getStatusLabel(
  status: SubscriptionStatus,
  isActive: boolean,
) {
  if (!isActive || status === "SUSPENDED") {
    return "SUSPENDED";
  }

  if (status === "PAST_DUE") {
    return "PAST DUE";
  }

  return status;
}

function getEffectiveStatus(
  cafe: StudioBusiness,
): SubscriptionStatus {
  if (
    !cafe.isActive ||
    cafe.subscriptionStatus === "SUSPENDED"
  ) {
    return "SUSPENDED";
  }

  return cafe.subscriptionStatus;
}

function getStatusStyles(
  status: SubscriptionStatus,
  isActive: boolean,
) {
  if (!isActive || status === "SUSPENDED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "TRIAL") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "PAST_DUE") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}

function getExpiryText(cafe: StudioBusiness) {
  const expiryDate =
    cafe.subscriptionStatus === "TRIAL"
      ? cafe.trialEndsAt
      : cafe.subscriptionEndsAt;

  const days = getDaysUntil(expiryDate);

  if (days === null) {
    return "No expiry configured";
  }

  if (days < 0) {
    return `Expired ${Math.abs(days)} day${
      Math.abs(days) === 1 ? "" : "s"
    } ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

function getAttentionLabel(reason: AttentionReason) {
  if (reason === "SUSPENDED") {
    return "Business suspended";
  }

  if (reason === "PAST_DUE") {
    return "Subscription past due";
  }

  if (reason === "MISSING_OWNER") {
    return "Missing owner account";
  }

  if (reason === "TRIAL_ENDING_SOON") {
    return "Trial ending soon";
  }

  return "No loyalty activity in 30 days";
}

function getAttentionStyles(reason: AttentionReason) {
  if (
    reason === "SUSPENDED" ||
    reason === "PAST_DUE"
  ) {
    return {
      wrapper:
        "border-red-200 bg-red-50/70 hover:bg-red-50",
      icon:
        "bg-red-100 text-red-600",
      label:
        "text-red-700",
      helper:
        "text-red-600/70",
    };
  }

  if (reason === "TRIAL_ENDING_SOON") {
    return {
      wrapper:
        "border-amber-200 bg-amber-50/70 hover:bg-amber-50",
      icon:
        "bg-amber-100 text-amber-600",
      label:
        "text-amber-700",
      helper:
        "text-amber-600/70",
    };
  }

  return {
    wrapper:
      "border-slate-200 bg-slate-50/80 hover:bg-slate-50",
    icon:
      "bg-slate-100 text-slate-600",
    label:
      "text-slate-700",
    helper:
      "text-slate-500",
  };
}

export default function StudioDashboard() {
  const [data, setData] =
    useState<StudioApiResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [sortOption, setSortOption] =
    useState<SortOption>("NEWEST");

  const loadData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        setError("");

        const response = await fetch(
          "/api/studio/cafes",
          {
            cache: "no-store",
          },
        );

        const responseText = await response.text();

        let responseData: Partial<StudioApiResponse> & {
          message?: string;
        } = {};

        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            throw new Error(
              "Studio returned an invalid response.",
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Failed to load Studio.",
          );
        }

        setData(responseData as StudioApiResponse);
      } catch (error) {
        console.error("Studio load error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load Studio.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Businesses",
        helper: `${data.summary.activeBusinessesThisMonth} used BeLoyal this month`,
        value: formatCompactNumber(
          data.summary.totalCafes,
        ),
        icon: Building2,
        iconClass:
          "bg-violet-500/10 text-violet-500 ring-violet-400/20",
      },
      {
        label: "Customer memberships",
        helper: `+${formatCompactNumber(
          data.summary.newMembersThisMonth,
        )} new this month`,
        value: formatCompactNumber(
          data.summary.totalMembers,
        ),
        icon: Users,
        iconClass:
          "bg-blue-500/10 text-blue-500 ring-blue-400/20",
      },
      {
        label: "Loyalty events",
        helper: "Stamps and rewards this month",
        value: formatCompactNumber(
          data.summary.loyaltyEventsThisMonth,
        ),
        icon: Activity,
        iconClass:
          "bg-emerald-500/10 text-emerald-500 ring-emerald-400/20",
      },
      {
        label: "Money collected",
        helper: "Real payments recorded this month",
        value: formatMoney(
          data.summary.moneyCollectedThisMonth,
        ),
        icon: CircleDollarSign,
        iconClass:
          "bg-amber-500/10 text-amber-500 ring-amber-400/20",
      },
    ];
  }, [data]);

  const needsAttention = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.cafes
      .filter(
        (cafe) =>
          cafe.operations.needsAttention,
      )
      .sort((a, b) => {
        const priority: Record<
          AttentionReason,
          number
        > = {
          SUSPENDED: 1,
          PAST_DUE: 2,
          MISSING_OWNER: 3,
          TRIAL_ENDING_SOON: 4,
          NO_ACTIVITY_30D: 5,
        };

        const first =
          a.operations.attentionReasons[0];

        const second =
          b.operations.attentionReasons[0];

        return (
          (priority[first] ?? 99) -
          (priority[second] ?? 99)
        );
      });
  }, [data]);

  const filteredCafes = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    const cafes = data.cafes.filter((cafe) => {
      const effectiveStatus =
        getEffectiveStatus(cafe);

      const matchesStatus =
        statusFilter === "ALL" ||
        effectiveStatus === statusFilter;

      const searchableContent = [
        cafe.name,
        cafe.slug,
        cafe.businessType,
        cafe.user?.name,
        cafe.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(
          normalizedSearch,
        );

      return matchesStatus && matchesSearch;
    });

    return [...cafes].sort(
      (firstCafe, secondCafe) => {
        if (sortOption === "OLDEST") {
          return (
            new Date(
              firstCafe.createdAt,
            ).getTime() -
            new Date(
              secondCafe.createdAt,
            ).getTime()
          );
        }

        if (sortOption === "NAME") {
          return firstCafe.name.localeCompare(
            secondCafe.name,
          );
        }

        if (sortOption === "MEMBERS") {
          return (
            secondCafe._count.customers -
            firstCafe._count.customers
          );
        }

        if (sortOption === "ACTIVITY") {
          return (
            secondCafe.operations
              .loyaltyEventsLast30Days -
            firstCafe.operations
              .loyaltyEventsLast30Days
          );
        }

        return (
          new Date(
            secondCafe.createdAt,
          ).getTime() -
          new Date(
            firstCafe.createdAt,
          ).getTime()
        );
      },
    );
  }, [
    data,
    searchQuery,
    sortOption,
    statusFilter,
  ]);

  const hasFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "ALL";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
  }

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.09] bg-black/[0.025]">
            <LoaderCircle
              size={25}
              className="animate-spin text-slate-600"
            />
          </div>

          <p className="mt-5 text-sm font-medium text-[#343438]">
            Loading BeLoyal Studio
          </p>

          <p className="mt-1 text-xs text-[#8A8A91]">
            Preparing your platform data...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/[0.06] p-10 text-center">
        <TriangleAlert
          size={29}
          className="mx-auto text-red-500"
        />

        <p className="mt-4 font-medium text-red-700">
          Studio could not load
        </p>

        <p className="mt-2 text-sm text-red-600">
          {error || "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() => loadData(true)}
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-500/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-[34px] bg-[#F3F4F6] p-3 text-[#171719] sm:p-5">
      <section className="relative overflow-hidden rounded-[30px] border border-black/[0.09] bg-gradient-to-br from-white via-[#FAFAFA] to-[#F1F2F4] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-zinc-200/40 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68686F]">
                Platform overview
              </p>
            </div>

            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-[#171719] sm:text-3xl">
              Everything across BeLoyal,
              <span className="text-[#68686F]">
                {" "}
                controlled from one place.
              </span>
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#68686F]">
              See how businesses and customers are
              actually using BeLoyal across the
              platform.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.10] bg-black/[0.025] px-4 text-sm font-medium text-[#343438] transition hover:border-black/[0.16] hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing"
                : "Refresh data"}
            </button>

            <CreateCafeDialog
              onCreated={() => loadData(true)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="group rounded-[24px] border border-black/[0.08] bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-black/[0.14] hover:bg-[#F8F8F9]"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${card.iconClass}`}
                >
                  <Icon size={19} />
                </div>

                <Activity
                  size={16}
                  className="text-[#B4B4BA] transition group-hover:text-[#68686F]"
                />
              </div>

              <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-[#171719]">
                {card.value}
              </p>

              <p className="mt-2 text-sm font-medium text-[#343438]">
                {card.label}
              </p>

              <p className="mt-1 text-xs text-[#8A8A91]">
                {card.helper}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <article className="rounded-[28px] border border-black/[0.08] bg-white/90 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#8A8A91]">
                Needs attention
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171719]">
                Things you should check
              </h2>

              <p className="mt-2 text-sm text-[#68686F]">
                Businesses with subscription,
                setup, or activity problems.
              </p>
            </div>

            <div className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-[#F7F7F8] px-3">
              <span className="text-sm font-semibold text-[#343438]">
                {data.summary.needsAttentionBusinesses}
              </span>
            </div>
          </div>

          {needsAttention.length === 0 ? (
            <div className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Everything looks good
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-600/80">
                    No businesses currently need
                    your attention.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {needsAttention.map((cafe) => {
                const primaryReason =
                  cafe.operations.attentionReasons[0];

                const styles =
                  getAttentionStyles(primaryReason);

                return (
                  <Link
                    key={cafe.id}
                    href={`/studio/cafes/${cafe.id}`}
                    className={`group block rounded-[20px] border p-4 transition ${styles.wrapper}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                        >
                          <TriangleAlert size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#171719]">
                            {cafe.name}
                          </p>

                          <p
                            className={`mt-1 text-xs font-medium ${styles.label}`}
                          >
                            {getAttentionLabel(
                              primaryReason,
                            )}
                          </p>

                          {cafe.operations.attentionReasons
                            .length > 1 && (
                            <p className="mt-1 text-[11px] text-[#8A8A91]">
                              +
                              {cafe.operations
                                .attentionReasons.length -
                                1}{" "}
                              more issue
                              {cafe.operations
                                .attentionReasons.length -
                                1 ===
                              1
                                ? ""
                                : "s"}
                            </p>
                          )}

                          <p
                            className={`mt-2 text-[11px] ${styles.helper}`}
                          >
                            {formatLastActivity(
                              cafe.operations
                                .lastActivityAt,
                            )}
                          </p>
                        </div>
                      </div>

                      <ArrowUpRight
                        size={16}
                        className="mt-1 shrink-0 text-[#A0A0A7] transition group-hover:text-[#343438]"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-[28px] border border-black/[0.08] bg-white/90 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#8A8A91]">
            BeLoyal activity
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171719]">
            Platform usage this month
          </h2>

          <p className="mt-2 text-sm text-[#68686F]">
            A quick view of real customer and
            loyalty usage.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between rounded-[18px] border border-black/[0.07] bg-[#F7F7F8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <UserPlus size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#343438]">
                    New memberships
                  </p>
                  <p className="text-xs text-[#8A8A91]">
                    This month
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-[#171719]">
                {formatCompactNumber(
                  data.summary
                    .newMembersThisMonth,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-black/[0.07] bg-[#F7F7F8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <UserCheck size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#343438]">
                    Active members
                  </p>
                  <p className="text-xs text-[#8A8A91]">
                    Used BeLoyal this month
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-[#171719]">
                {formatCompactNumber(
                  data.summary
                    .activeMembersThisMonth,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-black/[0.07] bg-[#F7F7F8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Gift size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#343438]">
                    Rewards redeemed
                  </p>
                  <p className="text-xs text-[#8A8A91]">
                    This month
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-[#171719]">
                {formatCompactNumber(
                  data.summary
                    .rewardsRedeemedThisMonth,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-black/[0.07] bg-[#F7F7F8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                  <Sparkles size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#343438]">
                    Active businesses
                  </p>
                  <p className="text-xs text-[#8A8A91]">
                    Recorded activity this month
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-[#171719]">
                {formatCompactNumber(
                  data.summary
                    .activeBusinessesThisMonth,
                )}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/90">
        <header className="border-b border-black/[0.08] p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#8A8A91]">
                Business directory
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#171719]">
                All business accounts
              </h2>

              <p className="mt-2 text-sm text-[#68686F]">
                Search, inspect, and manage every
                business using BeLoyal.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 lg:w-[290px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A91]"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search business, owner, or email"
                  className="h-11 w-full rounded-xl border border-black/[0.09] bg-[#F7F7F8] pl-10 pr-10 text-sm text-[#171719] outline-none transition placeholder:text-[#A0A0A7] focus:border-slate-400 focus:ring-2 focus:ring-slate-300/40"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery("")
                    }
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A91] transition hover:text-[#343438]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-black/[0.09] bg-[#F7F7F8] pl-4 pr-10 text-sm text-[#343438] outline-none transition focus:border-slate-400 lg:w-[155px]"
                >
                  <option value="ALL">
                    All statuses
                  </option>
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="TRIAL">
                    Trial
                  </option>
                  <option value="PAST_DUE">
                    Past due
                  </option>
                  <option value="SUSPENDED">
                    Suspended
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8A91]"
                />
              </div>

              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(event) =>
                    setSortOption(
                      event.target
                        .value as SortOption,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-black/[0.09] bg-[#F7F7F8] pl-4 pr-10 text-sm text-[#343438] outline-none transition focus:border-slate-400 lg:w-[165px]"
                >
                  <option value="NEWEST">
                    Newest first
                  </option>
                  <option value="OLDEST">
                    Oldest first
                  </option>
                  <option value="NAME">
                    Name A–Z
                  </option>
                  <option value="MEMBERS">
                    Most members
                  </option>
                  <option value="ACTIVITY">
                    Most activity
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8A91]"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] pt-4">
            <p className="text-xs text-[#8A8A91]">
              Showing{" "}
              <span className="font-medium text-[#343438]">
                {filteredCafes.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#343438]">
                {data.cafes.length}
              </span>{" "}
              businesses
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-700"
              >
                <X size={13} />
                Clear filters
              </button>
            )}
          </div>
        </header>

        {data.cafes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.02]">
              <Coffee
                size={24}
                className="text-[#8A8A91]"
              />
            </div>

            <p className="mt-5 font-medium text-[#343438]">
              No businesses yet
            </p>

            <p className="mt-2 text-sm text-[#8A8A91]">
              Create your first business account to
              begin.
            </p>
          </div>
        ) : filteredCafes.length === 0 ? (
          <div className="p-16 text-center">
            <Search
              size={27}
              className="mx-auto text-[#8A8A91]"
            />

            <p className="mt-4 font-medium text-[#343438]">
              No matching businesses
            </p>

            <p className="mt-2 text-sm text-[#8A8A91]">
              Try changing your search or status
              filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 text-sm font-medium text-slate-600 transition hover:text-slate-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {filteredCafes.map((cafe) => (
              <article
                key={cafe.id}
                className="group p-5 transition duration-200 hover:bg-black/[0.018] sm:p-6"
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(230px,1.2fr)_minmax(520px,2fr)_auto] xl:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-sm font-semibold shadow-lg"
                      style={{
                        width: "52px",
                        height: "52px",
                        borderColor: `${cafe.primaryColor}55`,
                        backgroundColor: `${cafe.primaryColor}22`,
                        color: cafe.secondaryColor,
                      }}
                    >
                      {cafe.logoUrl ? (
                        <img
                          src={cafe.logoUrl}
                          alt={`${cafe.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        cafe.name
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate font-semibold text-[#171719]">
                          {cafe.name}
                        </h3>

                        <span className="shrink-0 rounded-full border border-black/[0.07] bg-[#F3F4F6] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#77777E]">
                          {cafe.businessType ===
                          "BARBERSHOP"
                            ? "Barber"
                            : "Café"}
                        </span>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${getStatusStyles(
                            cafe.subscriptionStatus,
                            cafe.isActive,
                          )}`}
                        >
                          {getStatusLabel(
                            cafe.subscriptionStatus,
                            cafe.isActive,
                          )}
                        </span>
                      </div>

                      <p className="mt-1.5 truncate text-sm text-[#68686F]">
                        {cafe.user?.email ||
                          "No owner account"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#A0A0A7]">
                        beloyal.app/{cafe.slug}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#A0A0A7]">
                        Members
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#343438]">
                        <Users
                          size={14}
                          className="text-[#8A8A91]"
                        />

                        {formatCompactNumber(
                          cafe._count.customers,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#A0A0A7]">
                        New this month
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#343438]">
                        <UserPlus
                          size={14}
                          className="text-emerald-500"
                        />

                        +
                        {formatCompactNumber(
                          cafe.newCustomersThisMonth,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#A0A0A7]">
                        Last 30 days
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#343438]">
                        <Activity
                          size={14}
                          className="text-violet-500"
                        />

                        {formatCompactNumber(
                          cafe.operations
                            .loyaltyEventsLast30Days,
                        )}
                      </p>

                      <p className="mt-1 text-[11px] text-[#A0A0A7]">
                        {formatLastActivity(
                          cafe.operations
                            .lastActivityAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#A0A0A7]">
                        Expiry
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#343438]">
                        <Clock3
                          size={14}
                          className="text-[#8A8A91]"
                        />

                        {formatDate(
                          cafe.subscriptionStatus ===
                            "TRIAL"
                            ? cafe.trialEndsAt
                            : cafe.subscriptionEndsAt,
                        )}
                      </p>

                      <p className="mt-1 text-[11px] text-[#A0A0A7]">
                        {getExpiryText(cafe)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center xl:justify-end">
                    <Link
                      href={`/studio/cafes/${cafe.id}`}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/[0.10] bg-black/[0.025] px-4 text-sm font-medium text-[#343438] transition hover:border-slate-400 hover:bg-slate-100 hover:text-[#171719] xl:w-auto"
                    >
                      Manage
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}