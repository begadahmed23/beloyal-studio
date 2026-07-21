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

type CafeTheme =
  | "COFFEE_CLASSIC"
  | "MODERN_MINIMAL"
  | "DARK_LUXURY"
  | "SOFT_PASTEL"
  | "ORGANIC";

type Cafe = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: CafeTheme;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
};

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string | null;
  name: string;
  birthday: string;
  stamps: number;
  createdAt: string;
  updatedAt: string;
  cafe: Cafe;
};

type ThemeStyles = {
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  headingColor: string;
  mutedColor: string;
  panelBackground: string;
  emptyStampBackground: string;
};

function getThemeStyles(cafe: Cafe): ThemeStyles {
  switch (cafe.theme) {
    case "MODERN_MINIMAL":
      return {
        pageBackground:
          "radial-gradient(circle at top, rgba(255,255,255,0.10) 0%, #111111 48%)",
        cardBackground: "#171717",
        cardBorder: "rgba(255,255,255,0.12)",
        headingColor: "#ffffff",
        mutedColor: "#a3a3a3",
        panelBackground: "rgba(255,255,255,0.04)",
        emptyStampBackground: "#101010",
      };

    case "DARK_LUXURY":
      return {
        pageBackground:
          "radial-gradient(circle at top, rgba(184,134,11,0.18) 0%, #050505 45%)",
        cardBackground: "#0d0d0d",
        cardBorder: "rgba(212,175,55,0.22)",
        headingColor: "#f4df9b",
        mutedColor: "#9b9278",
        panelBackground: "rgba(212,175,55,0.05)",
        emptyStampBackground: "#080808",
      };

    case "SOFT_PASTEL":
      return {
        pageBackground:
          "radial-gradient(circle at top, rgba(255,193,210,0.20) 0%, #171215 48%)",
        cardBackground: "#1c171a",
        cardBorder: "rgba(255,210,220,0.15)",
        headingColor: "#ffe0e8",
        mutedColor: "#b99da5",
        panelBackground: "rgba(255,210,220,0.05)",
        emptyStampBackground: "#130f11",
      };

    case "ORGANIC":
      return {
        pageBackground:
          "radial-gradient(circle at top, rgba(95,130,90,0.22) 0%, #0d120d 48%)",
        cardBackground: "#121812",
        cardBorder: "rgba(145,180,120,0.16)",
        headingColor: "#dce8cf",
        mutedColor: "#93a28b",
        panelBackground: "rgba(145,180,120,0.05)",
        emptyStampBackground: "#0b100b",
      };

    case "COFFEE_CLASSIC":
    default:
      return {
        pageBackground:
          "radial-gradient(circle at top, rgba(142,96,69,0.25) 0%, #090909 48%)",
        cardBackground: "#131313",
        cardBorder: "rgba(255,255,255,0.08)",
        headingColor: "#f4ede8",
        mutedColor: "#82766f",
        panelBackground: "rgba(142,96,69,0.06)",
        emptyStampBackground: "#0d0d0d",
      };
  }
}

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

function getProgressMessage(
  stamps: number,
  rewardTarget: number,
  rewardName: string
) {
  const remaining = Math.max(rewardTarget - stamps, 0);

  if (stamps >= rewardTarget) {
    return {
      title: `${rewardName} ready`,
      description: "Show this card to the cashier to redeem your reward.",
    };
  }

  if (remaining === 1) {
    return {
      title: "Only one more",
      description: `One more eligible purchase until your ${rewardName.toLowerCase()}.`,
    };
  }

  if (stamps >= Math.ceil(rewardTarget / 2)) {
    return {
      title: "More than halfway there",
      description: `Keep going. Your ${rewardName.toLowerCase()} is getting closer.`,
    };
  }

  if (stamps > 0) {
    return {
      title: "Great start",
      description: "Every eligible purchase brings you closer to your reward.",
    };
  }

  return {
    title: "Your journey starts here",
    description: "Make an eligible purchase to receive your first stamp.",
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
      if (!token) {
        return;
      }

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
    if (!customer) {
      return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
    }).format(new Date(customer.birthday));
  }, [customer]);

  const memberSince = useMemo(() => {
    if (!customer) {
      return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(new Date(customer.createdAt));
  }, [customer]);

  const lastUpdated = useMemo(() => {
    if (!customer) {
      return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(customer.updatedAt));
  }, [customer]);

  const daysUntilBirthday = useMemo(() => {
    if (!customer) {
      return 0;
    }

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
            Loading your loyalty card...
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
            className="mt-6 h-11 w-full rounded-xl bg-[#8e6045] text-sm font-semibold transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const cafe = customer.cafe;
  const theme = getThemeStyles(cafe);

  const rewardTarget = Math.max(cafe.rewardTarget, 1);
  const visibleStamps = Math.min(customer.stamps, rewardTarget);
  const rewardReady = customer.stamps >= rewardTarget;
  const remainingStamps = Math.max(rewardTarget - customer.stamps, 0);
  const progressPercentage = (visibleStamps / rewardTarget) * 100;

  const progressMessage = getProgressMessage(
    customer.stamps,
    rewardTarget,
    cafe.rewardName
  );

  return (
    <main
      className="min-h-screen px-4 py-6 text-white transition-colors duration-700 sm:px-6 sm:py-10"
      style={{
        background: rewardReady
          ? `radial-gradient(circle at top, ${cafe.primaryColor}55 0%, #07100b 48%)`
          : theme.pageBackground,
      }}
    >
      <div className="mx-auto max-w-md">
        <div
          className="relative overflow-hidden rounded-[34px] border shadow-[0_35px_120px_rgba(0,0,0,0.6)] transition-all duration-700"
          style={{
            backgroundColor: rewardReady
              ? "#101814"
              : theme.cardBackground,
            borderColor: rewardReady
              ? "rgba(52,211,153,0.22)"
              : theme.cardBorder,
          }}
        >
          {rewardReady && (
            <>
              <div className="pointer-events-none absolute left-[12%] top-10 h-2 w-2 animate-ping rounded-full bg-emerald-300/60" />
              <div className="pointer-events-none absolute right-[18%] top-24 h-2 w-2 animate-ping rounded-full bg-amber-200/60 [animation-delay:300ms]" />
              <div className="pointer-events-none absolute bottom-40 left-[20%] h-2 w-2 animate-ping rounded-full bg-emerald-200/60 [animation-delay:600ms]" />
            </>
          )}

          <header className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-7 pt-8">
            <div
              className="absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
              style={{
                backgroundColor: rewardReady
                  ? "rgba(16,185,129,0.14)"
                  : `${cafe.primaryColor}33`,
              }}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {cafe.logoUrl ? (
                    <img
                      src={cafe.logoUrl}
                      alt={`${cafe.name} logo`}
                      className="max-h-16 max-w-[220px] object-contain object-left"
                    />
                  ) : (
                    <h2
                      className="break-words text-3xl font-semibold tracking-[0.12em] sm:text-4xl"
                      style={{
                        color: rewardReady
                          ? "#6ee7b7"
                          : cafe.secondaryColor,
                      }}
                    >
                      {cafe.name.toUpperCase()}
                    </h2>
                  )}

                  <p
                    className="mt-3 text-xs tracking-[0.12em]"
                    style={{
                      color: theme.mutedColor,
                    }}
                  >
                    DIGITAL LOYALTY CARD
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadCard(true)}
                  disabled={refreshing}
                  aria-label="Refresh loyalty card"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] transition hover:bg-white/[0.07] disabled:opacity-50"
                  style={{
                    color: cafe.secondaryColor,
                  }}
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>
              </div>

              <h1
                className="mt-10 text-3xl font-semibold tracking-tight"
                style={{
                  color: theme.headingColor,
                }}
              >
                {customer.name}
              </h1>

              <p
                className="mt-2 text-sm"
                style={{
                  color: theme.mutedColor,
                }}
              >
                Loyalty Member
              </p>
            </div>
          </header>

          <div className="space-y-6 p-6">
            <section
              className="relative overflow-hidden rounded-3xl border p-5 transition-all duration-700"
              style={{
                borderColor: rewardReady
                  ? "rgba(52,211,153,0.25)"
                  : `${cafe.primaryColor}44`,
                backgroundColor: rewardReady
                  ? "rgba(16,185,129,0.08)"
                  : theme.panelBackground,
              }}
            >
              <div className="relative flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: rewardReady
                      ? "rgba(16,185,129,0.10)"
                      : `${cafe.primaryColor}22`,
                    color: rewardReady
                      ? "#6ee7b7"
                      : cafe.secondaryColor,
                  }}
                >
                  {rewardReady ? <Gift size={23} /> : <Sparkles size={22} />}
                </div>

                <div>
                  <p
                    className="font-semibold"
                    style={{
                      color: rewardReady
                        ? "#a7f3d0"
                        : theme.headingColor,
                    }}
                  >
                    {progressMessage.title}
                  </p>

                  <p
                    className="mt-1 text-xs leading-5"
                    style={{
                      color: theme.mutedColor,
                    }}
                  >
                    {cafe.rewardDescription || progressMessage.description}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: theme.headingColor,
                    }}
                  >
                    Your stamp card
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: theme.mutedColor,
                    }}
                  >
                    {cafe.eligiblePurchaseDescription ||
                      "One stamp per eligible purchase"}
                  </p>
                </div>

                <span
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: rewardReady
                      ? "rgba(52,211,153,0.25)"
                      : `${cafe.primaryColor}66`,
                    backgroundColor: rewardReady
                      ? "rgba(16,185,129,0.10)"
                      : `${cafe.primaryColor}22`,
                    color: rewardReady
                      ? "#6ee7b7"
                      : cafe.secondaryColor,
                  }}
                >
                  {rewardReady
                    ? `${cafe.rewardName} ready`
                    : `${visibleStamps}/${rewardTarget}`}
                </span>
              </div>

              <div
                className="mt-5 grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(
                    rewardTarget,
                    5
                  )}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: rewardTarget }).map((_, index) => {
                  const filled = index < visibleStamps;
                  const isNewStamp = newStampIndex === index;

                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-2xl border transition-all duration-500 ${
                        isNewStamp
                          ? "scale-125 shadow-[0_0_30px_rgba(255,255,255,0.20)]"
                          : "scale-100"
                      }`}
                      style={{
                        borderColor: filled
                          ? rewardReady
                            ? "rgba(52,211,153,0.35)"
                            : `${cafe.primaryColor}88`
                          : "rgba(255,255,255,0.07)",
                        backgroundColor: filled
                          ? rewardReady
                            ? "rgba(16,185,129,0.10)"
                            : `${cafe.primaryColor}33`
                          : theme.emptyStampBackground,
                      }}
                    >
                      <Coffee
                        size={23}
                        className={`transition-all duration-500 ${
                          isNewStamp ? "rotate-12 scale-125" : ""
                        }`}
                        style={{
                          color: filled
                            ? rewardReady
                              ? "#6ee7b7"
                              : cafe.secondaryColor
                            : "#49433f",
                          fill: filled
                            ? rewardReady
                              ? "#6ee7b7"
                              : cafe.secondaryColor
                            : "transparent",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: rewardReady
                      ? "#10b981"
                      : cafe.primaryColor,
                  }}
                />
              </div>

              <p
                className="mt-3 text-sm"
                style={{
                  color: theme.mutedColor,
                }}
              >
                {rewardReady
                  ? `${cafe.rewardName} unlocked.`
                  : `${remainingStamps} more ${
                      remainingStamps === 1 ? "stamp" : "stamps"
                    } until your ${cafe.rewardName.toLowerCase()}.`}
              </p>
            </section>

            <section className="grid gap-3">
              <div
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] p-4"
                style={{
                  backgroundColor: theme.panelBackground,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${cafe.primaryColor}22`,
                    color: cafe.secondaryColor,
                  }}
                >
                  <CalendarDays size={19} />
                </div>

                <div>
                  <p
                    className="text-xs"
                    style={{
                      color: theme.mutedColor,
                    }}
                  >
                    Birthday
                  </p>

                  <p
                    className="mt-1 text-sm font-medium"
                    style={{
                      color: theme.headingColor,
                    }}
                  >
                    {birthdayText}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] p-4"
                style={{
                  backgroundColor: theme.panelBackground,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${cafe.primaryColor}22`,
                    color: cafe.secondaryColor,
                  }}
                >
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p
                    className="text-xs"
                    style={{
                      color: theme.mutedColor,
                    }}
                  >
                    Birthday countdown
                  </p>

                  <p
                    className="mt-1 text-sm font-medium"
                    style={{
                      color: theme.headingColor,
                    }}
                  >
                    {daysUntilBirthday === 0
                      ? "Happy birthday!"
                      : `${daysUntilBirthday} ${
                          daysUntilBirthday === 1 ? "day" : "days"
                        } to go`}
                  </p>
                </div>
              </div>
            </section>

            <section
              className="rounded-2xl border border-white/[0.06] p-4"
              style={{
                backgroundColor: theme.panelBackground,
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: theme.mutedColor,
                }}
              >
                Last updated
              </p>

              <p
                className="mt-1 text-sm font-medium"
                style={{
                  color: theme.headingColor,
                }}
              >
                {lastUpdated}
              </p>
            </section>

            <footer className="border-t border-white/[0.06] pt-5 text-center">
              <div
                className="flex items-center justify-center gap-1.5 text-xs"
                style={{
                  color: theme.mutedColor,
                }}
              >
                <Heart size={13} />
                <span>Thank you for being part of {cafe.name}</span>
              </div>

              <p
                className="mt-3 text-xs"
                style={{
                  color: theme.mutedColor,
                }}
              >
                Member since {memberSince}
              </p>

              <p className="mt-2 text-xs text-white/25">
                Powered by BeLoyal
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}