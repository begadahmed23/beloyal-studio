"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownUp,
  Cake,
  LoaderCircle,
  Search,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";

import MemberCard from "@/components/customers/MemberCard";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string | null;
  name: string;
  phone: string;
  birthday: string;
  stamps: number;
  stampDates: string[];
  lastStampedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BirthdayProximity = {
  daysUntil: number;
  label: string;
};

function getBirthdayProximity(
  birthday: string,
): BirthdayProximity | null {
  const birthdayDate = new Date(birthday);

  if (Number.isNaN(birthdayDate.getTime())) {
    return null;
  }

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  let nextBirthday = new Date(
    today.getFullYear(),
    birthdayDate.getUTCMonth(),
    birthdayDate.getUTCDate(),
  );

  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = new Date(
      today.getFullYear() + 1,
      birthdayDate.getUTCMonth(),
      birthdayDate.getUTCDate(),
    );
  }

  const daysUntil = Math.round(
    (nextBirthday.getTime() - today.getTime()) /
      86_400_000,
  );

  if (daysUntil === 0) {
    return { daysUntil, label: "Birthday today" };
  }

  if (daysUntil === 1) {
    return { daysUntil, label: "Tomorrow" };
  }

  if (daysUntil === 2) {
    return { daysUntil, label: "In 2 days" };
  }

  return null;
}

export default function MemberList() {
  const { theme, cafe } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const personSingular = isBarbershop ? "client" : "member";
  const personPlural = isBarbershop ? "clients" : "members";
  const activityLabel = isBarbershop
    ? "recently visited"
    : "recently stamped";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "recently-stamped"
  >("newest");
  const [birthdaysFirst, setBirthdaysFirst] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        setError("");

        const response = await fetch("/api/customers", {
          cache: "no-store",
        });
        const responseText = await response.text();
        let data: Customer[] | { message?: string } = [];

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            throw new Error(
              `The ${personPlural} API returned an invalid response.`,
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            !Array.isArray(data) && data.message
              ? data.message
              : `Failed to load ${personPlural}.`,
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(`Invalid ${personSingular} list response.`);
        }

        setCustomers(data);
      } catch (error) {
        console.error("Member list error:", error);
        setError(
          error instanceof Error
            ? error.message
            : `Failed to load ${personPlural}.`,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [personPlural, personSingular],
  );

  useEffect(() => {
    loadCustomers();

    function handleMembersUpdated() {
      loadCustomers(true);
    }

    window.addEventListener("members-updated", handleMembersUpdated);
    return () =>
      window.removeEventListener("members-updated", handleMembersUpdated);
  }, [loadCustomers]);

  const birthdaySoonCount = useMemo(
    () =>
      customers.filter((customer) =>
        Boolean(getBirthdayProximity(customer.birthday)),
      ).length,
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();
    const matchingCustomers = value
      ? customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(value) ||
            customer.phone.includes(value) ||
            customer.memberNumber.toLowerCase().includes(value),
        )
      : [...customers];

    return matchingCustomers.sort((first, second) => {
      if (birthdaysFirst) {
        const firstBirthday = getBirthdayProximity(first.birthday);
        const secondBirthday = getBirthdayProximity(second.birthday);

        if (firstBirthday && !secondBirthday) return -1;
        if (!firstBirthday && secondBirthday) return 1;

        if (firstBirthday && secondBirthday) {
          const difference =
            firstBirthday.daysUntil - secondBirthday.daysUntil;
          if (difference !== 0) return difference;
        }
      }

      if (sortBy === "recently-stamped") {
        const firstStamp = first.lastStampedAt
          ? new Date(first.lastStampedAt).getTime()
          : 0;
        const secondStamp = second.lastStampedAt
          ? new Date(second.lastStampedAt).getTime()
          : 0;
        return secondStamp - firstStamp;
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }, [customers, search, sortBy, birthdaysFirst]);

  return (
    <div className="mt-8">
      <div
        className="flex h-14 items-center border px-5 transition"
        style={{
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: theme.radiusMedium,
          boxShadow: theme.cardShadow,
        }}
      >
        <Search size={19} className="mr-3 shrink-0" style={{ color: theme.textMuted }} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search by name, phone, or ${personSingular} number`}
          className="h-full w-full bg-transparent text-sm outline-none"
          style={{ color: theme.textPrimary }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center transition hover:opacity-70"
            style={{ color: theme.textMuted, borderRadius: theme.radiusMedium }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>
            {search ? "Search results" : `Recent ${personPlural}`}
          </h3>
          <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
            {birthdaysFirst
              ? "Birthday members are prioritized for the next 2 days."
              : search
                ? `Showing ${personPlural} that match your search.`
                : sortBy === "recently-stamped"
                  ? `The most ${activityLabel} ${personPlural} appear first.`
                  : `The newest loyalty ${personPlural} appear first.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {refreshing && (
            <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
              <LoaderCircle size={13} className="animate-spin" />
              Updating
            </div>
          )}

          {!loading && !error && birthdaySoonCount > 0 && (
            <button
              type="button"
              onClick={() => setBirthdaysFirst((current) => !current)}
              aria-pressed={birthdaysFirst}
              className="flex h-9 items-center gap-2 border px-3 text-xs font-semibold transition hover:opacity-85"
              style={{
                borderColor: birthdaysFirst ? `${theme.accent}75` : theme.inputBorder,
                backgroundColor: birthdaysFirst ? theme.accentSoft : theme.inputBackground,
                color: birthdaysFirst ? theme.accent : theme.textSecondary,
                borderRadius: theme.radiusMedium,
              }}
            >
              <Cake size={14} />
              Birthday soon
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px]"
                style={{
                  backgroundColor: birthdaysFirst ? `${theme.accent}20` : theme.surfaceRaised,
                  color: birthdaysFirst ? theme.accent : theme.textMuted,
                }}
              >
                {birthdaySoonCount}
              </span>
            </button>
          )}

          {!loading && !error && (
            <button
              type="button"
              onClick={() =>
                setSortBy((current) =>
                  current === "newest" ? "recently-stamped" : "newest",
                )
              }
              className="flex h-9 items-center gap-2 border px-3 text-xs font-medium transition hover:opacity-80"
              style={{
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.textSecondary,
                borderRadius: theme.radiusMedium,
              }}
            >
              <ArrowDownUp size={14} />
              {sortBy === "newest"
                ? "Newest"
                : isBarbershop
                  ? "Recent visits"
                  : "Recently stamped"}
            </button>
          )}

          {!loading && !error && (
            <div
              className="flex items-center gap-2 border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.textMuted,
                borderRadius: theme.radiusMedium,
              }}
            >
              <Users size={14} />
              {filteredCustomers.length} {filteredCustomers.length === 1 ? personSingular : personPlural}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div
          className="mt-5 flex min-h-44 items-center justify-center border p-10 text-center"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            borderRadius: theme.radiusLarge,
            boxShadow: theme.cardShadow,
          }}
        >
          <div>
            <LoaderCircle size={27} className="mx-auto animate-spin" style={{ color: theme.accent }} />
            <p className="mt-4 text-sm" style={{ color: theme.textMuted }}>
              Loading {personPlural}...
            </p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          className="mt-5 border p-7 text-center"
          style={{
            borderColor: `${theme.danger}40`,
            backgroundColor: `${theme.danger}12`,
            borderRadius: theme.radiusLarge,
          }}
        >
          <TriangleAlert size={26} className="mx-auto" style={{ color: theme.danger }} />
          <p className="mt-4 font-medium" style={{ color: theme.textPrimary }}>
            {isBarbershop ? "Clients" : "Members"} could not load
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>{error}</p>
          <button
            type="button"
            onClick={() => loadCustomers(true)}
            className="mt-5 h-10 border px-4 text-sm font-medium transition hover:opacity-90"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              color: theme.textPrimary,
              borderRadius: theme.radiusMedium,
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filteredCustomers.length === 0 && (
        <div
          className="mt-5 border border-dashed p-12 text-center"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            borderRadius: theme.radiusLarge,
          }}
        >
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center"
            style={{
              backgroundColor: theme.accentSoft,
              color: theme.accent,
              borderRadius: theme.radiusMedium,
            }}
          >
            <Users size={21} />
          </div>
          <p className="mt-4 font-medium" style={{ color: theme.textPrimary }}>
            {search ? `No matching ${personPlural}` : `No ${personPlural} yet`}
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
            {search
              ? `Try another name, phone number, or ${personSingular} number.`
              : `Create the first ${personSingular} to start the loyalty program.`}
          </p>
        </div>
      )}

      {!loading && !error && filteredCustomers.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filteredCustomers.map((customer) => {
            const birthdayProximity = getBirthdayProximity(customer.birthday);

            return (
              <div key={customer.id} className="relative min-w-0">
                {birthdayProximity && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-4 z-10 flex h-7 -translate-x-1/2 items-center gap-1.5 border px-2.5 text-[11px] font-semibold shadow-sm"
                    style={{
                      borderColor: `${theme.accent}45`,
                      backgroundColor: theme.accentSoft,
                      color: theme.accent,
                      borderRadius: "999px",
                    }}
                  >
                    <Cake size={12} />
                    {birthdayProximity.label}
                  </div>
                )}
                <MemberCard customer={customer} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
