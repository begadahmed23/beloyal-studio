"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  Gift,
  Heart,
  LoaderCircle,
  RefreshCw,
  Sparkles,
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

const REWARD_TARGET = 7;

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

function getProgressMessage(stamps: number) {
  if (stamps >= REWARD_TARGET) {
    return {
      title: "Your free drink is ready",
      description: "Show this card to the cashier to redeem your reward.",
    };
  }

  if (stamps >= 6) {
    return {
      title: "One more drink",
      description: "Your free drink is almost ready.",
    };
  }

  if (stamps >= 4) {
    return {
      title: "More than halfway there",
      description: "Keep going. Your free drink is getting closer.",
    };
  }

  if (stamps > 0) {
    return {
      title: "Great start",
      description: "Every eligible drink brings you closer to a free one.",
    };
  }

  return {
    title: "Your journey starts here",
    description: "Buy an eligible drink to receive your first stamp.",
  };
}

export default function DigitalCardPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const previousStampCount = useRef<number | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newStampIndex, setNewStampIndex] = useState<number | null>(null);
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

        const incomingCustomer = data as Customer;

        if (
          previousStampCount.current !== null &&
          incomingCustomer.stamps > previousStampCount.current
        ) {
          setNewStampIndex(incomingCustomer.stamps - 1);

          window.setTimeout(() => {
            setNewStampIndex(null);
          }, 1200);
        }

        previousStampCount.current = incomingCustomer.stamps;

        setCustomer(incomingCustomer);
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

    return () => {
      window.clearInterval(interval);
    };
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

  const lastUpdated = useMemo(() => {
    if (!customer) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(customer.updatedAt));
  }, [customer]);

  const daysUntilBirthday = useMemo(() => {
    if (!customer) return 0;

    return calculateBirthdayCountdown(customer.birthday);
  }, [customer]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
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
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
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

  const visibleStamps = Math.min(customer.stamps, REWARD_TARGET);
  const rewardReady = customer.stamps >= REWARD_TARGET;
  const remainingStamps = Math.max(REWARD_TARGET - customer.stamps, 0);
  const progressMessage = getProgressMessage(customer.stamps);
  const progressPercentage =
    (visibleStamps / REWARD_TARGET) * 100;

  return (
    <main
      className={`min-h-screen px-4 py-6 text-white transition-colors duration-700 sm:px-6 sm:py-10 ${
        rewardReady
          ? "bg-[radial-gradient(circle_at_top,#17352a_0%,#090909_45%)]"
          : "bg-[radial-gradient(circle_at_top,#24160f_0%,#090909_45%)]"
      }`}
    >
      <div className="mx-auto max-w-md">
        <div
          className={`relative overflow-hidden rounded-[34px] border shadow-[0_35px_120px_rgba(0,0,0,0.6)] transition-all duration-700 ${
            rewardReady
              ? "border-emerald-400/20 bg-[#101814]"
              : "border-white/[0.08] bg-[#131313]"
          }`}
        >
          {rewardReady && (
            <>
              <div className="pointer-events-none absolute left-[12%] top-10 h-2 w-2 animate-ping rounded-full bg-emerald-300/60" />
              <div className="pointer-events-none absolute right-[18%] top-24 h-2 w-2 animate-ping rounded-full bg-amber-200/60 [animation-delay:300ms]" />
              <div className="pointer-events-none absolute bottom-40 left-[20%] h-2 w-2 animate-ping rounded-full bg-emerald-200/60 [animation-delay:600ms]" />
              <div className="pointer-events-none absolute bottom-24 right-[12%] h-2 w-2 animate-ping rounded-full bg-amber-200/60 [animation-delay:900ms]" />
            </>
          )}

          <header className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-7 pt-8">
            <div
              className={`absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl transition-colors duration-700 ${
                rewardReady ? "bg-emerald-500/15" : "bg-[#9d6747]/20"
              }`}
            />

            <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#8e6045]/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    className={`text-3xl font-semibold tracking-[0.22em] sm:text-4xl ${
                      rewardReady ? "text-emerald-300" : "text-[#d6a27c]"
                    }`}
                  >
                    LORETTO
                  </h2>

                  <p className="mt-3 text-xs tracking-[0.12em] text-[#766c66]">
                    DIGITAL LOYALTY CARD
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadCard(true)}
                  disabled={refreshing}
                  aria-label="Refresh loyalty card"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-[#a99a90] transition hover:bg-white/[0.07] disabled:opacity-50"
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
            </div>
          </header>

          <div className="space-y-6 p-6">
            <section
              className={`relative overflow-hidden rounded-3xl border p-5 transition-all duration-700 ${
                rewardReady
                  ? "border-emerald-400/25 bg-emerald-500/[0.08]"
                  : "border-[#9b694b]/20 bg-[#9b694b]/[0.06]"
              }`}
            >
              <div
                className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${
                  rewardReady ? "bg-emerald-400/10" : "bg-[#a77758]/10"
                }`}
              />

              <div className="relative flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    rewardReady
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-[#9b694b]/15 text-[#d3a27d]"
                  }`}
                >
                  {rewardReady ? <Gift size={23} /> : <Sparkles size={22} />}
                </div>

                <div>
                  <p
                    className={`font-semibold ${
                      rewardReady ? "text-emerald-200" : "text-[#e1c7b4]"
                    }`}
                  >
                    {progressMessage.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#8a7d75]">
                    {progressMessage.description}
                  </p>
                </div>
              </div>
            </section>

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

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    rewardReady
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      : "border-[#9b694b]/35 bg-[#9b694b]/15 text-[#ddb08e]"
                  }`}
                >
                  {rewardReady
                    ? "Reward ready"
                    : `${visibleStamps}/${REWARD_TARGET}`}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-3">
                {Array.from({ length: REWARD_TARGET }).map((_, index) => {
                  const filled = index < visibleStamps;
                  const isNewStamp = newStampIndex === index;

                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-2xl border transition-all duration-500 ${
                        filled
                          ? rewardReady
                            ? "border-emerald-400/35 bg-emerald-500/10"
                            : "border-[#a16e50]/55 bg-[#a16e50]/20"
                          : "border-white/[0.07] bg-[#0d0d0d]"
                      } ${
                        isNewStamp
                          ? "scale-125 shadow-[0_0_30px_rgba(221,167,126,0.45)]"
                          : "scale-100"
                      }`}
                    >
                      <Coffee
                        size={23}
                        className={`transition-all duration-500 ${
                          filled
                            ? rewardReady
                              ? "fill-emerald-300 text-emerald-300"
                              : "fill-[#dda77e] text-[#dda77e]"
                            : "text-[#49433f]"
                        } ${isNewStamp ? "rotate-12 scale-125" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    rewardReady ? "bg-emerald-500" : "bg-[#a77758]"
                  }`}
                  style={{
                    width: `${progressPercentage}%`,
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9b694b]/10 text-[#c58e69]">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <p className="text-xs text-[#706762]">Birthday</p>

                  <p className="mt-1 text-sm font-medium text-[#e4dad3]">
                    {birthdayText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9b694b]/10 text-[#c58e69]">
                  <CheckCircle2 size={19} />
                </div>

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

            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs text-[#706762]">Last updated</p>

              <p className="mt-1 text-sm font-medium text-[#d8cec7]">
                {lastUpdated}
              </p>
            </section>

            <footer className="border-t border-white/[0.06] pt-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#665d58]">
                <Heart size={13} />
                <span>Thank you for being part of Loretto</span>
              </div>

              <p className="mt-3 text-xs text-[#514a46]">
                Member since {memberSince}
              </p>

              <p className="mt-2 text-xs text-[#45403d]">
                This card updates automatically.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}