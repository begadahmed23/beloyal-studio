"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Coffee,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";

import CreateCafeDialog from "@/components/studio/CreateCafeDialog";

type SubscriptionStatus =
  "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: SubscriptionStatus, isActive: boolean) {
  if (!isActive || status === "SUSPENDED") {
    return "SUSPENDED";
  }

  if (status === "PAST_DUE") {
    return "PAST DUE";
  }

  return status;
}

function getStatusStyles(status: SubscriptionStatus, isActive: boolean) {
  if (!isActive || status === "SUSPENDED") {
    return "border-red-500/20 bg-red-500/[0.08] text-red-300";
  }

  if (status === "ACTIVE") {
    return "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300";
  }

  if (status === "TRIAL") {
    return "border-amber-500/20 bg-amber-500/[0.08] text-amber-200";
  }

  if (status === "PAST_DUE") {
    return "border-orange-500/20 bg-orange-500/[0.08] text-orange-300";
  }

  return "border-white/[0.08] bg-white/[0.04] text-[#8E8E93]";
}

export default function StudioDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (showRefreshing = false) => {
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
          throw new Error("Studio returned an invalid response.");
        }
      }

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to load Studio.");
      }

      setData(responseData as ApiResponse);
    } catch (error) {
      console.error("Studio load error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load Studio.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Total cafés",
        helper: "All onboarded cafés",
        value: data.summary.totalCafes,
        icon: Building2,
      },
      {
        label: "Active cafés",
        helper: "Currently subscribed",
        value: data.summary.activeCafes,
        icon: ShieldCheck,
      },
      {
        label: "Free trials",
        helper: "Currently testing",
        value: data.summary.trialCafes,
        icon: Clock3,
      },
      {
        label: "Monthly revenue",
        helper: "Confirmed payments",
        value: formatMoney(data.summary.monthlyRevenue),
        icon: CircleDollarSign,
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[440px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin text-[#F5F5F7]"
          />

          <p className="mt-4 text-sm text-[#8E8E93]">Loading Studio...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/[0.06] p-8 text-center">
        <TriangleAlert size={28} className="mx-auto text-red-300" />

        <p className="mt-4 font-medium text-red-200">Studio could not load</p>

        <p className="mt-2 text-sm text-red-200/70">
          {error || "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={() => loadData(true)}
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-[26px] border border-white/[0.07] bg-[#141416] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#1C1C1E] text-[#F5F5F7]">
                  <Icon size={20} />
                </div>

                <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[11px] font-medium text-[#8E8E93]">
                  Live
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight text-[#F5F5F7]">
                {card.value}
              </p>

              <p className="mt-2 text-sm font-medium text-[#D1D1D6]">
                {card.label}
              </p>

              <p className="mt-1 text-xs text-[#6E6E73]">{card.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[28px] border border-white/[0.07] bg-[#141416] p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8E8E93]">
                Revenue
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">
                Subscription income
              </h2>

              <p className="mt-2 text-sm text-[#8E8E93]">
                Confirmed payments and potential monthly value.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm font-medium text-[#D1D1D6] transition hover:bg-[#242426] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/[0.06] bg-[#0D0D0F] p-5">
              <p className="text-sm text-[#8E8E93]">Current monthly revenue</p>

              <p className="mt-3 text-2xl font-semibold text-[#F5F5F7]">
                {formatMoney(data.summary.monthlyRevenue)}
              </p>

              <p className="mt-2 text-xs text-[#6E6E73]">
                Only confirmed active subscriptions.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/[0.06] bg-[#0D0D0F] p-5">
              <p className="text-sm text-[#8E8E93]">Expected monthly revenue</p>

              <p className="mt-3 text-2xl font-semibold text-[#F5F5F7]">
                {formatMoney(data.summary.expectedRevenue)}
              </p>

              <p className="mt-2 text-xs text-[#6E6E73]">
                Based on configured café prices.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/[0.07] bg-[#141416] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8E8E93]">
            Attention
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">
            Accounts needing action
          </h2>

          <p className="mt-2 text-sm text-[#8E8E93]">
            Renewals and suspended café accounts.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-[18px] border border-orange-500/15 bg-orange-500/[0.05] p-4">
              <span className="text-sm text-orange-200/80">Past due</span>

              <span className="font-semibold text-orange-300">
                {data.summary.pastDueCafes}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-red-500/15 bg-red-500/[0.05] p-4">
              <span className="text-sm text-red-200/80">Suspended</span>

              <span className="font-semibold text-red-300">
                {data.summary.suspendedCafes}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#141416]">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8E8E93]">
              Café management
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">
              All cafés
            </h2>

            <p className="mt-2 text-sm text-[#8E8E93]">
              Review members, pricing, dates, and subscriptions.
            </p>
          </div>

          <CreateCafeDialog onCreated={() => loadData(true)} />
        </header>

        {data.cafes.length === 0 ? (
          <div className="p-14 text-center">
            <Coffee size={31} className="mx-auto text-[#6E6E73]" />

            <p className="mt-4 font-medium text-[#D1D1D6]">No cafés yet</p>

            <p className="mt-2 text-sm text-[#6E6E73]">
              Create your first café account to begin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {data.cafes.map((cafe) => (
              <article
                key={cafe.id}
                className="p-5 transition hover:bg-white/[0.018]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-sm font-semibold"
                      style={{
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
                      <h3 className="truncate font-semibold text-[#F5F5F7]">
                        {cafe.name}
                      </h3>

                      <p className="mt-1 truncate text-sm text-[#8E8E93]">
                        {cafe.user?.email || "No login account"}
                      </p>

                      <p className="mt-1 text-xs text-[#6E6E73]">
                        /{cafe.slug}
                      </p>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:max-w-4xl">
                    <div>
                      <p className="text-xs text-[#6E6E73]">Members</p>

                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#D1D1D6]">
                        <Users size={14} />
                        {cafe._count.customers}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#6E6E73]">Started</p>

                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#D1D1D6]">
                        <CalendarDays size={14} />
                        {formatDate(cafe.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#6E6E73]">Next expiry</p>

                      <p className="mt-1 text-sm font-medium text-[#D1D1D6]">
                        {formatDate(
                          cafe.subscriptionStatus === "TRIAL"
                            ? cafe.trialEndsAt
                            : cafe.subscriptionEndsAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#6E6E73]">Monthly price</p>

                      <p className="mt-1 text-sm font-medium text-[#D1D1D6]">
                        {formatMoney(cafe.monthlyPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 xl:justify-end">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyles(
                        cafe.subscriptionStatus,
                        cafe.isActive,
                      )}`}
                    >
                      {getStatusLabel(cafe.subscriptionStatus, cafe.isActive)}
                    </span>

      <Link
  href={`/studio/cafes/${cafe.id}`}
  className="rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 py-2 text-sm font-medium text-[#D1D1D6] transition hover:bg-[#242426]"
>
  Manage
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
