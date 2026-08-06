"use client";

import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  Heart,
  QrCode,
  RefreshCw,
  Smartphone,
  Gift,
  Sparkles,
} from "lucide-react";
import { withAlpha } from "../card-utils";

export type Cafe = {
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

export type Customer = {
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
  progressMessage: { title: string; description: string };
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
  onAddToHomeScreen: () => void;
};

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
  onAddToHomeScreen,
}: LoyaltyCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="relative w-full overflow-hidden rounded-[26px] border shadow-[0_35px_120px_rgba(0,0,0,0.35)] transition-all duration-700 min-[380px]:rounded-[30px] sm:rounded-[34px]"
        style={{
          borderColor: cardBorder,
          background: `
            radial-gradient(
              circle at 92% 4%,
              ${withAlpha(primaryColor, cardIsLight ? 0.16 : 0.24)} 0%,
              transparent 34%
            ),
            radial-gradient(
              circle at 5% 64%,
              ${withAlpha(secondaryColor, cardIsLight ? 0.12 : 0.18)} 0%,
              transparent 40%
            ),
            ${cardBackground}
          `,
          boxShadow: "0 35px 120px rgba(0,0,0,0.35)",
          colorScheme: cardIsLight ? "light" : "dark",
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
                      onError={() => onLogoError(logoUrl)}
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
    
            <button
              type="button"
              onClick={onAddToHomeScreen}
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
  );
}
