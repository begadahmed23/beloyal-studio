"use client";

import { Cake, ChevronRight, QrCode, RefreshCw } from "lucide-react";
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
  size = 42,
}: {
  active?: boolean;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      fill="none"
      style={{
        overflow: "visible",
        filter: active
          ? "drop-shadow(0 0 11px rgba(255,255,255,0.95))"
          : "none",
      }}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M250 140 A150 150 0 1 0 250 440 A150 150 0 1 0 250 140 Z M250 174 A116 116 0 1 1 250 406 A116 116 0 1 1 250 174 Z"
      />
      <path
        fill="currentColor"
        d="M180 60 L180 98 C220 120 280 120 320 98 L320 60 C275 90 225 90 180 60 Z"
      />
    </svg>
  );
}

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
  const navy = "#102B49";
  const navyDeep = "#0A223E";
  const white = "#FFFFFF";
  const pageText = "#102B49";
  const muted = "#7F8DA0";
  const border = "#E5EAF0";
  const soft = "#F7F9FB";

  const totalSlots = Math.max(customer.cafe.rewardTarget, rewardTarget + 1, 2);
  const paidTarget = Math.max(totalSlots - 1, 1);
  const displayStamps = Math.min(visibleStamps, paidTarget);
  const customerName = capitalizeFirstLetter(customer.name);

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="overflow-hidden rounded-[30px] bg-white px-4 pb-6 pt-5 shadow-[0_28px_90px_rgba(16,43,73,0.12)] min-[375px]:px-5 min-[390px]:rounded-[34px] min-[390px]:px-7 min-[390px]:pb-8 min-[390px]:pt-7">
        <header>
          <div className="flex items-start justify-between gap-4 min-[390px]:gap-5">
            <div className="min-w-0">
              <div
                className="text-[2.15rem] font-light leading-none tracking-[-0.08em] min-[375px]:text-[2.35rem] min-[390px]:text-[2.75rem]"
                style={{ color: navy }}
              >
                KATŌ
              </div>

              <p
                className="mt-2 text-[9px] font-semibold uppercase tracking-[0.38em]"
                style={{ color: navy }}
              >
                Specialty Coffee
              </p>
            </div>

            <div
              className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full min-[375px]:h-[70px] min-[375px]:w-[70px] min-[390px]:h-[76px] min-[390px]:w-[76px]"
              style={{ backgroundColor: navy, color: "#E9E6D8" }}
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-[#F4F6F8] disabled:opacity-50"
              style={{ color: muted }}
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

          <p className="relative mt-8 text-center text-[9px] font-medium uppercase tracking-[0.42em] text-white/48">
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
              backgroundColor: "#EEF3F7",
              color: navy,
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
              style={{ color: navyDeep }}
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
          style={{ backgroundColor: navy }}
        >
          <QrCode size={19} />
          Show QR Code
        </button>
      </div>

      <p className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[0.28em] text-[#A0AAB6]">
        Powered by BeLoyal
      </p>
    </div>
  );
}
