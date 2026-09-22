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
  onRefresh: () => void;
  onShowQrCode: () => void;
  onShowFeedback: () => void;
};

function capitalizeFirstLetter(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function LorettoLogo({ color }: { color: string }) {
  return (
    <div className="inline-flex flex-col items-end" aria-label="LORETTO">
      <div
        className="flex items-baseline font-serif text-[2.55rem] font-bold uppercase leading-[0.9] tracking-[0.02em] min-[390px]:text-[2.95rem]"
        style={{ color }}
      >
        <span>L</span>
        <span>O</span>
        <span className="inline-block" style={{ transform: "scaleX(-1)" }} aria-hidden="true">
          R
        </span>
        <span>E</span>
        <span>T</span>
        <span>T</span>
        <span>O</span>
      </div>
      <p
        className="mt-2 pr-[1px] text-[7px] font-semibold uppercase tracking-[0.27em] min-[390px]:text-[8px]"
        style={{ color }}
      >
        Artisan coffee &amp; bakery
      </p>
    </div>
  );
}

function LorettoStamp({
  active,
  reward,
  rewardReady,
}: {
  active: boolean;
  reward: boolean;
  rewardReady: boolean;
}) {
  const ink = "#2E2A27";
  const cream = "#F6F0E5";
  const activeStamp = active || (reward && rewardReady);

  return (
    <div
      className="relative flex h-10 w-10 items-center justify-center rounded-full border min-[375px]:h-11 min-[375px]:w-11"
      style={{
        borderColor: activeStamp
          ? ink
          : reward
            ? "rgba(46,42,39,.28)"
            : "rgba(46,42,39,.17)",
        backgroundColor: activeStamp ? ink : "rgba(255,255,255,.16)",
        color: activeStamp ? cream : "rgba(46,42,39,.40)",
        boxShadow: activeStamp ? "0 7px 18px rgba(46,42,39,.13)" : "none",
      }}
    >
      <span className="font-serif text-[12px] font-bold tracking-[-0.04em]">
        {reward ? "FREE" : "LO"}
      </span>
    </div>
  );
}

export default function LorettoLoyaltyCard({
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

  // Loretto is intentionally cream-led in both saved variants.
  // DARK_LUXURY becomes a warmer "heritage cream" rather than a dark card.
  const heritage = customer.cafe.theme === "DARK_LUXURY";

  const ink = "#2E2A27";
  const espresso = "#4A3D34";
  const cream = heritage ? "#E9DFC9" : "#F3EBDD";
  const creamTop = heritage ? "#F1E7D4" : "#F8F3EA";
  const creamBottom = heritage ? "#E4D7BD" : "#ECE2D1";
  const softCream = heritage ? "#EEE4D0" : "#F7F1E7";
  const sage = "#7E897F";
  const aubergine = "#776474";
  const muted = "rgba(46,42,39,.57)";
  const border = "rgba(46,42,39,.11)";
  const customerName = capitalizeFirstLetter(customer.name);

  const paidTarget = Math.max(rewardTarget, 1);
  const totalSlots = paidTarget + 1;
  const displayStamps = Math.min(visibleStamps, paidTarget);
  const remaining = Math.max(paidTarget - displayStamps, 0);
  const progressPercent = rewardReady
    ? 100
    : Math.min((displayStamps / paidTarget) * 100, 100);

  const progressMessage = rewardReady
    ? "Your next drink is on us."
    : displayStamps === 0
      ? "Your first stamp is waiting."
      : remaining === 1
        ? "One more visit."
        : remaining + " more visits until your reward.";

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div
        className="overflow-hidden rounded-[30px] px-4 pb-6 pt-5 min-[375px]:px-5 min-[390px]:rounded-[34px] min-[390px]:px-7 min-[390px]:pb-8 min-[390px]:pt-7"
        style={{
          color: ink,
          background:
            "radial-gradient(circle at 92% 2%, rgba(126,137,127,.09), transparent 24%), " +
            "radial-gradient(circle at 8% 96%, rgba(119,100,116,.055), transparent 25%), " +
            `linear-gradient(155deg, ${creamTop} 0%, ${cream} 52%, ${creamBottom} 100%)`,
          boxShadow: "0 28px 90px rgba(57,48,41,.15)",
        }}
      >
        <header>
          <div className="flex items-start justify-between gap-4">
            <LorettoLogo color={ink} />

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh loyalty card"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50"
              style={{
                color: muted,
                backgroundColor: "rgba(255,255,255,.32)",
                border: "1px solid rgba(46,42,39,.08)",
              }}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="mt-8">
            <p className="text-[14px] font-medium" style={{ color: muted }}>
              Good to see you,
            </p>
            <h1 className="mt-1 truncate pb-[.08em] font-serif text-[2.2rem] font-semibold leading-none tracking-[-.045em]">
              {customerName}
            </h1>
          </div>
        </header>

        {(customer.cafe.eligiblePurchaseDescription?.trim() ||
          customer.cafe.rewardDescription?.trim()) && (
          <div
            className="mt-6 grid gap-2 rounded-[20px] px-4 py-3.5"
            style={{
              backgroundColor: "rgba(255,255,255,.25)",
              border: `1px solid ${border}`,
            }}
          >
            {customer.cafe.eligiblePurchaseDescription?.trim() && (
              <p className="text-[11px] font-medium leading-5" style={{ color: muted }}>
                <span className="font-semibold" style={{ color: espresso }}>
                  Eligible purchase:
                </span>{" "}
                {customer.cafe.eligiblePurchaseDescription.trim()}
              </p>
            )}
            {customer.cafe.rewardDescription?.trim() && (
              <p className="text-[11px] font-medium leading-5" style={{ color: muted }}>
                <span className="font-semibold" style={{ color: espresso }}>
                  Reward:
                </span>{" "}
                {customer.cafe.rewardDescription.trim()}
              </p>
            )}
          </div>
        )}

        <section
          className="relative mt-5 overflow-hidden rounded-[26px] px-4 pb-5 pt-5 min-[390px]:rounded-[30px] min-[390px]:px-5 min-[390px]:pb-6"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,.52) 0%, rgba(242,234,219,.72) 100%)",
            border: `1px solid ${border}`,
            boxShadow:
              "0 16px 40px rgba(57,48,41,.07), inset 0 1px 0 rgba(255,255,255,.54)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(126,137,127,.10)" }}
          />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[.30em]" style={{ color: aubergine }}>
                Loretto loyalty
              </p>
              <p className="mt-1 font-serif text-[18px] font-semibold" style={{ color: espresso }}>
                Buy {paidTarget} · Get 1 free
              </p>
            </div>

            <p className="shrink-0 text-[15px] font-semibold tracking-[.08em]" style={{ color: espresso }}>
              {displayStamps} / {totalSlots}
            </p>
          </div>

          <div
            className="relative mt-7 grid items-center gap-1"
            style={{ gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: totalSlots }).map((_, index) => {
              const isPurchaseSlot = index < paidTarget;
              const active = isPurchaseSlot && index < displayStamps;
              const isNew = isPurchaseSlot && newStampIndex === index;
              const rewardSlot = !isPurchaseSlot;

              return (
                <div
                  key={index}
                  className={
                    "flex min-w-0 justify-center py-1 " +
                    (isNew ? "loretto-stamp-glow" : "")
                  }
                >
                  <LorettoStamp
                    active={active}
                    reward={rewardSlot}
                    rewardReady={rewardReady}
                  />
                </div>
              );
            })}
          </div>

          <div className="relative mt-7">
            <div className="h-[3px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(46,42,39,.09)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: progressPercent + "%",
                  background: `linear-gradient(90deg, ${sage}, ${aubergine})`,
                }}
              />
            </div>
            <p className="mt-3 text-center text-[11px] font-medium tracking-[.02em]" style={{ color: muted }}>
              {progressMessage}
            </p>
          </div>
        </section>

        <div className="my-6 flex items-center justify-center gap-3">
          <span className="h-px w-7" style={{ backgroundColor: "rgba(46,42,39,.12)" }} />
          <span className="text-[8px] font-semibold uppercase tracking-[.33em]" style={{ color: aubergine }}>
            Alexandria · Egypt
          </span>
          <span className="h-px w-7" style={{ backgroundColor: "rgba(46,42,39,.12)" }} />
        </div>

        <button
          type="button"
          onClick={() => setBirthdayOpen((value) => !value)}
          className="flex w-full items-center gap-4 rounded-[22px] px-4 py-4 text-left transition hover:-translate-y-0.5 active:translate-y-0"
          style={{
            backgroundColor: "rgba(255,255,255,.34)",
            border: `1px solid ${border}`,
          }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundColor: softCream, color: aubergine }}
          >
            <Cake size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium" style={{ color: muted }}>
              Your Birthday
            </p>
            <p className="mt-0.5 font-serif text-[16px] font-semibold" style={{ color: espresso }}>
              {birthdayText}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium" style={{ color: muted }}>
              {daysUntilBirthday === 0
                ? "Today"
                : `In ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`}
            </p>
          </div>

          <ChevronRight
            size={17}
            style={{
              color: muted,
              transform: birthdayOpen ? "rotate(90deg)" : "none",
              transition: "transform 180ms ease",
            }}
          />
        </button>

        {birthdayOpen && (
          <div
            className="mt-2 rounded-[20px] px-4 py-4 text-xs leading-5"
            style={{
              backgroundColor: "rgba(255,255,255,.30)",
              border: `1px solid ${border}`,
              color: muted,
            }}
          >
            {customer.cafe.birthdayRewardsEnabled ? (
              <>
                <p className="font-semibold" style={{ color: espresso }}>
                  {customer.cafe.birthdayRewardName || "Birthday Reward"}
                </p>
                {customer.cafe.birthdayRewardDescription && (
                  <p className="mt-2">{customer.cafe.birthdayRewardDescription}</p>
                )}
                {customer.cafe.birthdayPurchaseRequirement && (
                  <p className="mt-2">{customer.cafe.birthdayPurchaseRequirement}</p>
                )}
                <p className="mt-2">
                  Valid for {customer.cafe.birthdayValidityDays}{" "}
                  {customer.cafe.birthdayValidityDays === 1 ? "day" : "days"} from your birthday.
                </p>
              </>
            ) : (
              <p>Birthday rewards are not currently active.</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onShowQrCode}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-[22px] text-[15px] font-semibold transition hover:-translate-y-0.5 active:translate-y-0"
          style={{
            backgroundColor: ink,
            color: creamTop,
            boxShadow: "0 14px 32px rgba(46,42,39,.18)",
          }}
        >
          <QrCode size={18} />
          Show QR Code
        </button>

        {customer.cafe.feedbackEnabled && (
          <button
            type="button"
            onClick={onShowFeedback}
            className="mt-3 flex w-full items-center justify-between rounded-[22px] px-4 py-3.5 text-left transition hover:-translate-y-0.5 active:translate-y-0"
            style={{
              backgroundColor: "rgba(255,255,255,.28)",
              border: `1px solid ${border}`,
              color: ink,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[13px]"
                style={{ backgroundColor: softCream, color: sage }}
              >
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Share your thoughts</p>
                <p className="mt-0.5 text-[11px]" style={{ color: muted }}>
                  Tell us about your Loretto visit.
                </p>
              </div>
            </div>
            <ChevronRight size={17} style={{ color: muted }} />
          </button>
        )}
      </div>

      <p
        className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[.28em]"
        style={{ color: "rgba(46,42,39,.38)" }}
      >
        Powered by BeLoyal
      </p>

      <style jsx global>{`
        @keyframes loretto-stamp-glow {
          0%, 100% {
            filter: drop-shadow(0 0 0 rgba(126,137,127,0));
            transform: scale(1);
          }
          45% {
            filter:
              drop-shadow(0 0 7px rgba(126,137,127,.62))
              drop-shadow(0 0 15px rgba(119,100,116,.26));
            transform: scale(1.06);
          }
        }

        .loretto-stamp-glow {
          animation: loretto-stamp-glow 760ms cubic-bezier(.16,1,.3,1) both;
          will-change: filter, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .loretto-stamp-glow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
