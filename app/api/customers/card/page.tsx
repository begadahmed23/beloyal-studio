"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  Gift,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useParams } from "next/navigation";

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string;
  name: string;
  birthday: string;
  stamps: number;
  createdAt: string;
  updatedAt: string;
};

function calculateBirthdayCountdown(birthday: string) {
  const birthdayDate = new Date(birthday);
  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const nextBirthday = new Date(
    today.getFullYear(),
    birthdayDate.getUTCMonth(),
    birthdayDate.getUTCDate()
  );

  if (nextBirthday < todayStart) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return Math.ceil(
    (nextBirthday.getTime() - todayStart.getTime()) / 86_400_000
  );
}

export default function DigitalCardPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCard = useCallback(
    async (showRefreshing = false) => {
      if (!token) return;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        const response = await fetch(
          `/api/customers/card/${encodeURIComponent(token)}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load loyalty card.");
        }

        setCustomer(data);
        setError("");
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load loyalty card."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadCard();

    const interval = window.setInterval(() => {
      loadCard();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [loadCard]);

  const birthdayText = useMemo(() => {
    if (!customer) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
    }).format(new Date(customer.birthday));
  }, [customer]);

  const memberSince = useMemo(() => {
    if (!customer) return "";

    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(new Date(customer.createdAt));
  }, [customer]);

  const daysUntilBirthday = useMemo(() => {
    if (!customer) return 0;

    return calculateBirthdayCountdown(customer.birthday);
  }, [customer]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin text-[#c7936e]"
          />

          <p className="mt-4 text-sm text-[#82766f]">
            Loading your Loretto card...
          </p>
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] px-5 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#141414] p-7 text-center">
          <p className="text-xl font-semibold">Card not found</p>

          <p className="mt-3 text-sm leading-6 text-[#82766f]">
            {error || "This loyalty-card link may be incorrect."}
          </p>

          <button
            type="button"
            onClick={() => loadCard(true)}
            className="mt-6 h-11 w-full rounded-xl bg-[#8e6045] text-sm font-semibold transition hover:bg-[#a06d4e]"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const rewardReady = customer.stamps >= 10;
  const remainingStamps = Math.max(10 - customer.stamps, 0);

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#131313] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <header className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-7 pt-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#9d6747]/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.32em] text-[#c79470]">
                    LORETTO
                  </p>

                  <p className="mt-2 text-xs text-[#766c66]">
                    Digital Loyalty Card
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadCard(true)}
                  disabled={refreshing}
                  aria-label="Refresh loyalty card"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-[#a99a90] transition hover:bg-white/[0.07] disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>
              </div>

              <h1 className="mt-10 text-3xl font-semibold tracking-tight text-[#f4ede8]">
                {customer.name}
              </h1>

              <p className="mt-2 text-sm text-[#82766f]">
                {customer.memberNumber}
              </p>
            </div>
          </header>

          <div className="space-y-6 p-6">
            {rewardReady && (
              <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <Gift size={23} />
                  </div>

                  <div>
                    <p className="font-semibold text-emerald-200">
                      Your free drink is ready
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-200/60">
                      Show this card to the cashier to redeem it.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#ded3cb]">
                    Your stamp card
                  </p>

                  <p className="mt-1 text-xs text-[#716762]">
                    One stamp per eligible drink
                  </p>
                </div>

                <span className="rounded-full border border-[#9b694b]/35 bg-[#9b694b]/15 px-3 py-1.5 text-xs font-semibold text-[#ddb08e]">
                  {rewardReady ? "Reward ready" : `${customer.stamps}/10`}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, index) => {
                  const filled = index < customer.stamps;

                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-2xl border ${
                        filled
                          ? "border-[#a16e50]/55 bg-[#a16e50]/20"
                          : "border-white/[0.07] bg-[#0d0d0d]"
                      }`}
                    >
                      <Coffee
                        size={23}
                        className={
                          filled
                            ? "fill-[#dda77e] text-[#dda77e]"
                            : "text-[#49433f]"
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    rewardReady ? "bg-emerald-500" : "bg-[#a77758]"
                  }`}
                  style={{
                    width: `${Math.min(customer.stamps, 10) * 10}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-sm text-[#82766f]">
                {rewardReady
                  ? "You completed your loyalty card."
                  : `${remainingStamps} more ${
                      remainingStamps === 1 ? "stamp" : "stamps"
                    } until your free drink.`}
              </p>
            </section>

            <section className="grid gap-3">
              <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <CalendarDays size={19} className="text-[#b78665]" />

                <div>
                  <p className="text-xs text-[#706762]">Birthday</p>

                  <p className="mt-1 text-sm font-medium text-[#e4dad3]">
                    {birthdayText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <CheckCircle2 size={19} className="text-[#b78665]" />

                <div>
                  <p className="text-xs text-[#706762]">
                    Birthday countdown
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#e4dad3]">
                    {daysUntilBirthday === 0
                      ? "Happy birthday!"
                      : `${daysUntilBirthday} ${
                          daysUntilBirthday === 1 ? "day" : "days"
                        } to go`}
                  </p>
                </div>
              </div>
            </section>

            <footer className="border-t border-white/[0.06] pt-5 text-center">
              <p className="text-xs text-[#5f5753]">
                Member since {memberSince}
              </p>

              <p className="mt-2 text-xs text-[#4e4844]">
                This card updates automatically.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}