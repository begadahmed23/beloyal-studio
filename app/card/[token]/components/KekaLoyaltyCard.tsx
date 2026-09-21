"use client";

import { Cake, ChevronRight, MessageCircle, QrCode, RefreshCw } from "lucide-react";
import { useState } from "react";
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

function KekaStamp({ active = false, creamTheme = false }: { active?: boolean; creamTheme?: boolean }) {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-[42%] border text-[18px] font-semibold min-[390px]:h-12 min-[390px]:w-12"
      style={{
        color: active ? (creamTheme ? "#FFF6E6" : "#6F171A") : (creamTheme ? "rgba(116,26,29,0.32)" : "rgba(248,236,210,0.32)"),
        backgroundColor: active ? (creamTheme ? "#741A1D" : "#F4E5C6") : "transparent",
        borderColor: active ? (creamTheme ? "#741A1D" : "#F4E5C6") : (creamTheme ? "rgba(116,26,29,0.2)" : "rgba(248,236,210,0.24)"),
        boxShadow: active ? (creamTheme ? "0 7px 18px rgba(74,13,16,0.22)" : "0 7px 18px rgba(36,4,5,0.18)") : "none",
      }}
    >
      ك
    </div>
  );
}

export default function KekaLoyaltyCard({
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
  const customerName = customer.name
    ? customer.name.charAt(0).toUpperCase() + customer.name.slice(1)
    : "";
  const isCreamTheme = customer.cafe.theme === "MODERN_MINIMAL";
  const burgundy = "#741A1D";
  const burgundyDeep = "#4A0D10";
  const cream = "#F4E5C6";
  const creamSoft = "#FFF6E6";
  const cardText = isCreamTheme ? burgundyDeep : creamSoft;
  const cardMuted = isCreamTheme ? "rgba(74,13,16,0.58)" : "rgba(244,229,198,0.58)";
  const cardBorder = isCreamTheme ? "rgba(116,26,29,0.14)" : "rgba(244,229,198,0.12)";
  const cardSurface = isCreamTheme ? "rgba(116,26,29,0.055)" : "rgba(58,7,9,0.16)";
  // rewardTarget is already the number of paid visits required to unlock
  // the reward. Keep one separate final slot for the free reward itself.
  const paidTarget = Math.max(rewardTarget, 1);
  const totalSlots = paidTarget + 1;
  const displayStamps = Math.min(visibleStamps, paidTarget);
  const progressPercent = rewardReady ? 100 : Math.min((displayStamps / paidTarget) * 100, 100);
  const remaining = Math.max(paidTarget - displayStamps, 0);
  const progressMessage = rewardReady
    ? "Your reward is ready."
    : displayStamps === 0
      ? "Your first little ritual is waiting."
      : remaining === 1
        ? "One more visit until your reward."
        : `${remaining} more visits until your reward.`;

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div
        className="overflow-hidden rounded-[30px] border px-4 pb-6 pt-5 min-[375px]:px-5 min-[390px]:rounded-[34px] min-[390px]:px-7 min-[390px]:pb-8 min-[390px]:pt-7"
        style={{
          color: cardText,
          borderColor: cardBorder,
          background: isCreamTheme
            ? "linear-gradient(155deg,#FFF6E6 0%,#F4E5C6 100%)"
            : `
                radial-gradient(circle at 85% 5%, rgba(255,220,180,0.09), transparent 28%),
                radial-gradient(circle at 8% 90%, rgba(255,210,170,0.05), transparent 32%),
                linear-gradient(150deg, #8A2426 0%, ${burgundy} 48%, ${burgundyDeep} 100%)
              `,
          boxShadow: isCreamTheme
            ? "0 28px 80px rgba(74,13,16,0.14)"
            : "0 28px 90px rgba(61,8,10,0.28)",
        }}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.38em]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.66)" : "rgba(244,229,198,0.72)" }}>
              Good coffee · better days
            </p>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.42em]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.46)" : "rgba(244,229,198,0.48)" }}>
              Alexandria
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh loyalty card"
            className="flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-50"
            style={{ borderColor: isCreamTheme ? "rgba(116,26,29,0.16)" : "rgba(244,229,198,0.16)", color: isCreamTheme ? burgundy : cream }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </header>

        <div className="mt-8 text-center">
          <p className="text-[13px] font-medium tracking-[0.08em]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.62)" : "rgba(244,229,198,0.68)" }}>
            Keka
          </p>
          <div className="mt-1 text-[4.5rem] font-medium leading-[0.9] tracking-[-0.08em] min-[390px]:text-[5.2rem]" dir="rtl" style={{ color: isCreamTheme ? burgundy : cream }}>
            كيكة
          </div>
          <p className="mt-4 font-serif text-[17px] tracking-[0.02em] min-[390px]:text-[19px]" style={{ color: cardText }}>
            Little Rituals, Big Comfort
          </p>
        </div>

        <div className="mt-7">
          <p
            className="font-serif text-[14px] italic tracking-[0.01em]"
            style={{ color: cardMuted }}
          >
            Good to see you,
          </p>
          <h1
            className="mt-1 max-w-full truncate text-[2.2rem] font-semibold leading-none tracking-[-0.055em] min-[390px]:text-[2.45rem]"
            style={{ color: isCreamTheme ? burgundy : cream }}
          >
            {customerName}
          </h1>
        </div>

        {(customer.cafe.eligiblePurchaseDescription?.trim() || customer.cafe.rewardDescription?.trim()) && (
          <div className="mt-7 rounded-[18px] border px-4 py-3 text-center" style={{ borderColor: "rgba(244,229,198,0.13)", backgroundColor: "rgba(55,5,8,0.12)" }}>
            {customer.cafe.eligiblePurchaseDescription?.trim() && (
              <p className="text-[11px] leading-5" style={{ color: "rgba(255,246,230,0.72)" }}>
                {customer.cafe.eligiblePurchaseDescription.trim()}
              </p>
            )}
            {customer.cafe.rewardDescription?.trim() && (
              <p className="mt-1 text-[11px] font-medium leading-5" style={{ color: isCreamTheme ? burgundy : cream }}>
                {customer.cafe.rewardDescription.trim()}
              </p>
            )}
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: cardMuted }}>
              Your rituals
            </p>
            <p className="text-[15px] font-semibold tracking-[0.08em]" style={{ color: isCreamTheme ? burgundy : cream }}>
              {displayStamps} / {totalSlots}
            </p>
          </div>

          <div className="mt-5 grid items-center gap-1" style={{ gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 1fr))` }}>
            {Array.from({ length: totalSlots }).map((_, index) => {
              const isPurchaseSlot = index < paidTarget;
              const active = isPurchaseSlot && index < displayStamps;
              const isNew = isPurchaseSlot && newStampIndex === index;
              const rewardSlotReady = false;
              return (
                <div key={index} className={"flex min-w-0 justify-center " + (isNew ? "keka-stamp-glow" : "")}>
                  <KekaStamp active={active} creamTheme={isCreamTheme} />
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="h-[3px] overflow-hidden rounded-full" style={{ backgroundColor: isCreamTheme ? "rgba(116,26,29,0.12)" : "rgba(244,229,198,0.15)" }}>
              <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: progressPercent + "%", backgroundColor: isCreamTheme ? burgundy : cream }} />
            </div>
            <p className="mt-4 text-center font-serif text-[16px]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.82)" : "rgba(255,246,230,0.86)" }}>
              {progressMessage}
            </p>
          </div>
        </section>

        <div className="my-7 flex items-center justify-center gap-3">
          <div className="h-px w-10" style={{ backgroundColor: isCreamTheme ? "rgba(116,26,29,0.22)" : "rgba(244,229,198,0.26)" }} />
          <p className="text-[8px] font-semibold uppercase tracking-[0.45em]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.5)" : "rgba(244,229,198,0.5)" }}>
             little rituals · bigger days
          </p>
          <div className="h-px w-10" style={{ backgroundColor: isCreamTheme ? "rgba(116,26,29,0.22)" : "rgba(244,229,198,0.26)" }} />
        </div>

        <button
          type="button"
          onClick={() => setBirthdayOpen((current) => !current)}
          className="flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left transition"
          style={{ borderColor: cardBorder, backgroundColor: cardSurface }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ backgroundColor: isCreamTheme ? "rgba(116,26,29,0.09)" : "rgba(244,229,198,0.11)", color: isCreamTheme ? burgundy : cream }}>
            <Cake size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.56)" : "rgba(244,229,198,0.55)" }}>Your Birthday</p>
            <p className="mt-0.5 text-[14px] font-semibold" style={{ color: cardText }}>{birthdayText}</p>
          </div>
          <p className="shrink-0 text-[11px]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.56)" : "rgba(244,229,198,0.55)" }}>
            {daysUntilBirthday === 0 ? "Today" : `In ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`}
          </p>
          <ChevronRight size={16} style={{ color: isCreamTheme ? "rgba(74,13,16,0.5)" : "rgba(244,229,198,0.5)", transform: birthdayOpen ? "rotate(90deg)" : "none", transition: "transform 180ms ease" }} />
        </button>

        {birthdayOpen && (
          <div className="mt-2 rounded-[18px] border px-4 py-4 text-xs leading-5" style={{ borderColor: cardBorder, backgroundColor: cardSurface, color: isCreamTheme ? "rgba(74,13,16,0.7)" : "rgba(255,246,230,0.72)" }}>
            {customer.cafe.birthdayRewardsEnabled ? (
              <>
                <p className="font-semibold" style={{ color: cardText }}>{customer.cafe.birthdayRewardName || "Birthday Reward"}</p>
                {customer.cafe.birthdayRewardDescription && <p className="mt-2">{customer.cafe.birthdayRewardDescription}</p>}
                {customer.cafe.birthdayPurchaseRequirement && <p className="mt-2">{customer.cafe.birthdayPurchaseRequirement}</p>}
                <p className="mt-2">Valid for {customer.cafe.birthdayValidityDays} {customer.cafe.birthdayValidityDays === 1 ? "day" : "days"} from your birthday.</p>
              </>
            ) : (
              <p>Birthday rewards are not currently active.</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onShowQrCode}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-[20px] text-[15px] font-semibold transition hover:brightness-105 active:scale-[0.99]"
          style={{ backgroundColor: isCreamTheme ? burgundy : cream, color: isCreamTheme ? creamSoft : burgundyDeep, boxShadow: "0 14px 30px rgba(42,3,5,0.2)" }}
        >
          <QrCode size={19} />
          Show QR Code
        </button>

        {customer.cafe.feedbackEnabled && (
          <button
            type="button"
            onClick={onShowFeedback}
            className="mt-3 flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left transition"
            style={{ borderColor: cardBorder, backgroundColor: cardSurface, color: cardText }}
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={18} style={{ color: isCreamTheme ? burgundy : cream }} />
              <div>
                <p className="text-sm font-semibold">Share your thoughts</p>
                <p className="mt-0.5 text-[11px]" style={{ color: isCreamTheme ? "rgba(74,13,16,0.56)" : "rgba(244,229,198,0.55)" }}>Help us make Keka even better.</p>
              </div>
            </div>
            <ChevronRight size={17} style={{ color: isCreamTheme ? "rgba(74,13,16,0.5)" : "rgba(244,229,198,0.5)" }} />
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: "#9A7773" }}>
        Powered by BeLoyal
      </p>

      <style jsx global>{`
        @keyframes keka-stamp-glow {
          0% { filter: drop-shadow(0 0 0 rgba(116,26,29,0)); transform: scale(0.9); }
          45% { filter: drop-shadow(0 0 11px rgba(116,26,29,0.72)); transform: scale(1.08); }
          100% { filter: drop-shadow(0 0 0 rgba(116,26,29,0)); transform: scale(1); }
        }
        .keka-stamp-glow { animation: keka-stamp-glow 760ms cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .keka-stamp-glow { animation: none; } }
      `}</style>
    </div>
  );
}
