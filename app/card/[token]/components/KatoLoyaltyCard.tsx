"use client";

import { Cake, ChevronRight, MessageCircle, QrCode, RefreshCw } from "lucide-react";

import { useState } from "react";
import { BorderBeam } from "border-beam";

import KatoMark from "@/components/brand/KatoMark";
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
  onShowFeedback: () => void;
};

function capitalizeFirstLetter(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default function KatoLoyaltyCard({
  customer,
  refreshing,
  newStampIndex,
  birthdayText,
  daysUntilBirthday,
  rewardTarget,
  visibleStamps,
  rewardReady,
  onRefresh,
  onShowQrCode,
  onShowFeedback,
}: Props) {
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const isDark = customer.cafe.theme === "DARK_LUXURY";
  const navy = "#102B49";
  const navyDeep = "#0A223E";
  const cream = "#E9E6D8";
  const white = "#FFFFFF";
  const pageText = isDark ? "#F5F3EC" : "#102B49";
  const muted = isDark ? "#A7B0BA" : "#7F8DA0";
  const border = isDark
    ? "rgba(233,230,216,0.14)"
    : "#E5EAF0";
  const soft = isDark ? "#0D2744" : "#F7F9FB";
  const shellBackground = isDark ? "#071A33" : "#FFFFFF";
  const birthdayIconBackground = isDark ? "#16395C" : "#EEF3F7";
  const birthdayTextColor = isDark ? "#F5F3EC" : navyDeep;
  const qrBackground = isDark ? cream : navy;
  const qrText = isDark ? navyDeep : white;

  const totalSlots = Math.max(customer.cafe.rewardTarget, rewardTarget + 1, 2);
  const paidTarget = Math.max(totalSlots - 1, 1);
  const displayStamps = Math.min(visibleStamps, paidTarget);
  const progressPercent = rewardReady
    ? 100
    : Math.min((displayStamps / paidTarget) * 100, 100);
  const progressRatio = displayStamps / paidTarget;
  const progressMessage = rewardReady
    ? "This one’s on us."
    : displayStamps === 0
      ? "Your first stamp is waiting."
      : displayStamps >= paidTarget - 1
        ? "Just one more coffee."
        : progressRatio >= 0.65
          ? "Not far now."
          : progressRatio >= 0.35
            ? "You’re getting there."
            : "Off to a good start.";
  const customerName = capitalizeFirstLetter(customer.name);

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div
        className="overflow-hidden rounded-[30px] px-4 pb-6 pt-5 min-[375px]:px-5 min-[390px]:rounded-[34px] min-[390px]:px-7 min-[390px]:pb-8 min-[390px]:pt-7"
        style={{
          backgroundColor: shellBackground,
          boxShadow: isDark
            ? "0 28px 90px rgba(0,0,0,0.34)"
            : "0 28px 90px rgba(16,43,73,0.12)",
        }}
      >
        <header>
          <div className="flex items-start justify-between gap-4 min-[390px]:gap-5">
            <div className="min-w-0">
              <div
                className="text-[2.15rem] font-light leading-none tracking-[-0.08em] min-[375px]:text-[2.35rem] min-[390px]:text-[2.75rem]"
                style={{ color: isDark ? cream : navy }}
              >
                KATŌ
              </div>

              <p
                className="mt-2 text-[9px] font-semibold uppercase tracking-[0.38em]"
                style={{ color: isDark ? "#BFC6CB" : navy }}
              >
                Specialty Coffee
              </p>
            </div>

            <div
              className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full min-[375px]:h-[70px] min-[375px]:w-[70px] min-[390px]:h-[76px] min-[390px]:w-[76px]"
              style={{
                backgroundColor: isDark ? cream : navy,
                color: isDark ? navyDeep : cream,
              }}
            >
              <KatoMark size={48} />
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <p
                className="text-[15px] font-medium"
                style={{ color: muted }}
              >
                Good to see you,
              </p>

              <h1
                className="mt-1 text-[2.2rem] font-semibold leading-none tracking-[-0.055em]"
                style={{ color: pageText }}
              >
                {customerName}
              </h1>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh loyalty card"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50"
              style={{
                color: muted,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "transparent",
              }}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        {(customer.cafe.eligiblePurchaseDescription?.trim() ||
          customer.cafe.rewardDescription?.trim()) && (
          <div className="mt-6 space-y-2 px-1">
            {customer.cafe.eligiblePurchaseDescription?.trim() && (
              <p
                className="text-[12px] font-medium leading-5"
                style={{ color: isDark ? cream : navy }}
              >
                <span className="font-semibold">Eligible purchase:</span>{" "}
                {customer.cafe.eligiblePurchaseDescription.trim()}
              </p>
            )}

            {customer.cafe.rewardDescription?.trim() && (
              <p
                className="text-[12px] font-medium leading-5"
                style={{ color: isDark ? cream : navy }}
              >
                <span className="font-semibold">Reward:</span>{" "}
                {customer.cafe.rewardDescription.trim()}
              </p>
            )}
          </div>
        )}

        <BorderBeam
          active={newStampIndex !== null}
          size="md"
          colorVariant="mono"
          theme="dark"
          strength={0.58}
          duration={1.6}
          borderRadius={30}
          className="mt-6 min-[375px]:mt-7"
        >
          <section
          className="relative overflow-hidden rounded-[26px] px-4 pb-5 pt-5 min-[390px]:rounded-[30px] min-[390px]:px-6 min-[390px]:pb-7 min-[390px]:pt-6"
          style={{
            background:
              "linear-gradient(145deg, #16395C 0%, #102B49 56%, #0A223E 100%)",
            boxShadow:
              "0 18px 42px rgba(16,43,73,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/[0.05] blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/70">
              Buy {paidTarget} & Get 1 Free
            </p>

            <p className="shrink-0 text-[17px] font-semibold tracking-[0.08em] text-white/90">
              {displayStamps} / {totalSlots}
            </p>
          </div>

          <div
            className="relative mt-8 grid items-center gap-0.5 min-[390px]:gap-1"
            style={{
              gridTemplateColumns:
                "repeat(" + totalSlots + ", minmax(0, 1fr))",
            }}
          >
            {Array.from({ length: totalSlots }).map((_, index) => {
              const isPurchaseSlot = index < paidTarget;
              const active = isPurchaseSlot && index < displayStamps;
              const isNew = isPurchaseSlot && newStampIndex === index;
              const rewardSlotReady = !isPurchaseSlot && rewardReady;

              return (
                <div
                  key={index}
                  className={
                    "flex min-w-0 items-center justify-center py-1 transition-[transform,opacity] duration-500 ease-out " +
                    (isNew ? "scale-110" : "scale-100")
                  }
                  style={{
                    color: rewardSlotReady
                      ? "rgba(255,255,255,0.82)"
                      : active
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.30)",
                    opacity: active || rewardSlotReady ? 1 : 0.72,
                  }}
                >
                  <KatoMark
                    active={active}
                    size={39}
                  />
                </div>
              );
            })}
          </div>

          <div className="relative mt-7">
            <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#F7F5EC] transition-[width,opacity] duration-700 ease-out"
                style={{
                  width: progressPercent + "%",
                  opacity: displayStamps > 0 ? 1 : 0.72,
                }}
              />
            </div>

            <p className="mt-3 text-center text-[11px] font-medium tracking-[0.04em] text-white/70">
              {progressMessage}
            </p>
          </div>

          </section>
        </BorderBeam>

        <button
          type="button"
          onClick={() => setBirthdayOpen((current) => !current)}
          className="mt-5 flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition hover:-translate-y-0.5 active:translate-y-0 min-[390px]:px-5"
          style={{
            borderColor: border,
            backgroundColor: soft,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px]"
            style={{
              backgroundColor: birthdayIconBackground,
              color: isDark ? cream : navy,
            }}
          >
            <Cake size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium" style={{ color: muted }}>
              Your Birthday
            </p>
            <p
              className="mt-0.5 text-[16px] font-semibold"
              style={{ color: birthdayTextColor }}
            >
              {birthdayText}
            </p>
          </div>

          <div className="h-12 w-px shrink-0" style={{ backgroundColor: border }} />

          <div className="shrink-0 text-right">
            <p className="text-[13px] font-medium" style={{ color: muted }}>
              {daysUntilBirthday === 0
                ? "Today"
                : "In " +
                  daysUntilBirthday +
                  " " +
                  (daysUntilBirthday === 1 ? "day" : "days")}
            </p>
          </div>

          <ChevronRight
            size={18}
            style={{
              color: "#9AA6B5",
              transform: birthdayOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 180ms ease",
            }}
          />
        </button>

        {birthdayOpen && (
          <div
            className="mt-2 rounded-[20px] border px-4 py-4"
            style={{
              borderColor: border,
              backgroundColor: isDark ? "#0B223C" : "#FBFCFD",
              color: pageText,
            }}
          >
            {customer.cafe.birthdayRewardsEnabled ? (
              <>
                <p className="text-sm font-semibold">
                  {customer.cafe.birthdayRewardName || "Birthday Reward"}
                </p>

                {customer.cafe.birthdayRewardDescription && (
                  <p className="mt-2 text-xs leading-5" style={{ color: muted }}>
                    {customer.cafe.birthdayRewardDescription}
                  </p>
                )}

                {customer.cafe.birthdayPurchaseRequirement && (
                  <p className="mt-2 text-xs leading-5" style={{ color: muted }}>
                    {customer.cafe.birthdayPurchaseRequirement}
                  </p>
                )}

                <p className="mt-2 text-xs leading-5" style={{ color: muted }}>
                  Valid for {customer.cafe.birthdayValidityDays}{" "}
                  {customer.cafe.birthdayValidityDays === 1 ? "day" : "days"} from your birthday.
                </p>

                {customer.cafe.birthdayFriendDiscountEnabled && (
                  <p className="mt-2 text-xs leading-5" style={{ color: muted }}>
                    Bring 1 friend for {customer.cafe.birthdayOneFriendDiscount}% off ·
                    2+ friends for {customer.cafe.birthdayGroupDiscount}% off.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs leading-5" style={{ color: muted }}>
                Birthday rewards are not currently active.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onShowQrCode}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-[22px] text-[15px] font-semibold text-white shadow-[0_14px_34px_rgba(16,43,73,0.22)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          style={{
            backgroundColor: qrBackground,
            color: qrText,
            boxShadow: isDark
              ? "0 14px 34px rgba(0,0,0,0.28)"
              : "0 14px 34px rgba(16,43,73,0.22)",
          }}
        >
          <QrCode size={19} />
          Show QR Code
        </button>

        {customer.cafe.feedbackEnabled && (
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={onShowFeedback}
              className="flex w-full items-center justify-between rounded-[22px] border px-4 py-3.5 text-left transition hover:-translate-y-0.5 active:translate-y-0"
              style={{
                borderColor: border,
                backgroundColor: isDark ? "#0D2744" : "#F7F9FB",
                color: pageText,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[14px]"
                  style={{
                    backgroundColor: isDark ? "#16395C" : "#EEF3F7",
                    color: isDark ? cream : navy,
                  }}
                >
                  <MessageCircle size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Share your thoughts
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: muted }}>
                    Tell us about your visit.
                  </p>
                </div>
              </div>

              <ChevronRight size={18} style={{ color: muted }} />
            </button>


          </div>
        )}
      </div>

      <p
        className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[0.28em]"
        style={{ color: isDark ? "#7F8A97" : "#A0AAB6" }}
      >
        Powered by BeLoyal
      </p>
    </div>
  );
}
