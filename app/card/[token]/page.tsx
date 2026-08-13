"use client";

import {
  calculateBirthdayCountdown,
  getProgressMessage,
  withAlpha,
} from "./card-utils";
import {
  getDirectLogoUrl,
  getReadableText,
  isLightColor,
  mixColors,
  normalizeHex,
} from "./card-theme-utils";

import QrCodeModal from "./components/QrCodeModal";
import RewardCelebrationModal from "./components/RewardCelebrationModal";
import GoogleReviewModal from "./components/GoogleReviewModal";
import RatingModal from "./components/RatingModal";
import LoyaltyCard, {
  type Customer,
} from "./components/LoyaltyCard";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  MessageCircle,
  X,
} from "lucide-react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

type FeedbackResponse = {
  success?: boolean;
  message?: string;
  rewardGranted?: boolean;
  stamps?: number;
  feedbackRewardedAt?: string | null;
  googleReviewUrl?: string | null;
  error?: string;
};

export default function DigitalCardPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params.token;

  const previousStampCount =
    useRef<number | null>(null);

  const requestInProgress = useRef(false);

  const hasLoadedCard = useRef(false);

  const activeController =
    useRef<AbortController | null>(null);

  const stampAnimationTimeout =
    useRef<number | null>(null);

  const isWelcomeVisit = useRef(
    searchParams.get("welcome") === "1",
  );

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [newStampIndex, setNewStampIndex] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [showQrCode, setShowQrCode] =
    useState(false);

  const [
    showRewardCelebration,
    setShowRewardCelebration,
  ] = useState(false);

  const [showRatingModal, setShowRatingModal] =
    useState(false);

  const [showGooglePrompt, setShowGooglePrompt] =
    useState(false);

  const [selectedRating, setSelectedRating] =
    useState<number | null>(null);

  const [hoveredRating, setHoveredRating] =
    useState<number | null>(null);

  const [reviewSubmitting, setReviewSubmitting] =
    useState(false);

  const [reviewError, setReviewError] =
    useState("");

  /*
   * Feedback state.
   */
  const [showFeedbackModal, setShowFeedbackModal] =
    useState(false);

  const [feedbackComment, setFeedbackComment] =
    useState("");

  const [
    feedbackSubmitting,
    setFeedbackSubmitting,
  ] = useState(false);

  const [feedbackError, setFeedbackError] =
    useState("");

  const [
    feedbackSubmitted,
    setFeedbackSubmitted,
  ] = useState(false);

  const [
    feedbackRewardGranted,
    setFeedbackRewardGranted,
  ] = useState(false);

  const [
    feedbackGoogleReviewUrl,
    setFeedbackGoogleReviewUrl,
  ] = useState<string | null>(null);

  const [
    failedLogoUrl,
    setFailedLogoUrl,
  ] = useState<string | null>(null);

  const loadCard = useCallback(
    async (
      showRefreshing = false,
      forceFresh = false,
    ) => {
      if (!token) {
        return;
      }

      if (
        forceFresh &&
        requestInProgress.current
      ) {
        activeController.current?.abort();

        activeController.current = null;

        requestInProgress.current = false;
      }

      if (requestInProgress.current) {
        return;
      }

      requestInProgress.current = true;

      const controller =
        new AbortController();

      activeController.current =
        controller;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        const response = await fetch(
          `/api/customers/card/${encodeURIComponent(
            token,
          )}?fresh=${Date.now()}`,
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
          throw new Error(
            data.message ||
              "Failed to load loyalty card.",
          );
        }

        const incomingCustomer =
          data as Customer;

        const incomingRewardTarget =
          Math.max(
            incomingCustomer.cafe
              .rewardTarget,
            1,
          );

        const incomingUnlockAt =
          Math.max(
            incomingRewardTarget - 1,
            1,
          );

        const rewardWasJustRedeemed =
          previousStampCount.current !==
            null &&
          previousStampCount.current >=
            incomingUnlockAt &&
          incomingCustomer.stamps <
            previousStampCount.current;

        if (
          previousStampCount.current !==
            null &&
          incomingCustomer.stamps >
            previousStampCount.current
        ) {
          setNewStampIndex(
            incomingCustomer.stamps - 1,
          );

          if (
            stampAnimationTimeout.current !==
            null
          ) {
            window.clearTimeout(
              stampAnimationTimeout.current,
            );
          }

          stampAnimationTimeout.current =
            window.setTimeout(() => {
              setNewStampIndex(null);

              stampAnimationTimeout.current =
                null;
            }, 1200);
        }

        if (rewardWasJustRedeemed) {
          const celebrationKey =
            `beloyal-reward-redeemed-v1:` +
            `${incomingCustomer.publicToken}:` +
            `${incomingCustomer.updatedAt}`;

          if (
            !window.sessionStorage.getItem(
              celebrationKey,
            )
          ) {
            window.sessionStorage.setItem(
              celebrationKey,
              "1",
            );

            setShowRewardCelebration(
              true,
            );
          }
        }

        previousStampCount.current =
          incomingCustomer.stamps;

        hasLoadedCard.current = true;

        setCustomer(incomingCustomer);

        setError("");
      } catch (caughtError) {
        const requestWasAborted =
          caughtError instanceof DOMException &&
          caughtError.name ===
            "AbortError";

        if (!requestWasAborted) {
          console.error(
            "Card loading failed:",
            caughtError,
          );

          if (
            !hasLoadedCard.current
          ) {
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Failed to load your loyalty card.",
            );
          }
        }
      } finally {
        if (
          activeController.current ===
          controller
        ) {
          activeController.current =
            null;

          requestInProgress.current =
            false;

          setLoading(false);

          setRefreshing(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    let pollingTimeout:
      | number
      | null = null;

    let stopped = false;

    const scheduleNextRefresh = () => {
      if (stopped) {
        return;
      }

      pollingTimeout =
        window.setTimeout(async () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
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

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          refreshAfterResume();
        }
      };

    const handlePageShow = () => {
      refreshAfterResume();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "pageshow",
      handlePageShow,
    );

    window.addEventListener(
      "focus",
      refreshAfterResume,
    );

    window.addEventListener(
      "online",
      refreshAfterResume,
    );

    return () => {
      stopped = true;

      if (
        pollingTimeout !== null
      ) {
        window.clearTimeout(
          pollingTimeout,
        );
      }

      if (
        stampAnimationTimeout.current !==
        null
      ) {
        window.clearTimeout(
          stampAnimationTimeout.current,
        );
      }

      activeController.current?.abort();

      activeController.current = null;

      requestInProgress.current = false;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "pageshow",
        handlePageShow,
      );

      window.removeEventListener(
        "focus",
        refreshAfterResume,
      );

      window.removeEventListener(
        "online",
        refreshAfterResume,
      );
    };
  }, [loadCard]);

  /*
   * Remove ?welcome=1 from the URL after
   * first opening.
   */
  useEffect(() => {
    if (!isWelcomeVisit.current) {
      return;
    }

    const cleanUrl = new URL(
      window.location.href,
    );

    cleanUrl.searchParams.delete(
      "welcome",
    );

    window.history.replaceState(
      window.history.state,
      "",
      `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
    );
  }, []);

  /*
   * Existing first-time star rating popup.
   * This stays unchanged.
   */
  useEffect(() => {
    if (
      !customer ||
      !isWelcomeVisit.current
    ) {
      return;
    }

    const storageKey =
      `beloyal-review-seen:` +
      customer.publicToken;

    const alreadySeen =
      window.localStorage.getItem(
        storageKey,
      );

    if (alreadySeen) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        setShowRatingModal(true);

        window.localStorage.setItem(
          storageKey,
          "1",
        );
      }, 1000);

    return () =>
      window.clearTimeout(timeout);
  }, [customer]);

  /*
   * Lock page scrolling while a modal
   * is open.
   */
  useEffect(() => {
    const modalOpen =
      showQrCode ||
      showRewardCelebration ||
      showRatingModal ||
      showGooglePrompt ||
      showFeedbackModal;

    if (!modalOpen) {
      return;
    }

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousHtmlOverflow =
      document.documentElement.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    document.documentElement.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      setShowQrCode(false);

      setShowRewardCelebration(false);

      setShowRatingModal(false);

      setShowGooglePrompt(false);

      if (!feedbackSubmitting) {
        closeFeedbackModal();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousBodyOverflow;

      document.documentElement.style.overflow =
        previousHtmlOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    showQrCode,
    showRewardCelebration,
    showRatingModal,
    showGooglePrompt,
    showFeedbackModal,
    feedbackSubmitting,
  ]);

  const birthdayText = useMemo(() => {
    if (!customer) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
      },
    ).format(
      new Date(customer.birthday),
    );
  }, [customer]);

  const memberSince = useMemo(() => {
    if (!customer) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(customer.createdAt),
    );
  }, [customer]);

  const lastUpdated = useMemo(() => {
    if (!customer) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(
      new Date(customer.updatedAt),
    );
  }, [customer]);

  const daysUntilBirthday =
    useMemo(() => {
      if (!customer) {
        return 0;
      }

      return calculateBirthdayCountdown(
        customer.birthday,
      );
    }, [customer]);

  /*
   * Existing star rating submission.
   */
  const handleRatingSelect = async (
    rating: number,
  ) => {
    if (
      !customer ||
      reviewSubmitting
    ) {
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            rating,
          }),
        },
      );

      const contentType =
        response.headers.get(
          "content-type",
        ) ?? "";

      const data =
        contentType.includes(
          "application/json",
        )
          ? ((await response.json()) as {
              message?: string;
            })
          : null;

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save your rating right now.",
        );
      }

      setShowRatingModal(false);

      window.setTimeout(() => {
        setShowGooglePrompt(true);
      }, 250);
    } catch (caughtError) {
      console.error(
        "Customer review submission failed:",
        caughtError,
      );

      setReviewError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save your rating right now.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenGoogleReview =
    () => {
      const reviewUrl =
        customer?.cafe.googleReviewUrl?.trim();

      setShowGooglePrompt(false);

      if (!reviewUrl) {
        return;
      }

      window.open(
        reviewUrl,
        "_blank",
        "noopener,noreferrer",
      );
    };

  /*
   * Open feedback modal fresh each time.
   */
  const openFeedbackModal = () => {
    setFeedbackComment("");

    setFeedbackError("");

    setFeedbackSubmitted(false);

    setFeedbackRewardGranted(false);

    setFeedbackGoogleReviewUrl(
      customer?.cafe.googleReviewUrl ??
        null,
    );

    setShowFeedbackModal(true);
  };

  function closeFeedbackModal() {
    if (feedbackSubmitting) {
      return;
    }

    setShowFeedbackModal(false);

    setFeedbackComment("");

    setFeedbackError("");

    setFeedbackSubmitted(false);

    setFeedbackRewardGranted(false);
  }

  /*
   * Submit comment to our feedback API.
   */
  const handleFeedbackSubmit =
    async () => {
      if (
        !customer ||
        feedbackSubmitting
      ) {
        return;
      }

      const cleanComment =
        feedbackComment.trim();

      if (cleanComment.length < 10) {
        setFeedbackError(
          "Tell us a little more — even a short note helps.",
        );

        return;
      }

      setFeedbackSubmitting(true);

      setFeedbackError("");

      try {
        const response = await fetch(
          `/api/card/${encodeURIComponent(
            customer.publicToken,
          )}/feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              comment: cleanComment,
            }),
          },
        );

        const data =
          (await response.json()) as FeedbackResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "We couldn't send your feedback right now.",
          );
        }

        setFeedbackRewardGranted(
          Boolean(data.rewardGranted),
        );

        setFeedbackGoogleReviewUrl(
          data.googleReviewUrl ??
            customer.cafe
              .googleReviewUrl ??
            null,
        );

        setFeedbackSubmitted(true);

        setFeedbackComment("");

        /*
         * Reload the card from the server.
         *
         * If the first-feedback stamp was
         * awarded, the normal card animation
         * system will detect the new stamp.
         */
        await loadCard(false, true);
      } catch (caughtError) {
        console.error(
          "Customer feedback submission failed:",
          caughtError,
        );

        setFeedbackError(
          caughtError instanceof Error
            ? caughtError.message
            : "We couldn't send your feedback right now.",
        );
      } finally {
        setFeedbackSubmitting(false);
      }
    };

  const handleFeedbackGoogleReview =
    () => {
      const reviewUrl =
        feedbackGoogleReviewUrl?.trim();

      if (!reviewUrl) {
        return;
      }

      window.open(
        reviewUrl,
        "_blank",
        "noopener,noreferrer",
      );
    };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin"
          />

          <p className="mt-4 text-sm text-white/60">
            Loading your loyalty
            card...
          </p>
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141414] p-7 text-center">
          <p className="text-xl font-semibold">
            Card not found
          </p>

          <p className="mt-3 text-sm leading-6 text-white/60">
            {error ||
              "This loyalty-card link may be incorrect."}
          </p>

          <button
            type="button"
            onClick={() =>
              loadCard(true)
            }
            className="mt-6 h-11 w-full rounded-xl bg-white text-sm font-semibold text-black transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const rewardTarget = Math.max(
    customer.cafe.rewardTarget,
    1,
  );

  const unlockAt = Math.max(
    rewardTarget - 1,
    1,
  );

  const visibleStamps = Math.min(
    customer.stamps,
    rewardTarget,
  );

  const rewardReady =
    customer.stamps >= unlockAt;

  const cardGlowsGreen = rewardReady;

  const remainingStamps = Math.max(
    unlockAt - customer.stamps,
    0,
  );

  const progressMessage =
    getProgressMessage(
      customer.stamps,
      rewardTarget,
      customer.cafe.rewardName,
    );

  const progressPercentage =
    (visibleStamps / rewardTarget) *
    100;

  const primaryColor = normalizeHex(
    customer.cafe.primaryColor,
    "#2563EB",
  );

  const secondaryColor =
    normalizeHex(
      customer.cafe.secondaryColor,
      "#60A5FA",
    );

  const backgroundColor =
    normalizeHex(
      customer.cafe.backgroundColor,
      "#0B1220",
    );

  const pageIsLight =
    isLightColor(backgroundColor);

  const cardBackground = mixColors(
    backgroundColor,
    primaryColor,
    pageIsLight ? 0.78 : 0.7,
  );

  const cardIsLight =
    isLightColor(cardBackground);

  const textPrimary =
    getReadableText(cardBackground);

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

  const emptyStampBackground =
    cardIsLight
      ? mixColors(
          cardBackground,
          "#000000",
          0.92,
        )
      : mixColors(
          cardBackground,
          "#000000",
          0.68,
        );

  const emptyStampText =
    getReadableText(
      emptyStampBackground,
    );

  const accentText =
    getReadableText(primaryColor);

  const primarySoft = withAlpha(
    primaryColor,
    cardIsLight ? 0.13 : 0.2,
  );

  const primaryBorder = withAlpha(
    primaryColor,
    cardIsLight ? 0.32 : 0.42,
  );

  const primaryGlow = withAlpha(
    primaryColor,
    0.32,
  );

  const secondaryGlow = withAlpha(
    secondaryColor,
    0.25,
  );

  const rewardEmerald = "#163F36";

  const rewardEmeraldLight =
    "#2D6A5A";

  const rewardChampagne = "#D8BE82";

  const rewardIvory = "#F7EFD9";

  const logoUrl = getDirectLogoUrl(
    customer.cafe.logoUrl,
  );

  const showLogo = Boolean(
    logoUrl &&
      failedLogoUrl !== logoUrl,
  );

  const cafeInitial =
    customer.cafe.name
      .trim()
      .charAt(0)
      .toUpperCase() || "B";

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
            ${withAlpha(
              primaryColor,
              0.42,
            )} 0%,
            transparent 38%
          ),
          radial-gradient(
            circle at 100% 55%,
            ${withAlpha(
              secondaryColor,
              0.22,
            )} 0%,
            transparent 42%
          ),
          ${backgroundColor}
        `,
      }}
    >
      <LoyaltyCard
        customer={customer}
        refreshing={refreshing}
        newStampIndex={newStampIndex}
        birthdayText={birthdayText}
        daysUntilBirthday={
          daysUntilBirthday
        }
        lastUpdated={lastUpdated}
        memberSince={memberSince}
        rewardTarget={rewardTarget}
        visibleStamps={visibleStamps}
        rewardReady={rewardReady}
        cardGlowsGreen={
          cardGlowsGreen
        }
        remainingStamps={
          remainingStamps
        }
        progressMessage={
          progressMessage
        }
        progressPercentage={
          progressPercentage
        }
        primaryColor={primaryColor}
        secondaryColor={
          secondaryColor
        }
        cardBackground={
          cardBackground
        }
        cardIsLight={cardIsLight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        cardBorder={cardBorder}
        surfaceColor={surfaceColor}
        surfaceRaised={surfaceRaised}
        emptyStampBackground={
          emptyStampBackground
        }
        emptyStampText={
          emptyStampText
        }
        accentText={accentText}
        primarySoft={primarySoft}
        primaryBorder={primaryBorder}
        primaryGlow={primaryGlow}
        secondaryGlow={
          secondaryGlow
        }
        rewardEmerald={
          rewardEmerald
        }
        rewardEmeraldLight={
          rewardEmeraldLight
        }
        rewardChampagne={
          rewardChampagne
        }
        rewardIvory={rewardIvory}
        logoUrl={logoUrl}
        showLogo={showLogo}
        cafeInitial={cafeInitial}
        onRefresh={() =>
          void loadCard(true)
        }
        onLogoError={
          setFailedLogoUrl
        }
        onShowQrCode={() =>
          setShowQrCode(true)
        }
        onShowFeedback={
          openFeedbackModal
        }
      />

      {showRewardCelebration ? (
        <RewardCelebrationModal
          rewardName={
            customer.cafe.rewardName
          }
          rewardDescription={
            customer.cafe
              .rewardDescription
          }
          onClose={() =>
            setShowRewardCelebration(
              false,
            )
          }
        />
      ) : null}

      {showRatingModal ? (
        <RatingModal
          cafeName={
            customer.cafe.name
          }
          selectedRating={
            selectedRating
          }
          hoveredRating={
            hoveredRating
          }
          reviewSubmitting={
            reviewSubmitting
          }
          reviewError={
            reviewError
          }
          cardBorder={cardBorder}
          cardBackground={
            cardBackground
          }
          textPrimary={textPrimary}
          textSecondary={
            textSecondary
          }
          textMuted={textMuted}
          surfaceColor={
            surfaceColor
          }
          reviewErrorBorderColor={withAlpha(
            "#EF4444",
            0.32,
          )}
          reviewErrorBackgroundColor={withAlpha(
            "#EF4444",
            0.1,
          )}
          reviewErrorTextColor={mixColors(
            "#EF4444",
            textPrimary,
            0.72,
          )}
          onHoveredRatingChange={
            setHoveredRating
          }
          onRatingSelect={(
            rating,
          ) =>
            void handleRatingSelect(
              rating,
            )
          }
          onClose={() =>
            setShowRatingModal(
              false,
            )
          }
        />
      ) : null}

      {showGooglePrompt ? (
        <GoogleReviewModal
          selectedRating={
            selectedRating
          }
          googleReviewUrl={
            customer.cafe
              .googleReviewUrl
          }
          cardBorder={cardBorder}
          cardBackground={
            cardBackground
          }
          textPrimary={textPrimary}
          textSecondary={
            textSecondary
          }
          textMuted={textMuted}
          surfaceColor={
            surfaceColor
          }
          primaryColor={
            primaryColor
          }
          accentText={accentText}
          onClose={() =>
            setShowGooglePrompt(
              false,
            )
          }
          onOpenGoogleReview={
            handleOpenGoogleReview
          }
        />
      ) : null}

      {showQrCode ? (
        <QrCodeModal
          cafeName={
            customer.cafe.name
          }
          memberNumber={
            customer.memberNumber
          }
          publicToken={
            customer.publicToken
          }
          logoUrl={logoUrl}
          showLogo={showLogo}
          cafeInitial={cafeInitial}
          cardBorder={cardBorder}
          cardBackground={
            cardBackground
          }
          textPrimary={textPrimary}
          textSecondary={
            textSecondary
          }
          textMuted={textMuted}
          surfaceColor={
            surfaceColor
          }
          primaryColor={
            primaryColor
          }
          primaryGlow={primaryGlow}
          primarySoft={primarySoft}
          accentText={accentText}
          onClose={() =>
            setShowQrCode(false)
          }
          onLogoError={
            setFailedLogoUrl
          }
        />
      ) : null}

      {/* Feedback modal */}
      {showFeedbackModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !feedbackSubmitting
            ) {
              closeFeedbackModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border p-5 shadow-2xl sm:rounded-[32px] sm:p-6"
            style={{
              borderColor: cardBorder,
              backgroundColor:
                cardBackground,
              boxShadow:
                "0 30px 100px rgba(0,0,0,0.48)",
            }}
          >
            <button
              type="button"
              onClick={
                closeFeedbackModal
              }
              disabled={
                feedbackSubmitting
              }
              aria-label="Close feedback"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-70 disabled:opacity-40"
              style={{
                borderColor:
                  cardBorder,
                backgroundColor:
                  surfaceColor,
                color: textSecondary,
              }}
            >
              <X size={17} />
            </button>

            {!feedbackSubmitted ? (
              <>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor:
                      primarySoft,
                    color: primaryColor,
                  }}
                >
                  <MessageCircle
                    size={21}
                  />
                </div>

                <h2
                  className="mt-5 pr-10 text-2xl font-semibold tracking-tight"
                  style={{
                    color: textPrimary,
                  }}
                >
                  How was your
                  experience?
                </h2>

                <p
                  className="mt-2 text-sm leading-6"
                  style={{
                    color:
                      textSecondary,
                  }}
                >
                  The good, the bad,
                  or something we
                  could do better —
                  we’d love to hear
                  it.
                </p>

                <div className="mt-6">
                  <textarea
                    value={
                      feedbackComment
                    }
                    onChange={(
                      event,
                    ) => {
                      setFeedbackComment(
                        event.target
                          .value,
                      );

                      if (
                        feedbackError
                      ) {
                        setFeedbackError(
                          "",
                        );
                      }
                    }}
                    maxLength={1000}
                    rows={5}
                    autoFocus
                    placeholder="Tell us what stood out, or what we could improve..."
                    className="w-full resize-none rounded-2xl border px-4 py-4 text-sm leading-6 outline-none transition placeholder:opacity-40 focus:ring-2"
                    style={{
                      borderColor:
                        feedbackError
                          ? withAlpha(
                              "#EF4444",
                              0.45,
                            )
                          : cardBorder,

                      backgroundColor:
                        surfaceColor,

                      color:
                        textPrimary,

                      ["--tw-ring-color" as string]:
                        withAlpha(
                          primaryColor,
                          0.28,
                        ),
                    }}
                  />

                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      {feedbackError ? (
                        <p
                          className="text-xs leading-5"
                          style={{
                            color:
                              "#EF8A8A",
                          }}
                        >
                          {
                            feedbackError
                          }
                        </p>
                      ) : (
                        <p
                          className="text-xs leading-5"
                          style={{
                            color:
                              textMuted,
                          }}
                        >
                          A few honest
                          words are
                          more than
                          enough.
                        </p>
                      )}
                    </div>

                    <span
                      className="shrink-0 text-[11px]"
                      style={{
                        color:
                          textMuted,
                      }}
                    >
                      {
                        feedbackComment.length
                      }
                      /1000
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleFeedbackSubmit()
                  }
                  disabled={
                    feedbackSubmitting ||
                    feedbackComment
                      .trim()
                      .length < 10
                  }
                  className="mt-6 flex h-13 min-h-13 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor:
                      primaryColor,
                    color:
                      accentText,
                    boxShadow: `0 14px 35px ${withAlpha(
                      primaryColor,
                      0.25,
                    )}`,
                  }}
                >
                  {feedbackSubmitting ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="mr-2 animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    "Send feedback"
                  )}
                </button>

                <p
                  className="mt-4 text-center text-[11px] leading-5"
                  style={{
                    color: textMuted,
                  }}
                >
                  Your first note
                  comes with a stamp,
                  on us.
                </p>
              </>
            ) : (
              <>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      primarySoft,
                    color: primaryColor,
                  }}
                >
                  <Check size={24} />
                </div>

                <h2
                  className="mt-5 pr-10 text-2xl font-semibold tracking-tight"
                  style={{
                    color: textPrimary,
                  }}
                >
                  Thank you for
                  sharing.
                </h2>

                <p
                  className="mt-2 text-sm leading-6"
                  style={{
                    color:
                      textSecondary,
                  }}
                >
                  {feedbackRewardGranted
                    ? "We’ve added a stamp to your card."
                    : "Your note has been sent to the team."}
                </p>

                {feedbackRewardGranted ? (
                  <div
                    className="mt-5 rounded-2xl border px-4 py-4"
                    style={{
                      borderColor:
                        primaryBorder,
                      backgroundColor:
                        primarySoft,
                    }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          textPrimary,
                      }}
                    >
                      +1 stamp
                    </p>

                    <p
                      className="mt-1 text-xs leading-5"
                      style={{
                        color:
                          textMuted,
                      }}
                    >
                      A little
                      thank-you from{" "}
                      {
                        customer.cafe
                          .name
                      }
                      .
                    </p>
                  </div>
                ) : null}

                {feedbackGoogleReviewUrl ? (
                  <div
                    className="mt-6 border-t pt-5"
                    style={{
                      borderColor:
                        cardBorder,
                    }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          textPrimary,
                      }}
                    >
                      Enjoyed your
                      visit?
                    </p>

                    <p
                      className="mt-1 text-xs leading-5"
                      style={{
                        color:
                          textMuted,
                      }}
                    >
                      You can share
                      your experience
                      on Google too.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleFeedbackGoogleReview
                      }
                      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition hover:opacity-80"
                      style={{
                        borderColor:
                          cardBorder,
                        backgroundColor:
                          surfaceColor,
                        color:
                          textPrimary,
                      }}
                    >
                      Share it on
                      Google
                      <ArrowUpRight
                        size={16}
                      />
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={
                    closeFeedbackModal
                  }
                  className="mt-3 h-12 w-full rounded-2xl text-sm font-semibold transition hover:opacity-75"
                  style={{
                    color:
                      textSecondary,
                  }}
                >
                  Back to my card
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}