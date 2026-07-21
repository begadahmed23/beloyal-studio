"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  Gift,
  Heart,
  LoaderCircle,
  QrCode,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
type Cafe = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
};

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string;
  name: string;
  birthday: string;
  stamps: number;
  createdAt: string;
  updatedAt: string;
  cafe: Cafe;
};

type RGB = {
  r: number;
  g: number;
  b: number;
};

function calculateBirthdayCountdown(birthday: string) {
  const birthdayDate = new Date(birthday);
  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const nextBirthday = new Date(
    today.getFullYear(),
    birthdayDate.getUTCMonth(),
    birthdayDate.getUTCDate(),
  );

  if (nextBirthday < todayStart) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return Math.ceil(
    (nextBirthday.getTime() - todayStart.getTime()) / 86_400_000,
  );
}

function getProgressMessage(
  stamps: number,
  rewardTarget: number,
  rewardName: string,
) {
  const safeRewardName = rewardName?.trim() || "reward";

  const lowerRewardName = safeRewardName.toLowerCase();

  if (stamps >= rewardTarget) {
    return {
      title: `${safeRewardName} is ready`,
      description: `Show this card to the cashier to redeem your ${lowerRewardName}.`,
    };
  }

  const remaining = rewardTarget - stamps;

  if (remaining === 1) {
    return {
      title: "One more stamp",
      description: `Your ${lowerRewardName} is almost ready.`,
    };
  }

  if (stamps >= Math.ceil(rewardTarget / 2)) {
    return {
      title: "More than halfway there",
      description: `Keep going. Your ${lowerRewardName} is getting closer.`,
    };
  }

  if (stamps > 0) {
    return {
      title: "Great start",
      description: `Every eligible purchase brings you closer to your ${lowerRewardName}.`,
    };
  }

  return {
    title: "Your journey starts here",
    description: "Make an eligible purchase to receive your first stamp.",
  };
}

function normalizeHex(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  const shortHexMatch = trimmed.match(/^#([0-9a-fA-F]{3})$/);

  if (shortHexMatch) {
    const characters = shortHexMatch[1].split("");

    return `#${characters.map((character) => character + character).join("")}`;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

function hexToRgb(hex: string): RGB {
  const cleanHex = normalizeHex(hex, "#000000").replace("#", "");

  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB) {
  const convert = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, "0");

  return `#${convert(r)}${convert(g)}${convert(b)}`;
}

function mixColors(
  firstColor: string,
  secondColor: string,
  firstWeight: number,
) {
  const first = hexToRgb(firstColor);
  const second = hexToRgb(secondColor);

  const safeWeight = Math.max(0, Math.min(1, firstWeight));

  return rgbToHex({
    r: first.r * safeWeight + second.r * (1 - safeWeight),
    g: first.g * safeWeight + second.g * (1 - safeWeight),
    b: first.b * safeWeight + second.b * (1 - safeWeight),
  });
}

function withAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const convertChannel = (channel: number) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * convertChannel(r) +
    0.7152 * convertChannel(g) +
    0.0722 * convertChannel(b)
  );
}

function isLightColor(hex: string) {
  return getLuminance(hex) > 0.42;
}

function getReadableText(hex: string) {
  return isLightColor(hex) ? "#171717" : "#FFFFFF";
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

  const [showQrCode, setShowQrCode] = useState(false);

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
          },
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
            : "Failed to load loyalty card.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
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

  useEffect(() => {
    if (!showQrCode) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowQrCode(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showQrCode]);

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

  const handleAddToAppleWallet = () => {
    window.location.href = `/api/wallet/${encodeURIComponent(
      customer?.publicToken || token,
    )}`;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <LoaderCircle size={30} className="mx-auto animate-spin" />

          <p className="mt-4 text-sm text-white/60">
            Loading your loyalty card...
          </p>
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141414] p-7 text-center">
          <p className="text-xl font-semibold">Card not found</p>

          <p className="mt-3 text-sm leading-6 text-white/60">
            {error || "This loyalty-card link may be incorrect."}
          </p>

          <button
            type="button"
            onClick={() => loadCard(true)}
            className="mt-6 h-11 w-full rounded-xl bg-white text-sm font-semibold text-black transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const rewardTarget = Math.max(customer.cafe.rewardTarget, 1);

  const visibleStamps = Math.min(customer.stamps, rewardTarget);

  const rewardReady = customer.stamps >= rewardTarget;

  const remainingStamps = Math.max(rewardTarget - customer.stamps, 0);

  const progressMessage = getProgressMessage(
    customer.stamps,
    rewardTarget,
    customer.cafe.rewardName,
  );

  const progressPercentage = (visibleStamps / rewardTarget) * 100;

  const primaryColor = normalizeHex(customer.cafe.primaryColor, "#2563EB");

  const secondaryColor = normalizeHex(customer.cafe.secondaryColor, "#60A5FA");

  const backgroundColor = normalizeHex(
    customer.cafe.backgroundColor,
    "#0B1220",
  );

  const pageIsLight = isLightColor(backgroundColor);

  const cardBackground = mixColors(
    backgroundColor,
    pageIsLight ? "#FFFFFF" : primaryColor,
    pageIsLight ? 0.9 : 0.86,
  );

  const cardIsLight = isLightColor(cardBackground);

  const textPrimary = getReadableText(cardBackground);

  const textSecondary = cardIsLight
    ? withAlpha("#171717", 0.68)
    : withAlpha("#FFFFFF", 0.7);

  const textMuted = cardIsLight
    ? withAlpha("#171717", 0.5)
    : withAlpha("#FFFFFF", 0.48);

  const cardBorder = cardIsLight
    ? withAlpha("#000000", 0.1)
    : withAlpha("#FFFFFF", 0.1);

  const surfaceColor = cardIsLight
    ? withAlpha("#000000", 0.035)
    : withAlpha("#FFFFFF", 0.045);

  const surfaceRaised = cardIsLight
    ? withAlpha("#FFFFFF", 0.64)
    : withAlpha("#FFFFFF", 0.07);

  const emptyStampBackground = cardIsLight
    ? mixColors(cardBackground, "#000000", 0.92)
    : mixColors(cardBackground, "#000000", 0.68);

  const emptyStampText = getReadableText(emptyStampBackground);

  const accentText = getReadableText(primaryColor);

  const primarySoft = withAlpha(primaryColor, cardIsLight ? 0.13 : 0.2);

  const primaryBorder = withAlpha(primaryColor, cardIsLight ? 0.32 : 0.42);

  const primaryGlow = withAlpha(primaryColor, 0.32);

  const secondaryGlow = withAlpha(secondaryColor, 0.25);

  return (
    <main
      className="min-h-screen px-4 py-6 transition-colors duration-700 sm:px-6 sm:py-10"
      style={{
        color: textPrimary,
        background: `
          radial-gradient(
            circle at 50% -10%,
            ${withAlpha(primaryColor, 0.42)} 0%,
            transparent 38%
          ),
          radial-gradient(
            circle at 100% 55%,
            ${withAlpha(secondaryColor, 0.22)} 0%,
            transparent 42%
          ),
          ${backgroundColor}
        `,
      }}
    >
      <div className="mx-auto max-w-md">
        <div
          className="relative overflow-hidden rounded-[34px] border shadow-[0_35px_120px_rgba(0,0,0,0.35)] transition-all duration-700"
          style={{
            borderColor: cardBorder,
            backgroundColor: cardBackground,
          }}
        >
          {rewardReady && (
            <>
              <div className="pointer-events-none absolute left-[12%] top-10 h-2 w-2 animate-ping rounded-full bg-emerald-400/60" />

              <div className="pointer-events-none absolute right-[18%] top-24 h-2 w-2 animate-ping rounded-full bg-amber-300/60 [animation-delay:300ms]" />

              <div className="pointer-events-none absolute bottom-40 left-[20%] h-2 w-2 animate-ping rounded-full bg-emerald-300/60 [animation-delay:600ms]" />

              <div className="pointer-events-none absolute bottom-24 right-[12%] h-2 w-2 animate-ping rounded-full bg-amber-300/60 [animation-delay:900ms]" />
            </>
          )}

          <header
            className="relative overflow-hidden border-b px-6 pb-7 pt-8"
            style={{
              borderColor: cardBorder,
            }}
          >
            <div
              className="absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
              style={{
                backgroundColor: rewardReady
                  ? "rgba(16,185,129,0.18)"
                  : primaryGlow,
              }}
            />

            <div
              className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full blur-3xl"
              style={{
                backgroundColor: secondaryGlow,
              }}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-4">
                    {customer.cafe.logoUrl ? (
                      <img
                        src={customer.cafe.logoUrl}
                        alt={`${customer.cafe.name} logo`}
                        className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.14)] sm:h-14 sm:w-14"
                      />
                    ) : null}

                    <div className="min-w-0">
                      <h2
                        className="break-words text-2xl font-semibold tracking-[0.07em] sm:text-3xl"
                        style={{
                          color: rewardReady ? "#10B981" : textPrimary,
                        }}
                      >
                        {customer.cafe.name}
                      </h2>

                      <p
                        className="mt-2 text-[10px] font-semibold tracking-[0.16em]"
                        style={{
                          color: primaryColor,
                        }}
                      >
                        DIGITAL LOYALTY CARD
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadCard(true)}
                  disabled={refreshing}
                  aria-label="Refresh loyalty card"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:opacity-75 disabled:opacity-50"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: surfaceColor,
                    color: textSecondary,
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
                  color: textPrimary,
                }}
              >
                {customer.name}
              </h1>
            </div>
          </header>

          <div className="space-y-6 p-6">
            <section
              className="relative overflow-hidden rounded-3xl border p-5 transition-all duration-700"
              style={{
                borderColor: rewardReady
                  ? "rgba(16,185,129,0.35)"
                  : primaryBorder,

                backgroundColor: rewardReady
                  ? cardIsLight
                    ? "rgba(16,185,129,0.10)"
                    : "rgba(16,185,129,0.12)"
                  : primarySoft,
              }}
            >
              <div
                className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl"
                style={{
                  backgroundColor: rewardReady
                    ? "rgba(52,211,153,0.16)"
                    : primaryGlow,
                }}
              />

              <div className="relative flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: surfaceRaised,
                    color: rewardReady ? "#10B981" : primaryColor,
                  }}
                >
                  {rewardReady ? <Gift size={23} /> : <Sparkles size={22} />}
                </div>

                <div className="min-w-0">
                  <p
                    className="font-semibold"
                    style={{
                      color: rewardReady ? "#10B981" : textPrimary,
                    }}
                  >
                    {progressMessage.title}
                  </p>

                  <p
                    className="mt-1 text-xs leading-5"
                    style={{
                      color: textSecondary,
                    }}
                  >
                    {progressMessage.description}
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
                      color: textPrimary,
                    }}
                  >
                    Your stamp card
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: textMuted,
                    }}
                  >
                    {customer.cafe.eligiblePurchaseDescription ||
                      "One stamp per eligible purchase"}
                  </p>
                </div>

                <span
                  className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: rewardReady
                      ? "rgba(16,185,129,0.35)"
                      : primaryBorder,

                    backgroundColor: rewardReady
                      ? "rgba(16,185,129,0.12)"
                      : primarySoft,

                    color: rewardReady ? "#10B981" : primaryColor,
                  }}
                >
                  {rewardReady
                    ? "Reward ready"
                    : `${visibleStamps}/${rewardTarget}`}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-3">
                {Array.from({
                  length: rewardTarget,
                }).map((_, index) => {
                  const filled = index < visibleStamps;

                  const isNewStamp = newStampIndex === index;

                  const filledBackground = rewardReady
                    ? "#10B981"
                    : primaryColor;

                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-2xl border transition-all duration-500 ${
                        isNewStamp ? "scale-125" : "scale-100"
                      }`}
                      style={{
                        borderColor: filled
                          ? rewardReady
                            ? "rgba(16,185,129,0.55)"
                            : primaryColor
                          : cardBorder,

                        backgroundColor: filled
                          ? filledBackground
                          : emptyStampBackground,

                        boxShadow: isNewStamp
                          ? `0 0 30px ${primaryGlow}`
                          : "none",
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
                              ? "#FFFFFF"
                              : accentText
                            : emptyStampText,

                          fill: filled
                            ? rewardReady
                              ? "#FFFFFF"
                              : accentText
                            : "transparent",

                          opacity: filled ? 1 : 0.65,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div
                className="mt-5 h-2 overflow-hidden rounded-full"
                style={{
                  backgroundColor: surfaceColor,
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: rewardReady ? "#10B981" : primaryColor,
                  }}
                />
              </div>

              <p
                className="mt-3 text-sm"
                style={{
                  color: textSecondary,
                }}
              >
                {rewardReady
                  ? `You completed your card. Your ${
                      customer.cafe.rewardName || "reward"
                    } is ready.`
                  : `${remainingStamps} more ${
                      remainingStamps === 1 ? "stamp" : "stamps"
                    } until your ${
                      customer.cafe.rewardName?.toLowerCase() || "reward"
                    }.`}
              </p>
            </section>

            {customer.cafe.rewardDescription ? (
              <section
                className="rounded-2xl border p-4"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                }}
              >
                <p
                  className="text-xs"
                  style={{
                    color: textMuted,
                  }}
                >
                  Your reward
                </p>

                <p
                  className="mt-1 text-sm leading-6"
                  style={{
                    color: textSecondary,
                  }}
                >
                  {customer.cafe.rewardDescription}
                </p>
              </section>
            ) : null}

            <section className="grid gap-3">
              <div
                className="flex items-center gap-4 rounded-2xl border p-4"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: primarySoft,
                    color: primaryColor,
                  }}
                >
                  <CalendarDays size={19} />
                </div>

                <div>
                  <p
                    className="text-xs"
                    style={{
                      color: textMuted,
                    }}
                  >
                    Birthday
                  </p>

                  <p
                    className="mt-1 text-sm font-medium"
                    style={{
                      color: textPrimary,
                    }}
                  >
                    {birthdayText}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-4 rounded-2xl border p-4"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: primarySoft,
                    color: primaryColor,
                  }}
                >
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p
                    className="text-xs"
                    style={{
                      color: textMuted,
                    }}
                  >
                    Birthday countdown
                  </p>

                  <p
                    className="mt-1 text-sm font-medium"
                    style={{
                      color: textPrimary,
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
              className="rounded-2xl border p-4"
              style={{
                borderColor: cardBorder,
                backgroundColor: surfaceColor,
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: textMuted,
                }}
              >
                Last updated
              </p>

              <p
                className="mt-1 text-sm font-medium"
                style={{
                  color: textPrimary,
                }}
              >
                {lastUpdated}
              </p>
            </section>

            <section
              className="space-y-3 border-t pt-6"
              style={{
                borderColor: cardBorder,
              }}
            >
             <button
  type="button"
  onClick={handleAddToAppleWallet}
  className="flex h-14 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:scale-[0.99]"
  style={{
    backgroundColor: primaryColor,
    color: accentText,
    boxShadow: `0 14px 35px ${withAlpha(primaryColor, 0.24)}`,
  }}
>
  Add to Apple Wallet
</button>

              <button
                type="button"
                onClick={() => setShowQrCode(true)}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:opacity-85 active:translate-y-0 active:scale-[0.99]"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                  color: textPrimary,
                }}
              >
                <QrCode size={18} />

                <span>Show QR Code</span>
              </button>

              <p
                className="px-3 text-center text-[11px] leading-5"
                style={{
                  color: textMuted,
                }}
              >
                Save your card to Apple Wallet, or show the QR code directly to
                the cashier.
              </p>
            </section>

            <footer
              className="border-t pt-5 text-center"
              style={{
                borderColor: cardBorder,
              }}
            >
              <div
                className="flex items-center justify-center gap-1.5 text-xs"
                style={{
                  color: textMuted,
                }}
              >
                <Heart size={13} />

                <span>Thank you for being part of {customer.cafe.name}</span>
              </div>

              <p
                className="mt-3 text-xs"
                style={{
                  color: textMuted,
                }}
              >
                Member since {memberSince}
              </p>

              <p
                className="mt-2 text-xs"
                style={{
                  color: textMuted,
                  opacity: 0.75,
                }}
              >
                This card updates automatically.
              </p>
            </footer>
          </div>
        </div>
      </div>

      {showQrCode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Loyalty card QR code"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowQrCode(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[30px] border p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: cardBorder,
              backgroundColor: cardBackground,
              color: textPrimary,
            }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
              style={{
                backgroundColor: primaryGlow,
              }}
            />

            <button
              type="button"
              onClick={() => setShowQrCode(false)}
              aria-label="Close QR code"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border transition hover:opacity-75"
              style={{
                borderColor: cardBorder,
                backgroundColor: surfaceColor,
                color: textSecondary,
              }}
            >
              <X size={18} />
            </button>

            <div className="relative text-center">
              {customer.cafe.logoUrl ? (
                <img
                  src={customer.cafe.logoUrl}
                  alt={`${customer.cafe.name} logo`}
                  className="mx-auto h-12 w-12 object-contain"
                />
              ) : (
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold"
                  style={{
                    backgroundColor: primarySoft,
                    color: primaryColor,
                  }}
                >
                  {customer.cafe.name.trim().charAt(0).toUpperCase()}
                </div>
              )}

              <p
                className="mt-4 text-lg font-semibold"
                style={{
                  color: textPrimary,
                }}
              >
                Your loyalty code
              </p>

              <p
                className="mt-2 text-sm leading-6"
                style={{
                  color: textSecondary,
                }}
              >
                Show this code to the cashier when you make an eligible
                purchase.
              </p>

              <div className="mx-auto mt-6 w-fit rounded-[24px] bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
                <QRCode
                  value={`BL:${customer.publicToken}`}
                  size={220}
                  bgColor="#FFFFFF"
                  fgColor="#111111"
                  level="M"
                />
              </div>

              <div
                className="mt-5 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    color: textMuted,
                  }}
                >
                  Member number
                </p>

                <p
                  className="mt-1 text-sm font-semibold tracking-[0.08em]"
                  style={{
                    color: textPrimary,
                  }}
                >
                  {customer.memberNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowQrCode(false)}
                className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold transition hover:opacity-90 active:scale-[0.99]"
                style={{
                  backgroundColor: primaryColor,
                  color: accentText,
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
