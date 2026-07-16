"use client";

import { useEffect, useState } from "react";
import {
  Coffee,
  Gift,
  UserPlus,
  Users,
} from "lucide-react";

type Analytics = {
  totalMembers: number;
  newMembersToday: number;
  totalStamps: number;
  rewardsReady: number;
};

export default function SimpleAnalytics() {
  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setError("");

      const response = await fetch("/api/analytics", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load analytics."
        );
      }

      setAnalytics(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();

    function handleUpdate() {
      loadAnalytics();
    }

    window.addEventListener(
      "members-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "members-updated",
        handleUpdate
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 text-sm text-[#817771]">
        Loading analytics...
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  const cards = [
    {
      label: "Total members",
      value: analytics.totalMembers,
      icon: Users,
    },
    {
      label: "New today",
      value: analytics.newMembersToday,
      icon: UserPlus,
    },
    {
      label: "Active stamps",
      value: analytics.totalStamps,
      icon: Coffee,
    },
    {
      label: "Rewards ready",
      value: analytics.rewardsReady,
      icon: Gift,
    },
  ];

  return (
    <section className="mt-8">
      <p className="mb-4 text-sm font-medium text-[#b9aaa0]">
        Overview
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8e6045]/15 text-[#d5a985]">
                <Icon size={17} />
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
                {card.value}
              </p>

              <p className="mt-1 text-xs text-[#817771]">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}