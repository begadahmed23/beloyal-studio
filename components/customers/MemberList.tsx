"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";

import MemberCard from "./MemberCard";

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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load members."
          );
        }

        setCustomers(data);
      } catch (error) {
        console.error(error);

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
      <div className="flex h-14 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 transition focus-within:border-[#8d634a] focus-within:bg-white/[0.05]">
        <Search
          size={19}
          className="mr-3 shrink-0 text-[#8d827a]"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone, or member number"
          className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#655f5b]"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="ml-3 text-xs font-medium text-[#9d8d82] transition hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#b9aaa0]">
          {search ? "Search results" : "Recent members"}
        </h3>

        <div className="flex items-center gap-3">
          {refreshing && (
            <p className="text-xs text-[#716964]">
              Updating...
            </p>
          )}

          {!loading && !error && (
            <p className="text-xs text-[#716964]">
              {filteredCustomers.length}{" "}
              {filteredCustomers.length === 1
                ? "member"
                : "members"}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-10 text-center text-sm text-[#817771]">
          Loading members...
        </div>
      )}

      {!loading && error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredCustomers.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="font-medium text-[#c7b7ac]">
              No members found
            </p>

            <p className="mt-2 text-sm text-[#746b66]">
              Try another search or create a new member.
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