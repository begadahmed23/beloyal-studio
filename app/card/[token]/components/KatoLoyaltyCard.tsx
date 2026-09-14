"use client";

import { Cake, QrCode, RefreshCw } from "lucide-react";
import BirthdayCustomerDisplay from "./BirthdayCustomerDisplay";
import type { Customer } from "./LoyaltyCard";

type Props = {
  customer: Customer;
  refreshing: boolean;
  newStampIndex: number | null;
  birthdayText: string;
  daysUntilBirthday: number;
  rewardTarget: number;
  visibleStamps: number;
  rewardReady: boolean;
  remainingStamps: number;
  logoUrl: string | null;
  showLogo: boolean;
  onRefresh: () => void;
  onLogoError: (logoUrl: string) => void;
  onShowQrCode: () => void;
};

export function KatoMark({
  active = false,
  size = 34,
}: {
  active?: boolean;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      style={{
        filter: active
          ? "drop-shadow(0 0 9px rgba(255,255,255,0.88))"
          : "none",
      }}
    >
      <path
        d="M12 14H24V26H12zM40 14H52V26H40zM18 32H30V44H18zM34 32H46V44H34zM26 48H38V60H26z"
        fill="currentColor"
      />
      <path
        d="M24 14H40V20H24zM18 26H46V32H18zM30 44H34V48H30z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function KatoLoyaltyCard(props: Props) {
  const {
    customer,
    refreshing,
    newStampIndex,
    birthdayText,
    daysUntilBirthday,
    rewardTarget,
    visibleStamps,
    rewardReady,
    remainingStamps,
    logoUrl,
    showLogo,
    onRefresh,
    onLogoError,
    onShowQrCode,
  } = props;

  const navy = "#0B2343";
  const navyDeep = "#071A33";
  const white = "#FFFFFF";
  const mist = "#F3F6F9";
  const muted = "#7A8797";
  const border = "#DCE3EA";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-[32px] border border-[#DCE3EA] bg-white shadow-[0_28px_90px_rgba(7,26,51,0.14)]">
        <header className="px-5 pb-5 pt-6 min-[380px]:px-6 min-[380px]:pt-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {showLogo && logoUrl ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0B2343] p-2.5">
                  <img
                    src={logoUrl}
                    alt={customer.cafe.name + " logo"}
                    className="h-full w-full object-contain brightness-0 invert"
                    referrerPolicy="no-referrer"
                    onError={() => onLogoError(logoUrl)}
                  />
                </div>
              ) : (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: navy, color: white }}
                >
                  <KatoMark active size={27} />
                </div>
              )}

              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: muted }}
                >
                  Loyalty card
                </p>
                <h2
                  className="mt-0.5 truncate text-[1.6rem] font-semibold tracking-[0.18em]"
                  style={{ color: navy }}
                >
                  KATŌ
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh loyalty card"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:bg-[#F3F6F9] disabled:opacity-50"
              style={{ borderColor: border, color: navy }}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>

          <p
            className="mt-7 text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ color: muted }}
          >
            Welcome back
          </p>
          <h1
            className="mt-1 break-words text-[2rem] font-semibold tracking-[-0.045em]"
            style={{ color: navyDeep }}
          >
            {customer.name}
          </h1>
        </header>

        <div className="px-4 pb-5 min-[380px]:px-5 min-[380px]:pb-6">
          <section
            className="relative overflow-hidden rounded-[28px] px-5 py-6 shadow-[0_18px_44px_rgba(7,26,51,0.18)]"
            style={{
              background: rewardReady
                ? "linear-gradient(145deg,#102E55 0%,#071A33 100%)"
                : "linear-gradient(145deg,#0E2A4E 0%,#071A33 100%)",
              color: white,
            }}
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-white/[0.07] blur-3xl" />

            <div className="relative flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  Your rewards
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {rewardReady
                    ? (customer.cafe.rewardName || "Reward") + " ready"
                    : remainingStamps +
                      " " +
                      (remainingStamps === 1 ? "stamp" : "stamps") +
                      " to go"}
                </p>
              </div>

              <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/90">
                {visibleStamps}/{rewardTarget}
              </span>
            </div>

            <div
              className="relative mt-6 grid gap-2.5"
              style={{
                gridTemplateColumns:
                  "repeat(" +
                  Math.min(rewardTarget, 4) +
                  ", minmax(0,1fr))",
              }}
            >
              {Array.from({ length: rewardTarget }).map((_, index) => {
                const active = index < visibleStamps;
                const isNew = newStampIndex === index;

                return (
                  <div
                    key={index}
                    className={
                      "flex aspect-square items-center justify-center rounded-2xl border transition-all duration-500 " +
                      (isNew ? "scale-110" : "")
                    }
                    style={{
                      borderColor: active
                        ? "rgba(255,255,255,0.38)"
                        : "rgba(255,255,255,0.12)",
                      backgroundColor: active
                        ? "rgba(255,255,255,0.13)"
                        : "rgba(255,255,255,0.035)",
                      color: active
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.26)",
                      boxShadow: active
                        ? isNew
                          ? "0 0 0 1px rgba(255,255,255,0.24), 0 0 32px rgba(255,255,255,0.5), inset 0 0 24px rgba(255,255,255,0.08)"
                          : "0 0 18px rgba(255,255,255,0.13)"
                        : "none",
                    }}
                  >
                    <KatoMark active={active} size={31} />
                  </div>
                );
              })}
            </div>

            <p className="relative mt-5 text-xs leading-5 text-white/58">
              {rewardReady
                ? "Show your card to redeem your " +
                  (customer.cafe.rewardName?.toLowerCase() || "reward") +
                  "."
                : customer.cafe.eligiblePurchaseDescription ||
                  "One stamp for every eligible purchase."}
            </p>
          </section>

          <div className="mt-4 grid gap-3">
            <div
              className="rounded-[22px] border bg-[#F7F9FB] p-1"
              style={{ borderColor: border }}
            >
              <BirthdayCustomerDisplay
                customer={customer}
                birthdayText={birthdayText}
                daysUntilBirthday={daysUntilBirthday}
                cardBorder={border}
                surfaceColor={mist}
                surfaceRaised={white}
                primaryColor={navy}
                primarySoft="#E9EFF5"
                primaryBorder="#CAD6E2"
                textPrimary={navyDeep}
                textSecondary="#43536A"
                textMuted={muted}
              />
            </div>

            <button
              type="button"
              onClick={onShowQrCode}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[20px] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(7,26,51,0.18)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
              style={{ backgroundColor: navy }}
            >
              <QrCode size={18} />
              Show QR Code
            </button>

            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <Cake size={13} style={{ color: muted }} />
                <span className="text-[11px]" style={{ color: muted }}>
                  Birthday {birthdayText}
                </span>
              </div>

              <span
                className="text-[11px] font-medium"
                style={{ color: navy }}
              >
                Member {customer.memberNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#9AA5B2]">
        Powered by BeLoyal
      </p>
    </div>
  );
}
