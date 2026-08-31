"use client";

import {
  Coffee,
  Gift,
  Heart,
  MessageCircle,
  QrCode,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { withAlpha } from "../card-utils";
import BirthdayCustomerDisplay from "./BirthdayCustomerDisplay";

export type Cafe = {
  id: string;
  name: string;
  slug: string;
  businessType: "CAFE" | "BARBERSHOP";
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
  timezone: string;
  birthdayRewardsEnabled: boolean;
  birthdayRewardName: string | null;
  birthdayRewardDescription: string | null;
  birthdayPurchaseRequirement: string | null;
  birthdayValidityDays: number;
  birthdayReminderDaysBefore: number;
  birthdayFriendDiscountEnabled: boolean;
  birthdayOneFriendDiscount: number;
  birthdayGroupDiscount: number;
};

export type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string;
  name: string;
  birthday: string;
  stamps: number;
  feedbackRewardedAt: string | null;
  rewardEarnedAt: string | null;
  birthdayRewardRedeemedAt: string | null;
  birthdayRewardYear: number;
  createdAt: string;
  updatedAt: string;
  cafe: Cafe;
};

type LoyaltyCardProps = {
  customer: Customer;
  refreshing: boolean;
  newStampIndex: number | null;
  birthdayText: string;
  daysUntilBirthday: number;
  lastUpdated: string;
  memberSince: string;
  rewardTarget: number;
  visibleStamps: number;
  rewardReady: boolean;
  cardGlowsGreen: boolean;
  remainingStamps: number;
  progressMessage: {
    title: string;
    description: string;
  };
  progressPercentage: number;
  primaryColor: string;
  secondaryColor: string;
  cardBackground: string;
  cardIsLight: boolean;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBorder: string;
  surfaceColor: string;
  surfaceRaised: string;
  emptyStampBackground: string;
  emptyStampText: string;
  accentText: string;
  primarySoft: string;
  primaryBorder: string;
  primaryGlow: string;
  secondaryGlow: string;
  rewardEmerald: string;
  rewardEmeraldLight: string;
  rewardChampagne: string;
  rewardIvory: string;
  logoUrl: string | null;
  showLogo: boolean;
  cafeInitial: string;
  onRefresh: () => void;
  onLogoError: (logoUrl: string) => void;
  onShowQrCode: () => void;
  onShowFeedback: () => void;
};

type BarberScissorsIconProps = {
  size?: number;
  color: string;
  isSnipping?: boolean;
  opacity?: number;
  filter?: string;
};

function BarberScissorsIcon({
  size = 21,
  color,
  isSnipping = false,
  opacity = 1,
  filter = "none",
}: BarberScissorsIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`barber-scissors ${
        isSnipping ? "barber-scissors--snipping" : ""
      }`}
      style={{ color, opacity, filter }}
    >
      <g className="barber-scissors__top">
        <circle cx="5.5" cy="6.5" r="3" />
        <path d="M7.8 8.25 11.5 12 20.5 6.8" />
      </g>

      <g className="barber-scissors__bottom">
        <circle cx="5.5" cy="17.5" r="3" />
        <path d="M7.8 15.75 11.5 12 20.5 17.2" />
      </g>

      <circle
        cx="11.5"
        cy="12"
        r="1.05"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function LoyaltyCard({
  customer,
  refreshing,
  newStampIndex,
  birthdayText,
  daysUntilBirthday,
  lastUpdated,
  memberSince,
  rewardTarget,
  visibleStamps,
  rewardReady,
  cardGlowsGreen,
  remainingStamps,
  progressMessage,
  progressPercentage,
  primaryColor,
  secondaryColor,
  cardBackground,
  cardIsLight,
  textPrimary,
  textSecondary,
  textMuted,
  cardBorder,
  surfaceColor,
  surfaceRaised,
  emptyStampBackground,
  emptyStampText,
  accentText,
  primarySoft,
  primaryBorder,
  primaryGlow,
  secondaryGlow,
  rewardEmerald,
  rewardEmeraldLight,
  rewardChampagne,
  rewardIvory,
  logoUrl,
  showLogo,
  cafeInitial,
  onRefresh,
  onLogoError,
  onShowQrCode,
  onShowFeedback,
}: LoyaltyCardProps) {
  const isBarbershop =
    customer.cafe.businessType === "BARBERSHOP";
  const isBrickBarber =
    isBarbershop && customer.cafe.theme === "COFFEE_CLASSIC";

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="relative w-full overflow-hidden rounded-[26px] border shadow-[0_35px_120px_rgba(0,0,0,0.35)] transition-all duration-700 min-[380px]:rounded-[30px] sm:rounded-[34px]"
        style={{
          borderColor: cardBorder,
          background: `
            radial-gradient(
              circle at 92% 4%,
              ${withAlpha(
                primaryColor,
                isBrickBarber
                  ? 0.1
                  : cardIsLight
                    ? 0.16
                    : 0.24,
              )} 0%,
              transparent 34%
            ),
            radial-gradient(
              circle at 5% 64%,
              ${withAlpha(
                secondaryColor,
                isBrickBarber
                  ? 0.08
                  : cardIsLight
                    ? 0.12
                    : 0.18,
              )} 0%,
              transparent 40%
            ),
            ${cardBackground}
          `,
          boxShadow:
            "0 35px 120px rgba(0,0,0,0.35)",
          colorScheme: cardIsLight
            ? "light"
            : "dark",
          forcedColorAdjust: "none",
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
                  boxShadow:
                    "0 8px 34px rgba(70,137,113,0.18)",
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
                      onError={() =>
                        onLogoError(logoUrl)
                      }
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold min-[380px]:h-12 min-[380px]:w-12 min-[380px]:rounded-2xl min-[380px]:text-base sm:h-14 sm:w-14"
                      style={{
                        backgroundColor:
                          primarySoft,
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
                onClick={onRefresh}
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
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
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
                  backgroundColor:
                    surfaceRaised,
                  color: primaryColor,
                }}
              >
                {rewardReady ? (
                  <Gift size={23} />
                ) : (
                  <Sparkles size={22} />
                )}
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
                  {isBarbershop
                    ? "Your visit card"
                    : "Your stamp card"}
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color: textMuted,
                  }}
                >
                  {customer.cafe
                    .eligiblePurchaseDescription ||
                    (isBarbershop
                      ? "One visit per eligible service"
                      : "One stamp per eligible purchase")}
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

            <div
              className={
                isBarbershop
                  ? "mx-auto mt-5 grid w-full max-w-[17rem] grid-cols-3 gap-3"
                  : "mt-5 grid grid-cols-4 gap-2 min-[380px]:gap-3"
              }
            >
              {Array.from({
                length: rewardTarget,
              }).map((_, index) => {
                const filled =
                  index < visibleStamps;

                const isNewStamp =
                  newStampIndex === index;

                return (
                  <div
                    key={index}
                    className={`flex aspect-square items-center justify-center border transition-all duration-500 ${
                      isBarbershop ? "rounded-xl" : "rounded-2xl"
                    } ${
                      isNewStamp
                        ? "scale-110"
                        : "scale-100"
                    }`}
                    style={{
                      borderColor:
                        filled &&
                        cardGlowsGreen
                          ? "rgba(216,190,130,0.58)"
                          : filled
                            ? primaryColor
                            : cardBorder,

                      background:
                        filled &&
                        cardGlowsGreen
                          ? `linear-gradient(145deg, ${rewardEmeraldLight} 0%, ${rewardEmerald} 48%, #0B2822 100%)`
                          : filled
                            ? primaryColor
                            : emptyStampBackground,

                      boxShadow:
                        filled &&
                        cardGlowsGreen
                          ? isNewStamp
                            ? "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -12px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(216,190,130,0.2), 0 14px 30px rgba(6,31,26,0.42)"
                            : "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -12px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(216,190,130,0.14), 0 10px 22px rgba(6,31,26,0.3)"
                          : isNewStamp
                            ? `0 0 30px ${primaryGlow}`
                            : "none",
                    }}
                  >
                    {isBarbershop ? (
                      <BarberScissorsIcon
                        size={21}
                        isSnipping={isNewStamp}
                        color={
                          filled
                            ? cardGlowsGreen
                              ? rewardIvory
                              : accentText
                            : emptyStampText
                        }
                        opacity={filled ? 1 : 0.6}
                        filter={
                          filled && cardGlowsGreen
                            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.34))"
                            : "none"
                        }
                      />
                    ) : (
                      <Coffee
                        size={23}
                        className={`transition-all duration-500 ${
                          isNewStamp
                            ? "rotate-12 scale-125"
                            : ""
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
                    )}
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
                  background:
                    cardGlowsGreen
                      ? `linear-gradient(90deg, ${rewardEmerald} 0%, ${rewardEmeraldLight} 72%, ${rewardChampagne} 100%)`
                      : primaryColor,
                  boxShadow:
                    cardGlowsGreen
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
                    customer.cafe
                      .rewardName || "reward"
                  } is ready.`
                : `${remainingStamps} more ${
                    remainingStamps === 1
                      ? isBarbershop
                        ? "visit"
                        : "stamp"
                      : isBarbershop
                        ? "visits"
                        : "stamps"
                  } until your ${
                    customer.cafe.rewardName?.toLowerCase() ||
                    "reward"
                  }.`}
            </p>
          </section>

          {customer.cafe
            .rewardDescription ? (
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
                {
                  customer.cafe
                    .rewardDescription
                }
              </p>
            </section>
          ) : null}

          <BirthdayCustomerDisplay
            customer={customer}
            birthdayText={birthdayText}
            daysUntilBirthday={daysUntilBirthday}
            cardBorder={cardBorder}
            surfaceColor={surfaceColor}
            surfaceRaised={surfaceRaised}
            primaryColor={primaryColor}
            primarySoft={primarySoft}
            primaryBorder={primaryBorder}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            textMuted={textMuted}
          />

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
              onClick={onShowQrCode}
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

            {!isBarbershop ? (
              <button
                type="button"
                onClick={onShowFeedback}
                className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.99]"
                style={{
                  borderColor: primaryBorder,
                  backgroundColor: primarySoft,
                  color: textPrimary,
                }}
              >
              <div className="flex min-w-0 items-center gap-3.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      surfaceRaised,
                    color: primaryColor,
                  }}
                >
                  <MessageCircle size={18} />
                </div>

                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: textPrimary,
                    }}
                  >
                    Share your thoughts
                  </p>

                  <p
  className="mt-0.5 text-[11px] leading-4"
  style={{
    color: textMuted,
  }}
>
  {customer.feedbackRewardedAt
    ? "Thanks for helping us improve."
    : "Your first note comes with a stamp, on us."}
</p>
                </div>
              </div>

              <span
                aria-hidden="true"
                className="shrink-0 text-lg"
                style={{
                  color: primaryColor,
                }}
              >
                →
              </span>
              </button>
            ) : null}

            <p
              className="px-3 text-center text-[11px] leading-5"
              style={{
                color: textMuted,
              }}
            >
              Show your QR code to the {isBarbershop
                ? "barber"
                : "cashier"}{" "}
              when collecting a {isBarbershop
                ? "visit"
                : "stamp"}.
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

              <span>
                Thank you for being part of{" "}
                {customer.cafe.name}
              </span>
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

        <style>{`
          .barber-scissors__top,
          .barber-scissors__bottom {
            transform-box: view-box;
            transform-origin: 11.5px 12px;
          }

          .barber-scissors--snipping .barber-scissors__top {
            animation: barber-snip-top 680ms cubic-bezier(0.22, 1, 0.36, 1) 2;
          }

          .barber-scissors--snipping .barber-scissors__bottom {
            animation: barber-snip-bottom 680ms cubic-bezier(0.22, 1, 0.36, 1) 2;
          }

          @keyframes barber-snip-top {
            0%, 100% { transform: rotate(0deg); }
            42%, 62% { transform: rotate(14deg); }
          }

          @keyframes barber-snip-bottom {
            0%, 100% { transform: rotate(0deg); }
            42%, 62% { transform: rotate(-14deg); }
          }

          @media (prefers-reduced-motion: reduce) {
            .barber-scissors--snipping .barber-scissors__top,
            .barber-scissors--snipping .barber-scissors__bottom {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
