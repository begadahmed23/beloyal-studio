"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cake,
  Download,
  Filter,
  LoaderCircle,
  Search,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Customer = {
  id: string;
  memberNumber: string;
  name: string;
  phone: string | null;
  instagram: string | null;
  birthday: string;
  stamps: number;
  rewardEarnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalVisits: number;
  rewardsRedeemed: number;
  lastVisitAt: string | null;
};

type ApiResponse = {
  cafe: {
    name: string;
    rewardTarget: number;
  };
  customers: Customer[];
};

type BirthdayFilter =
  | "all"
  | "today"
  | "next7"
  | "thisMonth";

type ActivityFilter =
  | "all"
  | "active30"
  | "inactive7"
  | "inactive14"
  | "inactive21"
  | "inactive30"
  | "neverReturned";

type ContactFilter =
  | "all"
  | "phone"
  | "instagram";

function daysSince(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor(
    (Date.now() - date.getTime()) / 86_400_000,
  );
}

function birthdayDistance(value: string) {
  const birthday = new Date(value);

  if (Number.isNaN(birthday.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  let next = new Date(
    today.getFullYear(),
    birthday.getUTCMonth(),
    birthday.getUTCDate(),
  );

  if (next < today) {
    next = new Date(
      today.getFullYear() + 1,
      birthday.getUTCMonth(),
      birthday.getUTCDate(),
    );
  }

  return Math.round(
    (next.getTime() - today.getTime()) /
      86_400_000,
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";

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

export default function AdminCustomerDatabase() {
  const { theme } = useCafeTheme();

  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [birthdayFilter, setBirthdayFilter] =
    useState<BirthdayFilter>("all");

  const [activityFilter, setActivityFilter] =
    useState<ActivityFilter>("all");

  const [contactFilter, setContactFilter] =
    useState<ContactFilter>("all");

  const [rewardReadyOnly, setRewardReadyOnly] =
    useState(false);

  const [highFrequencyOnly, setHighFrequencyOnly] =
    useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/customers",
        {
          cache: "no-store",
        },
      );

      const body = (await response.json()) as
        | ApiResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in body && body.message
            ? body.message
            : "Failed to load customer database.",
        );
      }

      setData(body as ApiResponse);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customer database.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const value = search.trim().toLowerCase();

    return data.customers.filter((customer) => {
      const matchesSearch =
        !value ||
        customer.name.toLowerCase().includes(value) ||
        customer.memberNumber
          .toLowerCase()
          .includes(value) ||
        customer.phone?.includes(value) ||
        customer.instagram
          ?.toLowerCase()
          .includes(value);

      if (!matchesSearch) return false;

      const birthdayDays =
        birthdayDistance(customer.birthday);

      if (
        birthdayFilter === "today" &&
        birthdayDays !== 0
      ) {
        return false;
      }

      if (
        birthdayFilter === "next7" &&
        (birthdayDays < 0 || birthdayDays > 7)
      ) {
        return false;
      }

      if (birthdayFilter === "thisMonth") {
        const birthday = new Date(customer.birthday);

        if (
          Number.isNaN(birthday.getTime()) ||
          birthday.getUTCMonth() !==
            now.getMonth()
        ) {
          return false;
        }
      }

      const inactiveDays =
        daysSince(customer.lastVisitAt);

      if (
        activityFilter === "active30" &&
        inactiveDays > 30
      ) {
        return false;
      }

      if (
        activityFilter === "inactive7" &&
        inactiveDays < 7
      ) {
        return false;
      }

      if (
        activityFilter === "inactive14" &&
        inactiveDays < 14
      ) {
        return false;
      }

      if (
        activityFilter === "inactive21" &&
        inactiveDays < 21
      ) {
        return false;
      }

      if (
        activityFilter === "inactive30" &&
        inactiveDays < 30
      ) {
        return false;
      }

      if (
        activityFilter === "neverReturned" &&
        customer.totalVisits > 1
      ) {
        return false;
      }

      if (
        contactFilter === "phone" &&
        !customer.phone
      ) {
        return false;
      }

      if (
        contactFilter === "instagram" &&
        !customer.instagram
      ) {
        return false;
      }

      if (
        rewardReadyOnly &&
        !customer.rewardEarnedAt &&
        customer.stamps <
          data.cafe.rewardTarget
      ) {
        return false;
      }

      if (
        highFrequencyOnly &&
        customer.totalVisits < 5
      ) {
        return false;
      }

      return true;
    });
  }, [
    data,
    search,
    birthdayFilter,
    activityFilter,
    contactFilter,
    rewardReadyOnly,
    highFrequencyOnly,
  ]);

  function exportFiltered() {
    const ids = filteredCustomers
      .map((customer) => customer.id)
      .join(",");

    const href = ids
      ? `/api/admin/customers/export?ids=${encodeURIComponent(
          ids,
        )}`
      : "/api/admin/customers/export?ids=__none__";

    window.location.href = href;
  }

  function resetFilters() {
    setSearch("");
    setBirthdayFilter("all");
    setActivityFilter("all");
    setContactFilter("all");
    setRewardReadyOnly(false);
    setHighFrequencyOnly(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin"
            size={28}
            style={{ color: theme.accent }}
          />
          <p
            className="mt-3 text-sm"
            style={{ color: theme.textMuted }}
          >
            Loading customer database...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-[24px] border p-8 text-center"
        style={{
          borderColor: `${theme.danger}40`,
          backgroundColor: `${theme.danger}10`,
        }}
      >
        <TriangleAlert
          className="mx-auto"
          size={28}
          style={{ color: theme.danger }}
        />
        <p className="mt-4 font-medium">
          Customer database could not load
        </p>
        <p
          className="mt-2 text-sm"
          style={{ color: theme.textMuted }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[28px] border p-4 sm:p-6"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Customer intelligence
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Customer database
            </h2>

            <p
              className="mt-2 max-w-2xl text-sm leading-6"
              style={{ color: theme.textMuted }}
            >
              View customer contact details, birthdays, visit activity,
              loyalty progress, and export exactly the segment you need.
            </p>
          </div>

          <button
            type="button"
            onClick={exportFiltered}
            disabled={filteredCustomers.length === 0}
            className="flex h-11 w-full touch-manipulation items-center justify-center gap-2 px-4 text-sm font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto"
            style={{
              backgroundColor: theme.accent,
              color: theme.buttonText,
              borderRadius: theme.radiusMedium,
            }}
          >
            <Download size={17} />
            Export {filteredCustomers.length} CSV
          </button>
        </div>
      </section>

      <section
        className="rounded-[24px] border p-4 sm:p-5"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <div className="flex items-center gap-2">
          <Filter
            size={16}
            style={{ color: theme.accent }}
          />
          <p className="text-sm font-semibold">
            Filters
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div
            className="flex h-11 items-center border px-3"
            style={{
              borderColor: theme.inputBorder,
              backgroundColor: theme.inputBackground,
              borderRadius: theme.radiusMedium,
            }}
          >
            <Search
              size={16}
              className="mr-2 shrink-0"
              style={{ color: theme.textMuted }}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name, phone, Instagram..."
              className="w-full bg-transparent text-base outline-none sm:text-sm"
              style={{ color: theme.textPrimary }}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                <X
                  size={14}
                  style={{ color: theme.textMuted }}
                />
              </button>
            )}
          </div>

          <select
            value={birthdayFilter}
            onChange={(event) =>
              setBirthdayFilter(
                event.target.value as BirthdayFilter,
              )
            }
            className="h-11 border px-3 text-base outline-none sm:text-sm"
            style={{
              borderColor: theme.inputBorder,
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
              borderRadius: theme.radiusMedium,
            }}
          >
            <option value="all">All birthdays</option>
            <option value="today">Birthday today</option>
            <option value="next7">Birthday next 7 days</option>
            <option value="thisMonth">Birthday this month</option>
          </select>

          <select
            value={activityFilter}
            onChange={(event) =>
              setActivityFilter(
                event.target.value as ActivityFilter,
              )
            }
            className="h-11 border px-3 text-base outline-none sm:text-sm"
            style={{
              borderColor: theme.inputBorder,
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
              borderRadius: theme.radiusMedium,
            }}
          >
            <option value="all">All activity</option>
            <option value="active30">Active last 30 days</option>
            <option value="inactive7">Inactive 7+ days</option>
            <option value="inactive14">Inactive 14+ days</option>
            <option value="inactive21">Inactive 21+ days</option>
            <option value="inactive30">Inactive 30+ days</option>
            <option value="neverReturned">Joined but never returned</option>
          </select>

          <select
            value={contactFilter}
            onChange={(event) =>
              setContactFilter(
                event.target.value as ContactFilter,
              )
            }
            className="h-11 border px-3 text-base outline-none sm:text-sm"
            style={{
              borderColor: theme.inputBorder,
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
              borderRadius: theme.radiusMedium,
            }}
          >
            <option value="all">All contact methods</option>
            <option value="phone">Has phone</option>
            <option value="instagram">Has Instagram</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setRewardReadyOnly((value) => !value)
            }
            className="h-9 border px-3 text-xs font-semibold"
            style={{
              borderColor: rewardReadyOnly
                ? theme.accent
                : theme.border,
              backgroundColor: rewardReadyOnly
                ? theme.accentSoft
                : theme.surfaceRaised,
              color: rewardReadyOnly
                ? theme.accent
                : theme.textSecondary,
              borderRadius: "999px",
            }}
          >
            Reward ready
          </button>

          <button
            type="button"
            onClick={() =>
              setHighFrequencyOnly((value) => !value)
            }
            className="h-9 border px-3 text-xs font-semibold"
            style={{
              borderColor: highFrequencyOnly
                ? theme.accent
                : theme.border,
              backgroundColor: highFrequencyOnly
                ? theme.accentSoft
                : theme.surfaceRaised,
              color: highFrequencyOnly
                ? theme.accent
                : theme.textSecondary,
              borderRadius: "999px",
            }}
          >
            5+ visits
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="h-9 px-3 text-xs font-medium"
            style={{ color: theme.textMuted }}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-[24px] border"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <div
          className="flex flex-col items-start gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            <p className="text-sm font-semibold">
              {filteredCustomers.length} customers
            </p>
          </div>

          {birthdayFilter !== "all" && (
            <div
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: theme.accent }}
            >
              <Cake size={14} />
              Birthday filter active
            </div>
          )}
        </div>

        {filteredCustomers.length > 0 && (
          <div className="space-y-3 p-4 md:hidden">
            {filteredCustomers.map(
              (customer) => {
                const rewardReady =
                  Boolean(
                    customer.rewardEarnedAt,
                  ) ||
                  customer.stamps >=
                    data.cafe
                      .rewardTarget;

                return (
                  <article
                    key={customer.id}
                    className="border p-4"
                    style={{
                      borderColor:
                        rewardReady
                          ? `${theme.success}65`
                          : theme.border,
                      backgroundColor:
                        rewardReady
                          ? `${theme.success}0D`
                          : theme.surfaceRaised,
                      borderRadius:
                        theme.radiusMedium,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold">
                          {customer.name}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{
                            color:
                              theme.textMuted,
                          }}
                        >
                          {
                            customer.memberNumber
                          }
                        </p>
                      </div>

                      {rewardReady && (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                          style={{
                            backgroundColor:
                              `${theme.success}18`,
                            color:
                              theme.success,
                          }}
                        >
                          Reward ready
                        </span>
                      )}
                    </div>

                    <div
                      className="mt-3 border-t pt-3 text-sm"
                      style={{
                        borderColor:
                          theme.border,
                      }}
                    >
                      <p className="break-all">
                        {customer.phone ||
                          "No phone"}
                      </p>
                      <p
                        className="mt-1 break-all text-xs"
                        style={{
                          color:
                            theme.textMuted,
                        }}
                      >
                        {customer.instagram
                          ? `@${customer.instagram.replace(
                              /^@/,
                              "",
                            )}`
                          : "No Instagram"}
                      </p>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        [
                          "Birthday",
                          formatDate(
                            customer.birthday,
                          ),
                        ],
                        [
                          "Last visit",
                          formatDate(
                            customer.lastVisitAt,
                          ),
                        ],
                        [
                          "Visits",
                          customer.totalVisits,
                        ],
                        [
                          "Stamps",
                          customer.stamps,
                        ],
                        [
                          "Rewards",
                          customer.rewardsRedeemed,
                        ],
                        [
                          "Joined",
                          formatDate(
                            customer.createdAt,
                          ),
                        ],
                      ].map(
                        ([label, value]) => (
                          <div
                            key={label}
                            className="min-w-0"
                          >
                            <dt
                              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                              style={{
                                color:
                                  theme.textMuted,
                              }}
                            >
                              {label}
                            </dt>
                            <dd className="mt-1 truncate text-sm font-medium tabular-nums">
                              {value}
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </article>
                );
              },
            )}
          </div>
        )}

        {filteredCustomers.length ===
          0 && (
          <div className="p-8 text-center md:hidden">
            <p className="font-medium">
              No customers match these
              filters.
            </p>
            <p
              className="mt-2 text-sm"
              style={{
                color: theme.textMuted,
              }}
            >
              Try changing the birthday,
              activity, or contact filters.
            </p>
          </div>
        )}

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead>
              <tr
                className="border-b text-xs uppercase tracking-wide"
                style={{
                  borderColor: theme.border,
                  color: theme.textMuted,
                }}
              >
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Birthday</th>
                <th className="px-5 py-3">Visits</th>
                <th className="px-5 py-3">Stamps</th>
                <th className="px-5 py-3">Last visit</th>
                <th className="px-5 py-3">Rewards</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b last:border-b-0"
                  style={{ borderColor: theme.border }}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {customer.name}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: theme.textMuted }}
                    >
                      {customer.memberNumber}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p>{customer.phone || "No phone"}</p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: theme.textMuted }}
                    >
                      {customer.instagram
                        ? `@${customer.instagram.replace(/^@/, "")}`
                        : "No Instagram"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {formatDate(customer.birthday)}
                  </td>

                  <td className="px-5 py-4 tabular-nums">
                    {customer.totalVisits}
                  </td>

                  <td className="px-5 py-4 tabular-nums">
                    {customer.stamps}
                  </td>

                  <td className="px-5 py-4">
                    {formatDate(customer.lastVisitAt)}
                  </td>

                  <td className="px-5 py-4 tabular-nums">
                    {customer.rewardsRedeemed}
                  </td>

                  <td className="px-5 py-4">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium">
                No customers match these filters.
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: theme.textMuted }}
              >
                Try changing the birthday, activity, or contact filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
