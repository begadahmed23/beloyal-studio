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
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coffee,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import CreateCafeDialog from "@/components/studio/CreateCafeDialog";

type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED";

type Cafe = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;

  rewardTarget: number;
  rewardName: string;

  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  lastPaymentAt: string | null;

  monthlyPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  user: {
    id: string;
    name: string;
    email: string;
  } | null;

  _count: {
    customers: number;
    transactions: number;
  };
};

type Summary = {
  totalCafes: number;
  activeCafes: number;
  trialCafes: number;
  suspendedCafes: number;
  pastDueCafes: number;
  monthlyRevenue: number;
  expectedRevenue: number;
};

type ApiResponse = {
  cafes: Cafe[];
  summary: Summary;
};

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
  | "REVENUE";

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

function getDaysUntil(value: string | null) {
  if (!value) {
    return null;
  }

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const difference = target.getTime() - Date.now();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
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

function getEffectiveStatus(cafe: Cafe): SubscriptionStatus {
  if (!cafe.isActive || cafe.subscriptionStatus === "SUSPENDED") {
    return "SUSPENDED";
  }

  return cafe.subscriptionStatus;
}

function getStatusStyles(
  status: SubscriptionStatus,
  isActive: boolean,
) {
  if (!isActive || status === "SUSPENDED") {
    return "border-red-400/20 bg-red-400/[0.08] text-red-300";
  }

  if (status === "ACTIVE") {
    return "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300";
  }

  if (status === "TRIAL") {
    return "border-amber-400/20 bg-amber-400/[0.08] text-amber-200";
  }

  if (status === "PAST_DUE") {
    return "border-orange-400/20 bg-orange-400/[0.08] text-orange-300";
  }

  return "border-white/[0.08] bg-white/[0.04] text-[#8E8E93]";
}

function getExpiryText(cafe: Cafe) {
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

export default function StudioDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
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

        const response = await fetch("/api/studio/cafes", {
          cache: "no-store",
        });

        const responseText = await response.text();

        let responseData: Partial<ApiResponse> & {
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
            responseData.message || "Failed to load Studio.",
          );
        }

        setData(responseData as ApiResponse);
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

  const platformStats = useMemo(() => {
    if (!data) {
      return {
        totalMembers: 0,
        totalTransactions: 0,
        conversionRate: 0,
        revenueGap: 0,
      };
    }

    const totalMembers = data.cafes.reduce(
      (total, cafe) => total + cafe._count.customers,
      0,
    );

    const totalTransactions = data.cafes.reduce(
      (total, cafe) => total + cafe._count.transactions,
      0,
    );

    const conversionRate =
      data.summary.totalCafes > 0
        ? Math.round(
            (data.summary.activeCafes /
              data.summary.totalCafes) *
              100,
          )
        : 0;

    return {
      totalMembers,
      totalTransactions,
      conversionRate,
      revenueGap: Math.max(
        data.summary.expectedRevenue -
          data.summary.monthlyRevenue,
        0,
      ),
    };
  }, [data]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Total cafés",
        helper: `${data.summary.trialCafes} currently on trial`,
        value: formatCompactNumber(data.summary.totalCafes),
        icon: Building2,
        iconClass:
          "bg-violet-500/10 text-violet-300 ring-violet-400/20",
      },
      {
        label: "Active cafés",
        helper: `${platformStats.conversionRate}% of all accounts`,
        value: formatCompactNumber(data.summary.activeCafes),
        icon: ShieldCheck,
        iconClass:
          "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
      },
      {
        label: "Total members",
        helper: "Across the entire platform",
        value: formatCompactNumber(platformStats.totalMembers),
        icon: Users,
        iconClass:
          "bg-blue-500/10 text-blue-300 ring-blue-400/20",
      },
      {
        label: "Monthly revenue",
        helper: `${formatMoney(
          data.summary.expectedRevenue,
        )} potential`,
        value: formatMoney(data.summary.monthlyRevenue),
        icon: CircleDollarSign,
        iconClass:
          "bg-amber-500/10 text-amber-300 ring-amber-400/20",
      },
    ];
  }, [data, platformStats]);

  const filteredCafes = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    const cafes = data.cafes.filter((cafe) => {
      const effectiveStatus = getEffectiveStatus(cafe);

      const matchesStatus =
        statusFilter === "ALL" ||
        effectiveStatus === statusFilter;

      const searchableContent = [
        cafe.name,
        cafe.slug,
        cafe.user?.name,
        cafe.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });

    return [...cafes].sort((firstCafe, secondCafe) => {
      if (sortOption === "OLDEST") {
        return (
          new Date(firstCafe.createdAt).getTime() -
          new Date(secondCafe.createdAt).getTime()
        );
      }

      if (sortOption === "NAME") {
        return firstCafe.name.localeCompare(secondCafe.name);
      }

      if (sortOption === "MEMBERS") {
        return (
          secondCafe._count.customers -
          firstCafe._count.customers
        );
      }

      if (sortOption === "REVENUE") {
        return (
          secondCafe.monthlyPrice - firstCafe.monthlyPrice
        );
      }

      return (
        new Date(secondCafe.createdAt).getTime() -
        new Date(firstCafe.createdAt).getTime()
      );
    });
  }, [data, searchQuery, sortOption, statusFilter]);

  const hasFilters =
    searchQuery.trim().length > 0 || statusFilter !== "ALL";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
  }

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
            <LoaderCircle
              size={25}
              className="animate-spin text-violet-300"
            />
          </div>

          <p className="mt-5 text-sm font-medium text-[#D1D1D6]">
            Loading BeLoyal Studio
          </p>

          <p className="mt-1 text-xs text-[#6E6E73]">
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
          className="mx-auto text-red-300"
        />

        <p className="mt-4 font-medium text-red-200">
          Studio could not load
        </p>

        <p className="mt-2 text-sm text-red-200/70">
          {error || "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() => loadData(true)}
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#111217] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/[0.10] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/[0.06] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8E8E93]">
                Platform overview
              </p>
            </div>

            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-[#F5F5F7] sm:text-3xl">
              Everything across BeLoyal,
              <span className="text-[#8E8E93]">
                {" "}
                controlled from one place.
              </span>
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#8E8E93]">
              Monitor café accounts, subscriptions, members,
              activity, and platform revenue.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 text-sm font-medium text-[#D1D1D6] transition hover:border-white/[0.14] hover:bg-white/[0.075] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing" : "Refresh data"}
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
              className="group rounded-[24px] border border-white/[0.07] bg-[#14151A] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-[#17181E]"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${card.iconClass}`}
                >
                  <Icon size={19} />
                </div>

                <Activity
                  size={16}
                  className="text-[#48484A] transition group-hover:text-[#8E8E93]"
                />
              </div>

              <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-[#F5F5F7]">
                {card.value}
              </p>

              <p className="mt-2 text-sm font-medium text-[#D1D1D6]">
                {card.label}
              </p>

              <p className="mt-1 text-xs text-[#6E6E73]">
                {card.helper}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-[28px] border border-white/[0.07] bg-[#14151A] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#6E6E73]">
                Financial overview
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">
                Subscription revenue
              </h2>

              <p className="mt-2 text-sm text-[#8E8E93]">
                Confirmed income compared with your potential
                monthly value.
              </p>
            </div>

            <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 text-xs font-medium text-emerald-300">
              <TrendingUp size={14} />
              Live totals
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-white/[0.06] bg-[#0E0F13] p-5">
              <CircleDollarSign
                size={18}
                className="text-emerald-300"
              />

              <p className="mt-4 text-xs text-[#6E6E73]">
                Confirmed revenue
              </p>

              <p className="mt-2 text-xl font-semibold text-[#F5F5F7]">
                {formatMoney(data.summary.monthlyRevenue)}
              </p>
            </div>

            <div className="rounded-[20px] border border-white/[0.06] bg-[#0E0F13] p-5">
              <CreditCard
                size={18}
                className="text-violet-300"
              />

              <p className="mt-4 text-xs text-[#6E6E73]">
                Potential revenue
              </p>

              <p className="mt-2 text-xl font-semibold text-[#F5F5F7]">
                {formatMoney(data.summary.expectedRevenue)}
              </p>
            </div>

            <div className="rounded-[20px] border border-white/[0.06] bg-[#0E0F13] p-5">
              <TriangleAlert
                size={18}
                className="text-orange-300"
              />

              <p className="mt-4 text-xs text-[#6E6E73]">
                Unconfirmed value
              </p>

              <p className="mt-2 text-xl font-semibold text-[#F5F5F7]">
                {formatMoney(platformStats.revenueGap)}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E8E93]">
                Revenue realization
              </span>

              <span className="font-medium text-[#D1D1D6]">
                {data.summary.expectedRevenue > 0
                  ? Math.min(
                      Math.round(
                        (data.summary.monthlyRevenue /
                          data.summary.expectedRevenue) *
                          100,
                      ),
                      100,
                    )
                  : 0}
                %
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400"
                style={{
                  width: `${
                    data.summary.expectedRevenue > 0
                      ? Math.min(
                          (data.summary.monthlyRevenue /
                            data.summary.expectedRevenue) *
                            100,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/[0.07] bg-[#14151A] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#6E6E73]">
            Platform health
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">
            Accounts requiring attention
          </h2>

          <p className="mt-2 text-sm text-[#8E8E93]">
            Subscription and access issues across all cafés.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => setStatusFilter("PAST_DUE")}
              className="flex w-full items-center justify-between rounded-[18px] border border-orange-400/15 bg-orange-400/[0.05] p-4 text-left transition hover:bg-orange-400/[0.09]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300">
                  <Clock3 size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-orange-200">
                    Past due
                  </p>

                  <p className="mt-0.5 text-xs text-orange-200/50">
                    Payment action required
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-orange-300">
                {data.summary.pastDueCafes}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("SUSPENDED")}
              className="flex w-full items-center justify-between rounded-[18px] border border-red-400/15 bg-red-400/[0.05] p-4 text-left transition hover:bg-red-400/[0.09]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                  <TriangleAlert size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-red-200">
                    Suspended
                  </p>

                  <p className="mt-0.5 text-xs text-red-200/50">
                    Café access disabled
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-red-300">
                {data.summary.suspendedCafes}
              </span>
            </button>

            <div className="flex items-center justify-between rounded-[18px] border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <CheckCircle2 size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-emerald-200">
                    Healthy accounts
                  </p>

                  <p className="mt-0.5 text-xs text-emerald-200/50">
                    Active and operational
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold text-emerald-300">
                {data.summary.activeCafes}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#14151A]">
        <header className="border-b border-white/[0.07] p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#6E6E73]">
                Café directory
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">
                All café accounts
              </h2>

              <p className="mt-2 text-sm text-[#8E8E93]">
                Search, inspect, and manage every café on
                BeLoyal.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 lg:w-[290px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search café, owner, or email"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0E0F13] pl-10 pr-10 text-sm text-[#F5F5F7] outline-none transition placeholder:text-[#55555A] focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/10"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] transition hover:text-[#D1D1D6]"
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
                      event.target.value as StatusFilter,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0E0F13] pl-4 pr-10 text-sm text-[#D1D1D6] outline-none transition focus:border-violet-400/40 lg:w-[155px]"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="PAST_DUE">Past due</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                />
              </div>

              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(event) =>
                    setSortOption(
                      event.target.value as SortOption,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0E0F13] pl-4 pr-10 text-sm text-[#D1D1D6] outline-none transition focus:border-violet-400/40 lg:w-[155px]"
                >
                  <option value="NEWEST">Newest first</option>
                  <option value="OLDEST">Oldest first</option>
                  <option value="NAME">Name A–Z</option>
                  <option value="MEMBERS">Most members</option>
                  <option value="REVENUE">Highest price</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <p className="text-xs text-[#6E6E73]">
              Showing{" "}
              <span className="font-medium text-[#D1D1D6]">
                {filteredCafes.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#D1D1D6]">
                {data.cafes.length}
              </span>{" "}
              cafés
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-300 transition hover:text-violet-200"
              >
                <X size={13} />
                Clear filters
              </button>
            )}
          </div>
        </header>

        {data.cafes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035]">
              <Coffee size={24} className="text-[#6E6E73]" />
            </div>

            <p className="mt-5 font-medium text-[#D1D1D6]">
              No cafés yet
            </p>

            <p className="mt-2 text-sm text-[#6E6E73]">
              Create your first café account to begin.
            </p>
          </div>
        ) : filteredCafes.length === 0 ? (
          <div className="p-16 text-center">
            <Search
              size={27}
              className="mx-auto text-[#6E6E73]"
            />

            <p className="mt-4 font-medium text-[#D1D1D6]">
              No matching cafés
            </p>

            <p className="mt-2 text-sm text-[#6E6E73]">
              Try changing your search or status filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 text-sm font-medium text-violet-300 transition hover:text-violet-200"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredCafes.map((cafe) => (
              <article
                key={cafe.id}
                className="group p-5 transition duration-200 hover:bg-white/[0.018] sm:p-6"
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(230px,1.2fr)_minmax(520px,2fr)_auto] xl:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-sm font-semibold shadow-lg"
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
                        cafe.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate font-semibold text-[#F5F5F7]">
                          {cafe.name}
                        </h3>

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

                      <p className="mt-1.5 truncate text-sm text-[#8E8E93]">
                        {cafe.user?.email || "No owner account"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#55555A]">
                        beloyal.app/{cafe.slug}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#55555A]">
                        Members
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#D1D1D6]">
                        <Users
                          size={14}
                          className="text-[#6E6E73]"
                        />
                        {formatCompactNumber(
                          cafe._count.customers,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#55555A]">
                        Activity
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#D1D1D6]">
                        <Activity
                          size={14}
                          className="text-[#6E6E73]"
                        />
                        {formatCompactNumber(
                          cafe._count.transactions,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#55555A]">
                        Monthly price
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#D1D1D6]">
                        <CircleDollarSign
                          size={14}
                          className="text-[#6E6E73]"
                        />
                        {formatMoney(cafe.monthlyPrice)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#55555A]">
                        Expiry
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#D1D1D6]">
                        <CalendarDays
                          size={14}
                          className="text-[#6E6E73]"
                        />
                        {formatDate(
                          cafe.subscriptionStatus === "TRIAL"
                            ? cafe.trialEndsAt
                            : cafe.subscriptionEndsAt,
                        )}
                      </p>

                      <p className="mt-1 text-[11px] text-[#55555A]">
                        {getExpiryText(cafe)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center xl:justify-end">
                    <Link
                      href={`/studio/cafes/${cafe.id}`}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 text-sm font-medium text-[#D1D1D6] transition hover:border-violet-400/30 hover:bg-violet-400/[0.08] hover:text-white xl:w-auto"
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