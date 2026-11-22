"use client";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import {
  useCallback,
  useEffect,
  useRef,
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

import SignupBranchFilter from "@/components/customers/SignupBranchFilter";
import MemberCard from "@/components/customers/MemberCard";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { daysUntilBirthday } from "@/lib/wallet/campaign-segments";

type Customer = {
  id: string;
  memberNumber: string;
  joinLocation: { name: string } | null;
  publicToken: string | null;
  name: string;
  phone: string;
  instagram: string | null;
  birthday: string;
  stamps: number;
  stampDates: string[];
  lastStampedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const birthdayLabels = ["Birthday today", "Tomorrow", "In 2 days"] as const;

export default function MemberList() {
  const { t } = useBeLoyalLanguage();
  const { theme, cafe } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const personSingular = isBarbershop ? "client" : "member";
  const personPlural = isBarbershop ? "clients" : "members";
  const activityLabel = isBarbershop
    ? "recently visited"
    : "recently stamped";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [signupBranch, setSignupBranch] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "recently-stamped"
  >("newest");
  const [showUpcomingBirthdays, setShowUpcomingBirthdays] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const latestRequest = useRef(0);

  const loadCustomers = useCallback(
    async (showRefreshing = false) => {
      const request = ++latestRequest.current;

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

        if (request === latestRequest.current) setCustomers(data);
      } catch (error) {
        if (request !== latestRequest.current) return;
        console.error("Member list error:", error);
        setError(
          error instanceof Error
            ? error.message
            : `Failed to load ${personPlural}.`,
        );
      } finally {
        if (request === latestRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [personPlural, personSingular],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadCustomers(), 0);

    function handleMembersUpdated() {
      loadCustomers(true);
    }

    window.addEventListener("members-updated", handleMembersUpdated);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("members-updated", handleMembersUpdated);
    };
  }, [loadCustomers]);

  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const upcoming = new Map<string, number>();
    for (const customer of customers) {
      if (!customer.birthday) continue;
      const birthday = new Date(customer.birthday);
      if (Number.isNaN(birthday.getTime())) continue;
      const days = daysUntilBirthday(birthday, now, cafe.timezone);
      if (days >= 0 && days < birthdayLabels.length) upcoming.set(customer.id, days);
    }
    return upcoming;
  }, [customers, cafe.timezone]);

  const birthdayCount = signupBranch
    ? customers.filter(customer => customer.joinLocation?.name === signupBranch && upcomingBirthdays.has(customer.id)).length
    : upcomingBirthdays.size;

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();
    const candidates = customers.filter(customer =>
      (!signupBranch || customer.joinLocation?.name === signupBranch) &&
      (!showUpcomingBirthdays || upcomingBirthdays.has(customer.id)),
    );
    const matchingCustomers = value
      ? candidates.filter(
          (customer) =>
            customer.name.toLowerCase().includes(value) ||
            customer.phone.includes(value) ||
            (customer.instagram?.toLowerCase().includes(
              value.replace(/^@+/, ""),
            ) ?? false) ||
            customer.memberNumber.toLowerCase().includes(value) ||
            (customer.joinLocation?.name.toLowerCase().includes(value) ?? false),
        )
      : [...candidates];

    return matchingCustomers.sort((first, second) => {
      if (showUpcomingBirthdays) {
        const difference = (upcomingBirthdays.get(first.id) ?? 0) - (upcomingBirthdays.get(second.id) ?? 0);
        if (difference !== 0) return difference;
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
  }, [customers, search, sortBy, signupBranch, showUpcomingBirthdays, upcomingBirthdays]);

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
        <Search size={19} className="me-3 shrink-0" style={{ color: theme.textMuted }} />
        <input
          type="search"
          name="beloyal-member-query"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("Search members by name, phone or store")}
          className="h-full w-full bg-transparent text-base outline-none sm:text-sm"
          style={{ color: theme.textPrimary }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label={t("Clear search")}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center transition hover:opacity-70"
            style={{ color: theme.textMuted, borderRadius: theme.radiusMedium }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>
            {showUpcomingBirthdays ? t("Upcoming birthdays") : search ? "Search results" : `Recent ${personPlural}`}
          </h3>
          <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
            {showUpcomingBirthdays
              ? t("Birthdays today and in the next 2 days.")
              : search
                ? `Showing ${personPlural} that match your search.`
                : sortBy === "recently-stamped"
                  ? `The most ${activityLabel} ${personPlural} appear first.`
                  : `The newest loyalty ${personPlural} appear first.`}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end">
          <SignupBranchFilter value={signupBranch} onChange={setSignupBranch} />
          {refreshing && (
            <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
              <LoaderCircle size={13} className="animate-spin" />
              Updating
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowUpcomingBirthdays((current) => !current)}
            disabled={loading || Boolean(error && customers.length === 0)}
            aria-pressed={showUpcomingBirthdays}
            className="flex min-h-11 touch-manipulation items-center gap-2 border px-3 text-xs font-semibold transition duration-150 hover:opacity-85 active:opacity-80 disabled:opacity-50"
            style={{
              borderColor: showUpcomingBirthdays ? `${theme.accent}75` : theme.inputBorder,
              backgroundColor: showUpcomingBirthdays ? theme.accentSoft : theme.inputBackground,
              color: showUpcomingBirthdays ? theme.accent : theme.textSecondary,
              borderRadius: theme.radiusMedium,
            }}
          >
            <Cake size={14} />
            {t("Upcoming birthdays")}
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px]"
              style={{
                backgroundColor: showUpcomingBirthdays ? `${theme.accent}20` : theme.surfaceRaised,
                color: showUpcomingBirthdays ? theme.accent : theme.textMuted,
              }}
            >
              {loading ? "—" : birthdayCount}
            </span>
          </button>

          {!loading && !error && (
            <button
              type="button"
              onClick={() =>
                setSortBy((current) =>
                  current === "newest" ? "recently-stamped" : "newest",
                )
              }
              className="flex h-9 touch-manipulation items-center gap-2 border px-3 text-xs font-medium transition duration-150 hover:opacity-80 active:opacity-80"
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

      {!loading && error && customers.length > 0 && (
        <p role="status" className="mt-4 text-sm" style={{ color: theme.danger }}>
          The list could not refresh. {error}
        </p>
      )}

      {!loading && error && customers.length === 0 && (
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
            {isBarbershop ? t("Clients") : t("Members")} could not load
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
          >{t("Try again")}</button>
        </div>
      )}

      {!loading && (!error || customers.length > 0) && filteredCustomers.length === 0 && (
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
            {showUpcomingBirthdays ? t("No upcoming birthdays") : signupBranch ? t("No members joined at this branch") : search ? `No matching ${personPlural}` : `No ${personPlural} yet`}
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
            {search
              ? `Try another name, phone, Instagram, store, or ${personSingular} number.`
              : showUpcomingBirthdays
                ? t("No birthdays today or in the next 2 days.")
                : signupBranch ? t("Try another signup branch.") : `Create the first ${personSingular} to start the loyalty program.`}
          </p>
        </div>
      )}

      {!loading && filteredCustomers.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filteredCustomers.map((customer) => {
            const birthdayInDays = upcomingBirthdays.get(customer.id);

            return (
              <div key={customer.id} className="relative min-w-0">
                {birthdayInDays !== undefined && (
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
                    {t(birthdayLabels[birthdayInDays])}
                  </div>
                )}
                <MemberCard customer={customer} />
                {customer.joinLocation && (
                  <p className="px-1 pt-2 text-sm" style={{ color: theme.textSecondary }}>
                    {t("Joined at")} <span className="font-medium">{customer.joinLocation.name}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
