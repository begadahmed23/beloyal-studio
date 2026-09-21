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

function KekaCupStamp({ active = false }: { active?: boolean }) {
  const cream = "#F4E5C6";
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10 overflow-visible min-[390px]:h-11 min-[390px]:w-11" fill="none"
      style={{ opacity: active ? 1 : 0.34, filter: active ? "drop-shadow(0 5px 9px rgba(42,3,5,0.22))" : "none" }}>
      <path d="M11 14h23l-2.4 25H14L11 14Z" fill={active ? cream : "transparent"} stroke={cream} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 14h26" stroke={cream} strokeWidth="2.3" strokeLinecap="round" />
      <path d="M13 18h20" stroke={active ? "#741A1D" : cream} strokeWidth="1.2" opacity="0.7" />
      <path d="M17 26h12" stroke={active ? "#741A1D" : cream} strokeWidth="1.35" strokeLinecap="round" opacity="0.9" />
      <path d="M18.5 29.5h9" stroke={active ? "#741A1D" : cream} strokeWidth="1.15" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function KekaLogo() {
  const cream = "#F4E5C6";
  return (
    <div className="mx-auto w-full max-w-[300px]" aria-label="Keka">
      <svg viewBox="0 0 420 150" className="h-auto w-full overflow-visible" role="img">
        <g fill="none" stroke={cream} strokeWidth="16" strokeLinecap="square" strokeLinejoin="round">
          <path d="M55 82v35h64c29 0 45-15 45-40V58h-31" />
          <path d="M365 82v35h-64c-29 0-45-15-45-40V58h31" />
          <path d="M137 117h146" />
          <path d="M128 43l29-12" />
          <path d="M292 43l29-12" />
        </g>
        <rect x="45" y="55" width="11" height="11" fill={cream} />
        <rect x="62" y="55" width="11" height="11" fill={cream} />
        <rect x="204" y="128" width="11" height="11" fill={cream} />
        <rect x="221" y="128" width="11" height="11" fill={cream} />
        <text x="210" y="59" textAnchor="middle" fill="#F06A86" fontSize="34" fontWeight="700" fontFamily="Arial, sans-serif">Keka</text>
      </svg>
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
  const burgundy = "#741A1D";
  const burgundyDeep = "#4A0D10";
  const cream = "#F4E5C6";
  const creamSoft = "#FFF6E6";
  const totalSlots = Math.max(customer.cafe.rewardTarget, rewardTarget + 1, 2);
  const paidTarget = Math.max(totalSlots - 1, 1);
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
          color: creamSoft,
          borderColor: "rgba(244,229,198,0.12)",
          background: `
            radial-gradient(circle at 85% 5%, rgba(255,220,180,0.09), transparent 28%),
            radial-gradient(circle at 8% 90%, rgba(255,210,170,0.05), transparent 32%),
            linear-gradient(150deg, #8A2426 0%, ${burgundy} 48%, ${burgundyDeep} 100%)
          `,
          boxShadow: "0 28px 90px rgba(61,8,10,0.28)",
        }}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.38em]" style={{ color: "rgba(244,229,198,0.72)" }}>
              Good coffee · better days
            </p>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.42em]" style={{ color: "rgba(244,229,198,0.48)" }}>
              Alexandria
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh loyalty card"
            className="flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-50"
            style={{ borderColor: "rgba(244,229,198,0.16)", color: cream }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </header>

        <div className="mt-8 text-center">
          <KekaLogo />
          <p className="mt-4 font-serif text-[17px] tracking-[0.02em] min-[390px]:text-[19px]" style={{ color: creamSoft }}>
            Little Rituals, Big Comfort
          </p>
        </div>

        {(customer.cafe.eligiblePurchaseDescription?.trim() || customer.cafe.rewardDescription?.trim()) && (
          <div className="mt-7 rounded-[18px] border px-4 py-3 text-center" style={{ borderColor: "rgba(244,229,198,0.13)", backgroundColor: "rgba(55,5,8,0.12)" }}>
            {customer.cafe.eligiblePurchaseDescription?.trim() && (
              <p className="text-[11px] leading-5" style={{ color: "rgba(255,246,230,0.72)" }}>
                {customer.cafe.eligiblePurchaseDescription.trim()}
              </p>
            )}
            {customer.cafe.rewardDescription?.trim() && (
              <p className="mt-1 text-[11px] font-medium leading-5" style={{ color: cream }}>
                {customer.cafe.rewardDescription.trim()}
              </p>
            )}
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "rgba(244,229,198,0.58)" }}>
              Your rituals
            </p>
            <p className="text-[15px] font-semibold tracking-[0.08em]" style={{ color: cream }}>
              {displayStamps} / {totalSlots}
            </p>
          </div>

          <div className="mt-5 grid items-center gap-1" style={{ gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 1fr))` }}>
            {Array.from({ length: totalSlots }).map((_, index) => {
              const isPurchaseSlot = index < paidTarget;
              const active = isPurchaseSlot && index < displayStamps;
              const isNew = isPurchaseSlot && newStampIndex === index;
              const rewardSlotReady = !isPurchaseSlot && rewardReady;
              return (
                <div key={index} className={"flex min-w-0 justify-center " + (isNew ? "keka-stamp-glow" : "")}>
                  <KekaCupStamp active={active || rewardSlotReady} />
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="h-[3px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(244,229,198,0.15)" }}>
              <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: progressPercent + "%", backgroundColor: cream }} />
            </div>
            <p className="mt-4 text-center font-serif text-[16px]" style={{ color: "rgba(255,246,230,0.86)" }}>
              {progressMessage}
            </p>
          </div>
        </section>

        <div className="h-7" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setBirthdayOpen((current) => !current)}
          className="flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left transition"
          style={{ borderColor: "rgba(244,229,198,0.14)", backgroundColor: "rgba(58,7,9,0.16)" }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]" style={{ backgroundColor: "rgba(244,229,198,0.11)", color: cream }}>
            <Cake size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px]" style={{ color: "rgba(244,229,198,0.55)" }}>Your Birthday</p>
            <p className="mt-0.5 text-[14px] font-semibold" style={{ color: creamSoft }}>{birthdayText}</p>
          </div>
          <p className="shrink-0 text-[11px]" style={{ color: "rgba(244,229,198,0.55)" }}>
            {daysUntilBirthday === 0 ? "Today" : `In ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`}
          </p>
          <ChevronRight size={16} style={{ color: "rgba(244,229,198,0.5)", transform: birthdayOpen ? "rotate(90deg)" : "none", transition: "transform 180ms ease" }} />
        </button>

        {birthdayOpen && (
          <div className="mt-2 rounded-[18px] border px-4 py-4 text-xs leading-5" style={{ borderColor: "rgba(244,229,198,0.14)", backgroundColor: "rgba(58,7,9,0.2)", color: "rgba(255,246,230,0.72)" }}>
            {customer.cafe.birthdayRewardsEnabled ? (
              <>
                <p className="font-semibold" style={{ color: creamSoft }}>{customer.cafe.birthdayRewardName || "Birthday Reward"}</p>
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
          style={{ backgroundColor: cream, color: burgundyDeep, boxShadow: "0 14px 30px rgba(42,3,5,0.2)" }}
        >
          <QrCode size={19} />
          Show QR Code
        </button>

        {customer.cafe.feedbackEnabled && (
          <button
            type="button"
            onClick={onShowFeedback}
            className="mt-3 flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left transition"
            style={{ borderColor: "rgba(244,229,198,0.14)", backgroundColor: "rgba(58,7,9,0.16)", color: creamSoft }}
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={18} style={{ color: cream }} />
              <div>
                <p className="text-sm font-semibold">Share your thoughts</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "rgba(244,229,198,0.55)" }}>Help us make Keka even better.</p>
              </div>
            </div>
            <ChevronRight size={17} style={{ color: "rgba(244,229,198,0.5)" }} />
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: "#9A7773" }}>
        Powered by BeLoyal
      </p>

      <style jsx global>{`
        @keyframes keka-stamp-glow {
          0% { filter: drop-shadow(0 0 0 rgba(244,229,198,0)); transform: scale(0.92); }
          42% { filter: drop-shadow(0 0 10px rgba(244,229,198,0.72)); transform: scale(1.06); }
          100% { filter: drop-shadow(0 0 0 rgba(244,229,198,0)); transform: scale(1); }
        }
        .keka-stamp-glow { animation: keka-stamp-glow 820ms cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .keka-stamp-glow { animation: none; }
        }
      `}</style>
    </div>
  );
}
