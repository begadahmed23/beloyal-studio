"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
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
  createdAt: string;
  updatedAt: string;
};

export default function MemberList() {
  const { theme } = useCafeTheme();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

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
              "The members API returned an invalid response."
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            !Array.isArray(data) && data.message
              ? data.message
              : "Failed to load members."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid member list response.");
        }

        setCustomers(data);
      } catch (error) {
        console.error("Member list error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load members."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCustomers();

    function handleMembersUpdated() {
      loadCustomers(true);
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
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(value) ||
        customer.phone.includes(value) ||
        customer.memberNumber.toLowerCase().includes(value)
      );
    });
  }, [customers, search]);

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
        <Search
          size={19}
          className="mr-3 shrink-0"
          style={{
            color: theme.textMuted,
          }}
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone, or member number"
          className="h-full w-full bg-transparent text-sm outline-none"
          style={{
            color: theme.textPrimary,
          }}
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center transition hover:opacity-70"
            style={{
              color: theme.textMuted,
              borderRadius: theme.radiusMedium,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h3
            className="text-sm font-medium"
            style={{
              color: theme.textSecondary,
            }}
          >
            {search ? "Search results" : "Recent members"}
          </h3>

          <p
            className="mt-1 text-xs"
            style={{
              color: theme.textMuted,
            }}
          >
            {search
              ? "Showing members that match your search."
              : "The newest loyalty members appear first."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {refreshing && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{
                color: theme.textMuted,
              }}
            >
              <LoaderCircle
                size={13}
                className="animate-spin"
              />
              Updating
            </div>
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

              {filteredCustomers.length}{" "}
              {filteredCustomers.length === 1
                ? "member"
                : "members"}
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
              Loading members...
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
            Members could not load
          </p>

          <p
            className="mt-2 text-sm"
            style={{
              color: theme.textMuted,
            }}
          >
            {error}
          </p>

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

      {!loading &&
        !error &&
        filteredCustomers.length === 0 && (
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

            <p
              className="mt-4 font-medium"
              style={{
                color: theme.textPrimary,
              }}
            >
              {search
                ? "No matching members"
                : "No members yet"}
            </p>

            <p
              className="mt-2 text-sm"
              style={{
                color: theme.textMuted,
              }}
            >
              {search
                ? "Try another name, phone number, or member number."
                : "Create the first member to start the loyalty program."}
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        filteredCustomers.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <MemberCard
                key={customer.id}
                customer={customer}
              />
            ))}
          </div>
        )}
    </div>
  );
}