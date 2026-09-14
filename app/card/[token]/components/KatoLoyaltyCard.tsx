"use client";

import { Cake, ChevronRight, QrCode, RefreshCw } from "lucide-react";

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
}: Props) {
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

        <section
          className="relative mt-6 overflow-hidden rounded-[26px] px-4 pb-5 pt-5 min-[375px]:mt-7 min-[390px]:rounded-[30px] min-[390px]:px-6 min-[390px]:pb-7 min-[390px]:pt-6"
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
                    "flex min-w-0 items-center justify-center py-1 transition-all duration-500 " +
                    (isNew ? "scale-125" : "scale-100")
                  }
                  style={{
                    color: rewardSlotReady
                      ? "rgba(255,255,255,0.82)"
                      : active
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.30)",
                    filter: active
                      ? isNew
                        ? "drop-shadow(0 0 18px rgba(255,255,255,1))"
                        : "drop-shadow(0 0 10px rgba(255,255,255,0.72))"
                      : "none",
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
                className="h-full rounded-full bg-[#F7F5EC] transition-[width,box-shadow,filter] duration-700 ease-out"
                style={{
                  width: progressPercent + "%",
                  boxShadow:
                    displayStamps > 0
                      ? newStampIndex !== null
                        ? "0 0 8px rgba(255,255,255,0.9), 0 0 18px rgba(255,255,255,0.68), 0 0 30px rgba(247,245,236,0.38)"
                        : "0 0 7px rgba(255,255,255,0.48), 0 0 16px rgba(247,245,236,0.28)"
                      : "none",
                  filter:
                    displayStamps > 0
                      ? newStampIndex !== null
                        ? "brightness(1.22)"
                        : "brightness(1.08)"
                      : "none",
                }}
              />
            </div>

            <p className="mt-3 text-center text-[11px] font-medium tracking-[0.04em] text-white/70">
              {progressMessage}
            </p>
          </div>

          <p className="relative mt-5 text-center text-[9px] font-medium uppercase tracking-[0.42em] text-white/42">
            Good coffee leads to good days
          </p>
        </section>

        <section
          className="mt-5 flex items-center gap-4 rounded-[24px] border px-4 py-4 min-[390px]:px-5"
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
            <p
              className="text-[12px] font-medium"
              style={{ color: muted }}
            >
              Your Birthday
            </p>

            <p
              className="mt-0.5 text-[16px] font-semibold"
              style={{ color: birthdayTextColor }}
            >
              {birthdayText}
            </p>
          </div>

          <div
            className="h-12 w-px shrink-0"
            style={{ backgroundColor: border }}
          />

          <div className="shrink-0 text-right">
            <p
              className="text-[13px] font-medium"
              style={{ color: muted }}
            >
              {daysUntilBirthday === 0
                ? "Today"
                : "In " +
                  daysUntilBirthday +
                  " " +
                  (daysUntilBirthday === 1 ? "day" : "days")}
            </p>
          </div>

          <ChevronRight size={18} style={{ color: "#9AA6B5" }} />
        </section>

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
