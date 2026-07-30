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
  Smartphone,
  Star,
  X,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
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
  googleReviewUrl: string | null;
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
  const unlockAt = Math.max(rewardTarget - 1, 1);

  if (stamps >= unlockAt) {
    return {
      title: "Reward unlocked",
      description: `Show this card to the cashier to redeem your ${lowerRewardName}.`,
    };
  }

  const remaining = unlockAt - stamps;

  if (remaining === 1) {
    return {
      title: "One more to go",
      description: `The last stamp unlocks your ${lowerRewardName}.`,
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

function getDirectLogoUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let url = value.trim();

  if (!url) {
    return null;
  }

  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname === "drive.google.com" ||
      parsedUrl.hostname === "www.drive.google.com"
    ) {
      const fileMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = fileMatch?.[1] || parsedUrl.searchParams.get("id");

      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
          fileId,
        )}&sz=w1000`;
      }
    }

    if (
      parsedUrl.hostname === "dropbox.com" ||
      parsedUrl.hostname === "www.dropbox.com"
    ) {
      parsedUrl.hostname = "dl.dropboxusercontent.com";
      parsedUrl.searchParams.delete("dl");
      parsedUrl.searchParams.delete("raw");
      return parsedUrl.toString();
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function DigitalCardPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params.token;

  const previousStampCount = useRef<number | null>(null);
  const requestInProgress = useRef(false);
  const hasLoadedCard = useRef(false);
  const activeController = useRef<AbortController | null>(null);
  const stampAnimationTimeout = useRef<number | null>(null);
  const isWelcomeVisit = useRef(searchParams.get("welcome") === "1");

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [newStampIndex, setNewStampIndex] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [showQrCode, setShowQrCode] = useState(false);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [showHomeScreenHelp, setShowHomeScreenHelp] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  const loadCard = useCallback(
    async (showRefreshing = false, forceFresh = false) => {
      if (!token) {
        return;
      }

      if (forceFresh && requestInProgress.current) {
        activeController.current?.abort();
        activeController.current = null;
        requestInProgress.current = false;
      }

      if (requestInProgress.current) {
        return;
      }

      requestInProgress.current = true;

      const controller = new AbortController();
      activeController.current = controller;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        const response = await fetch(
          `/api/customers/card/${encodeURIComponent(token)}?fresh=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load loyalty card.");
        }

        const incomingCustomer = data as Customer;
        const incomingRewardTarget = Math.max(
          incomingCustomer.cafe.rewardTarget,
          1,
        );
        const incomingUnlockAt = Math.max(incomingRewardTarget - 1, 1);
        const rewardWasJustRedeemed =
          previousStampCount.current !== null &&
          previousStampCount.current >= incomingUnlockAt &&
          incomingCustomer.stamps < previousStampCount.current;

        if (
          previousStampCount.current !== null &&
          incomingCustomer.stamps > previousStampCount.current
        ) {
          setNewStampIndex(incomingCustomer.stamps - 1);

          if (stampAnimationTimeout.current !== null) {
            window.clearTimeout(stampAnimationTimeout.current);
          }

          stampAnimationTimeout.current = window.setTimeout(() => {
            setNewStampIndex(null);
            stampAnimationTimeout.current = null;
          }, 1200);
        }

        if (rewardWasJustRedeemed) {
          const celebrationKey = `beloyal-reward-redeemed-v1:${incomingCustomer.publicToken}:${incomingCustomer.updatedAt}`;

          if (!window.sessionStorage.getItem(celebrationKey)) {
            window.sessionStorage.setItem(celebrationKey, "1");
            setShowRewardCelebration(true);
          }
        }

        previousStampCount.current = incomingCustomer.stamps;
        hasLoadedCard.current = true;

        setCustomer(incomingCustomer);
        setError("");
      } catch (caughtError) {
        const requestWasAborted =
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError";

        if (!requestWasAborted) {
          console.error("Card loading failed:", caughtError);

          // A failed background refresh should never replace a working card.
          if (!hasLoadedCard.current) {
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Failed to load your loyalty card.",
            );
          }
        }
      } finally {
        if (activeController.current === controller) {
          activeController.current = null;
          requestInProgress.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    let pollingTimeout: number | null = null;
    let stopped = false;

    const scheduleNextRefresh = () => {
      if (stopped) {
        return;
      }

      pollingTimeout = window.setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await loadCard();
        }

        scheduleNextRefresh();
      }, 5000);
    };

    void loadCard();
    scheduleNextRefresh();

    const refreshAfterResume = () => {
      void loadCard(false, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAfterResume();
      }
    };

    const handlePageShow = () => {
      refreshAfterResume();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", refreshAfterResume);
    window.addEventListener("online", refreshAfterResume);

    return () => {
      stopped = true;

      if (pollingTimeout !== null) {
        window.clearTimeout(pollingTimeout);
      }

      if (stampAnimationTimeout.current !== null) {
        window.clearTimeout(stampAnimationTimeout.current);
      }

      activeController.current?.abort();
      activeController.current = null;
      requestInProgress.current = false;

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", refreshAfterResume);
      window.removeEventListener("online", refreshAfterResume);
    };
  }, [loadCard]);

  useEffect(() => {
    if (!isWelcomeVisit.current) {
      return;
    }

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("welcome");

    window.history.replaceState(
      window.history.state,
      "",
      `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
    );
  }, []);

  useEffect(() => {
    if (!customer || !isWelcomeVisit.current) {
      return;
    }

    const storageKey = `beloyal-review-seen:${customer.publicToken}`;
    const alreadySeen = window.localStorage.getItem(storageKey);

    if (alreadySeen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowRatingModal(true);
      window.localStorage.setItem(storageKey, "1");
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [customer]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  useEffect(() => {
    const modalOpen =
      showQrCode ||
      showRewardCelebration ||
      showRatingModal ||
      showGooglePrompt ||
      showHomeScreenHelp;

    if (!modalOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setShowQrCode(false);
      setShowRewardCelebration(false);
      setShowRatingModal(false);
      setShowGooglePrompt(false);
      setShowHomeScreenHelp(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    showQrCode,
    showRewardCelebration,
    showRatingModal,
    showGooglePrompt,
    showHomeScreenHelp,
  ]);

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

  const handleRatingSelect = async (rating: number) => {
    if (!customer || reviewSubmitting) {
      return;
    }

    setSelectedRating(rating);
    setReviewSubmitting(true);
    setReviewError("");

    try {
      const response = await fetch(
        `/api/customers/card/${encodeURIComponent(
          customer.publicToken,
        )}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating }),
        },
      );

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? ((await response.json()) as { message?: string })
        : null;

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to save your rating right now.",
        );
      }

      setShowRatingModal(false);

      window.setTimeout(() => {
        setShowGooglePrompt(true);
      }, 250);
    } catch (caughtError) {
      console.error("Customer review submission failed:", caughtError);
      setReviewError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save your rating right now.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenGoogleReview = () => {
    const reviewUrl = customer?.cafe.googleReviewUrl?.trim();

    setShowGooglePrompt(false);

    if (!reviewUrl) {
      return;
    }

    window.open(reviewUrl, "_blank", "noopener,noreferrer");
  };

  const handleAddToHomeScreen = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    setShowHomeScreenHelp(true);
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
  const unlockAt = Math.max(rewardTarget - 1, 1);

  const visibleStamps = Math.min(customer.stamps, rewardTarget);

  const rewardReady = customer.stamps >= unlockAt;

  const cardGlowsGreen = rewardReady;

  const remainingStamps = Math.max(unlockAt - customer.stamps, 0);

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

  const rewardEmerald = "#163F36";

  const rewardEmeraldLight = "#2D6A5A";

  const rewardChampagne = "#D8BE82";

  const rewardIvory = "#F7EFD9";

  const logoUrl = getDirectLogoUrl(customer.cafe.logoUrl);
  const showLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);
  const cafeInitial = customer.cafe.name.trim().charAt(0).toUpperCase() || "B";

  return (
    <main
      className="min-h-screen w-full overflow-x-hidden px-3 py-3 transition-colors duration-700 min-[380px]:px-4 min-[380px]:py-5 sm:px-6 sm:py-10"
      style={{
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
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
      <div className="mx-auto w-full max-w-md">
        <div
          className="relative w-full overflow-hidden rounded-[26px] border shadow-[0_35px_120px_rgba(0,0,0,0.35)] transition-all duration-700 min-[380px]:rounded-[30px] sm:rounded-[34px]"
          style={{
            borderColor: cardBorder,
            backgroundColor: cardBackground,
            boxShadow: "0 35px 120px rgba(0,0,0,0.35)",
          }}
        >
          <header
            className="relative overflow-hidden border-b px-4 pb-5 pt-6 min-[380px]:px-5 min-[380px]:pb-6 min-[380px]:pt-7 sm:px-6 sm:pb-7 sm:pt-8"
            style={{
              borderColor: cardBorder,
            }}
          >
            {cardGlowsGreen ? (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-[-9rem] h-[21rem] w-[155%] -translate-x-1/2 rounded-[50%] blur-3xl"
                  style={{
                    background: `
                      radial-gradient(
                        ellipse at center,
                        rgba(216, 190, 130, 0.14) 0%,
                        rgba(64, 126, 104, 0.18) 24%,
                        rgba(22, 63, 54, 0.1) 48%,
                        transparent 72%
                      )
                    `,
                  }}
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[15%] right-[15%] top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(216,190,130,0.34), transparent)",
                    boxShadow: "0 8px 34px rgba(70,137,113,0.18)",
                  }}
                />
              </>
            ) : null}

            <div
              className="absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
              style={{
                backgroundColor: primaryGlow,
              }}
            />

            <div
              className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full blur-3xl"
              style={{
                backgroundColor: secondaryGlow,
              }}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    {showLogo && logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${customer.cafe.name} logo`}
                        className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.14)] min-[380px]:h-12 min-[380px]:w-12 sm:h-14 sm:w-14"
                        referrerPolicy="no-referrer"
                        onError={() => setFailedLogoUrl(logoUrl)}
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold min-[380px]:h-12 min-[380px]:w-12 min-[380px]:rounded-2xl min-[380px]:text-base sm:h-14 sm:w-14"
                        style={{
                          backgroundColor: primarySoft,
                          color: primaryColor,
                        }}
                      >
                        {cafeInitial}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2
                        className="break-words text-xl font-semibold tracking-[0.04em] min-[380px]:text-2xl min-[380px]:tracking-[0.07em] sm:text-3xl"
                        style={{
                          color: textPrimary,
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
                className="mt-7 break-words text-[1.65rem] font-semibold tracking-tight min-[380px]:mt-9 min-[380px]:text-3xl sm:mt-10"
                style={{
                  color: textPrimary,
                }}
              >
                {customer.name}
              </h1>
            </div>
          </header>

          <div className="space-y-5 p-4 min-[380px]:space-y-6 min-[380px]:p-5 sm:p-6">
            <section
              className="relative overflow-hidden rounded-3xl border p-5 transition-all duration-700"
              style={{
                borderColor: primaryBorder,
                backgroundColor: primarySoft,
              }}
            >
              <div
                className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl"
                style={{
                  backgroundColor: primaryGlow,
                }}
              />

              <div className="relative flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: surfaceRaised,
                    color: primaryColor,
                  }}
                >
                  {rewardReady ? <Gift size={23} /> : <Sparkles size={22} />}
                </div>

                <div className="min-w-0">
                  <p
                    className="font-semibold"
                    style={{
                      color: textPrimary,
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
                    borderColor: primaryBorder,
                    backgroundColor: primarySoft,
                    color: primaryColor,
                  }}
                >
                  {rewardReady
                    ? "Reward ready"
                    : `${visibleStamps}/${rewardTarget}`}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2 min-[380px]:gap-3">
                {Array.from({
                  length: rewardTarget,
                }).map((_, index) => {
                  const filled = index < visibleStamps;

                  const isNewStamp = newStampIndex === index;

                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-2xl border transition-all duration-500 ${
                        isNewStamp ? "scale-125" : "scale-100"
                      }`}
                      style={{
                        borderColor:
                          filled && cardGlowsGreen
                            ? "rgba(216,190,130,0.58)"
                            : filled
                              ? primaryColor
                              : cardBorder,

                        background:
                          filled && cardGlowsGreen
                            ? `linear-gradient(145deg, ${rewardEmeraldLight} 0%, ${rewardEmerald} 48%, #0B2822 100%)`
                            : filled
                              ? primaryColor
                              : emptyStampBackground,

                        boxShadow:
                          filled && cardGlowsGreen
                            ? isNewStamp
                              ? "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -12px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(216,190,130,0.2), 0 14px 30px rgba(6,31,26,0.42)"
                              : "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -12px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(216,190,130,0.14), 0 10px 22px rgba(6,31,26,0.3)"
                            : isNewStamp
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
                            ? cardGlowsGreen
                              ? rewardIvory
                              : accentText
                            : emptyStampText,

                          fill: filled
                            ? cardGlowsGreen
                              ? rewardIvory
                              : accentText
                            : "transparent",

                          opacity: filled ? 1 : 0.65,

                          filter:
                            filled && cardGlowsGreen
                              ? "drop-shadow(0 2px 4px rgba(0,0,0,0.34))"
                              : "none",
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
                    background: cardGlowsGreen
                      ? `linear-gradient(90deg, ${rewardEmerald} 0%, ${rewardEmeraldLight} 72%, ${rewardChampagne} 100%)`
                      : primaryColor,
                    boxShadow: cardGlowsGreen
                      ? "inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 12px rgba(13,58,49,0.34)"
                      : "none",
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

              <button
                type="button"
                onClick={handleAddToHomeScreen}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:opacity-85 active:translate-y-0 active:scale-[0.99]"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                  color: textPrimary,
                }}
              >
                <Smartphone size={18} />
                <span>Add to Home Screen</span>
              </button>

              <p
                className="px-3 text-center text-[11px] leading-5"
                style={{
                  color: textMuted,
                }}
              >
                Add your card to your Home Screen or show the QR code directly
                to the cashier.
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

      {showRewardCelebration ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#06110E]/90 px-5 py-8 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Reward redeemed"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRewardCelebration(false);
            }
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {Array.from({ length: 30 }).map((_, index) => {
              const colors = [
                rewardChampagne,
                rewardIvory,
                rewardEmeraldLight,
                "#FFFFFF",
              ];

              return (
                <span
                  key={index}
                  className="reward-confetti absolute -top-8 block rounded-[2px]"
                  style={{
                    left: `${(index * 37) % 100}%`,
                    width: `${6 + (index % 3) * 2}px`,
                    height: `${10 + (index % 4) * 3}px`,
                    backgroundColor: colors[index % colors.length],
                    animationDelay: `${(index % 10) * 0.11}s`,
                    animationDuration: `${2.7 + (index % 6) * 0.22}s`,
                  }}
                />
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(216,190,130,0.22) 0%, rgba(45,106,90,0.16) 38%, transparent 72%)",
            }}
          />

          <div className="reward-reveal relative w-full max-w-sm overflow-hidden rounded-[34px] border border-[#D8BE82]/35 bg-gradient-to-b from-[#173E35] via-[#0F2D27] to-[#081C18] p-7 text-center text-[#F7EFD9] shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F7EFD9]/70 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D8BE82]/15 blur-3xl" />

            <button
              type="button"
              onClick={() => setShowRewardCelebration(false)}
              aria-label="Close reward celebration"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#F7EFD9]/70 transition hover:bg-white/10 hover:text-[#F7EFD9]"
            >
              <X size={18} />
            </button>

            <div className="reward-gift mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#D8BE82]/45 bg-gradient-to-br from-[#D8BE82]/25 to-[#D8BE82]/5 shadow-[0_16px_55px_rgba(216,190,130,0.2)]">
              <Gift size={36} strokeWidth={1.6} color={rewardIvory} />
            </div>

            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#D8BE82]">
              Reward redeemed
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#F7EFD9]">
              Enjoy your {customer.cafe.rewardName || "reward"}
            </h2>

            <p className="mx-auto mt-3 max-w-[17rem] text-sm leading-6 text-[#F7EFD9]/65">
              Your reward was redeemed successfully. Your next loyalty journey
              starts now.
            </p>

            {customer.cafe.rewardDescription ? (
              <div className="mt-6 rounded-2xl border border-[#D8BE82]/20 bg-black/10 px-4 py-3 text-sm leading-6 text-[#F7EFD9]/75">
                {customer.cafe.rewardDescription}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowRewardCelebration(false)}
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#D8BE82] text-sm font-semibold text-[#102A24] shadow-[0_12px_35px_rgba(216,190,130,0.22)] transition hover:bg-[#E3CC98] active:scale-[0.99]"
            >
              <Sparkles size={17} />
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {showRatingModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Rate your visit"
        >
          <div
            className="w-full max-w-sm rounded-[30px] border p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: cardBorder,
              backgroundColor: cardBackground,
              color: textPrimary,
            }}
          >
            <p className="text-2xl font-semibold">How was your visit?</p>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: textSecondary }}
            >
              Tap a star to share quick feedback with {customer.cafe.name}.
            </p>

            <div
              className="mt-7 flex items-center justify-center gap-2"
              onMouseLeave={() => setHoveredRating(null)}
            >
              {[1, 2, 3, 4, 5].map((rating) => {
                const active = rating <= (hoveredRating ?? selectedRating ?? 0);

                return (
                  <button
                    key={rating}
                    type="button"
                    disabled={reviewSubmitting}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onFocus={() => setHoveredRating(rating)}
                    onBlur={() => setHoveredRating(null)}
                    onClick={() => void handleRatingSelect(rating)}
                    aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                    className="rounded-full p-1 transition hover:scale-110 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Star
                      size={38}
                      strokeWidth={1.8}
                      style={{
                        color: active ? "#FBBF24" : textMuted,
                        fill: active ? "#FBBF24" : "transparent",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {reviewSubmitting ? (
              <div
                className="mt-5 flex items-center justify-center gap-2 text-sm"
                role="status"
                style={{ color: textSecondary }}
              >
                <LoaderCircle size={16} className="animate-spin" />
                Saving your rating...
              </div>
            ) : null}

            {reviewError ? (
              <p
                className="mt-5 rounded-2xl border px-4 py-3 text-sm leading-5"
                role="alert"
                style={{
                  borderColor: withAlpha("#EF4444", 0.32),
                  backgroundColor: withAlpha("#EF4444", 0.1),
                  color: mixColors("#EF4444", textPrimary, 0.72),
                }}
              >
                {reviewError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={reviewSubmitting}
              onClick={() => setShowRatingModal(false)}
              className="mt-7 h-11 w-full rounded-2xl border text-sm font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-50"
              style={{
                borderColor: cardBorder,
                backgroundColor: surfaceColor,
                color: textSecondary,
              }}
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}

      {showGooglePrompt ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Google review"
        >
          <div
            className="w-full max-w-sm rounded-[30px] border p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: cardBorder,
              backgroundColor: cardBackground,
              color: textPrimary,
            }}
          >
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star
                  key={rating}
                  size={24}
                  style={{
                    color:
                      rating <= (selectedRating ?? 0) ? "#FBBF24" : textMuted,
                    fill:
                      rating <= (selectedRating ?? 0)
                        ? "#FBBF24"
                        : "transparent",
                  }}
                />
              ))}
            </div>

            <p className="mt-5 text-2xl font-semibold">
              Thanks for your feedback
            </p>

            <p
              className="mt-2 text-sm leading-6"
              style={{ color: textSecondary }}
            >
              Would you like to share your experience on Google?
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="h-12 rounded-2xl border text-sm font-semibold transition hover:opacity-80"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                  color: textSecondary,
                }}
              >
                Not now
              </button>

              <button
                type="button"
                onClick={handleOpenGoogleReview}
                disabled={!customer.cafe.googleReviewUrl}
                className="h-12 rounded-2xl text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  backgroundColor: primaryColor,
                  color: accentText,
                }}
              >
                Review on Google
              </button>
            </div>

            {!customer.cafe.googleReviewUrl ? (
              <p className="mt-4 text-xs" style={{ color: textMuted }}>
                This café has not added a Google review link yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showHomeScreenHelp ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Add to Home Screen instructions"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowHomeScreenHelp(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-[30px] border p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: cardBorder,
              backgroundColor: cardBackground,
              color: textPrimary,
            }}
          >
            <button
              type="button"
              onClick={() => setShowHomeScreenHelp(false)}
              aria-label="Close instructions"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border"
              style={{
                borderColor: cardBorder,
                backgroundColor: surfaceColor,
                color: textSecondary,
              }}
            >
              <X size={18} />
            </button>

            <Smartphone size={30} style={{ color: primaryColor }} />

            <p className="mt-5 text-xl font-semibold">Add to Home Screen</p>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: textSecondary }}
            >
              On iPhone: open this card in Safari, tap the Share button, choose
              “Add to Home Screen”, then tap “Add”.
            </p>

            <p
              className="mt-4 text-sm leading-6"
              style={{ color: textSecondary }}
            >
              On Android: open the browser menu and choose “Add to Home screen”
              or “Install app”.
            </p>

            <button
              type="button"
              onClick={() => setShowHomeScreenHelp(false)}
              className="mt-6 h-12 w-full rounded-2xl text-sm font-semibold"
              style={{
                backgroundColor: primaryColor,
                color: accentText,
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {showQrCode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-md min-[380px]:px-5 min-[380px]:py-8"
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
            className="relative w-full max-w-sm overflow-hidden rounded-[24px] border p-4 shadow-[0_30px_100px_rgba(0,0,0,0.55)] min-[380px]:rounded-[30px] min-[380px]:p-6"
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
              {showLogo && logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${customer.cafe.name} logo`}
                  className="mx-auto h-12 w-12 object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedLogoUrl(logoUrl)}
                />
              ) : (
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold"
                  style={{
                    backgroundColor: primarySoft,
                    color: primaryColor,
                  }}
                >
                  {cafeInitial}
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

              <div className="mx-auto mt-5 w-fit max-w-full rounded-[20px] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] min-[380px]:mt-6 min-[380px]:rounded-[24px] min-[380px]:p-4">
                <QRCode
                  value={`BL:${customer.publicToken}`}
                  size={200}
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

      <style jsx global>{`
        @keyframes reward-confetti-fall {
          0% {
            opacity: 0;
            transform: translate3d(0, -8vh, 0) rotate(0deg);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(35px, 108vh, 0) rotate(760deg);
          }
        }

        @keyframes reward-reveal {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes reward-gift {
          0% {
            transform: scale(0.72) rotate(-8deg);
          }
          55% {
            transform: scale(1.08) rotate(4deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        .reward-confetti {
          animation-name: reward-confetti-fall;
          animation-timing-function: cubic-bezier(0.18, 0.7, 0.3, 1);
          animation-fill-mode: both;
          animation-iteration-count: 1;
        }

        .reward-reveal {
          animation: reward-reveal 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .reward-gift {
          animation: reward-gift 720ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both;
        }

        @media (prefers-reduced-motion: reduce) {
          .reward-confetti {
            display: none;
          }

          .reward-reveal,
          .reward-gift {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
