"use client";

import Image from "next/image";
import { ChevronDown, QrCode, RefreshCw } from "lucide-react";

import MbVapeLogo from "@/components/brand/MbVapeLogo";
import { MB_VAPE_ARTWORK_PATH, MB_VAPE_IVORY, MB_VAPE_WALNUT } from "@/lib/business/mb-vape";

import AppleWalletButton from "./AppleWalletButton";
import BirthdayCustomerDisplay from "./BirthdayCustomerDisplay";
import GoogleWalletButton from "./GoogleWalletButton";
import type { LoyaltyCardProps } from "./LoyaltyCard";

type Props = Pick<LoyaltyCardProps,
  "customer" | "rewardTarget" | "visibleStamps" | "rewardReady" | "refreshing" |
  "walletEnabled" | "googleEnabled" | "onShowQrCode" | "onRefresh" | "onShowFeedback" |
  "birthdayText" | "daysUntilBirthday" | "memberSince" | "lastUpdated" |
  "cardBackground" | "cardBorder" | "cardIsLight" | "textPrimary" | "textSecondary" | "textMuted" |
  "surfaceColor" | "surfaceRaised" | "primaryColor" | "primarySoft" | "primaryBorder"
>;

export default function MbVapeLoyaltyCard(props: Props) {
  const {
    customer, rewardTarget, visibleStamps, rewardReady, refreshing, onRefresh,
    walletEnabled, googleEnabled, onShowQrCode, onShowFeedback,
    cardBackground, cardBorder, cardIsLight, textPrimary, textSecondary, textMuted,
  } = props;
  const { cafe } = customer;
  const stripTarget = Math.min(rewardTarget, 99);
  const stripStamps = Math.min(visibleStamps, stripTarget);
  const strip = `${MB_VAPE_ARTWORK_PATH}?asset=strip&stamps=${stripStamps}&target=${stripTarget}`;
  const minimumPurchase = Number(cafe.minimumPurchaseAmount);
  const birthday = <BirthdayCustomerDisplay {...props} />;

  return (
    <article
      aria-label="MB Vape loyalty card"
      className="mx-auto w-full max-w-md overflow-hidden rounded-[26px] border shadow-[0_22px_56px_rgba(68,43,29,.18)]"
      style={{ backgroundColor: cardBackground, borderColor: cardBorder, color: textPrimary, colorScheme: cardIsLight ? "light" : "dark" }}
    >
      <header className="flex items-center justify-between gap-3 bg-white px-4 py-3.5 min-[380px]:px-5">
        <MbVapeLogo className="h-auto w-[clamp(8.75rem,43vw,11.75rem)]" />
        <div className="shrink-0 text-right" style={{ color: "#432B1D" }}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.10em]">
            {rewardReady ? "Reward ready" : "Stamps"}
          </p>
          <p className="mt-1 text-[1.7rem] font-semibold leading-none tabular-nums min-[380px]:text-3xl" aria-live="polite">
            {visibleStamps}<span className="mx-0.5 opacity-50">/</span>{rewardTarget}
          </p>
        </div>
      </header>

      <Image
        src={strip}
        alt=""
        width={1125}
        height={432}
        unoptimized
        loading="eager"
        className="block aspect-[375/144] h-auto w-full"
        style={{ backgroundColor: MB_VAPE_WALNUT }}
      />

      <div className="space-y-3 px-4 py-4 min-[380px]:px-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: textMuted }}>Member</p>
            <h1 className="mt-1 break-words text-base font-semibold leading-tight">{customer.name}</h1>
          </div>
          <div className="min-w-0 border-l pl-3" style={{ borderColor: cardBorder }}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: textMuted }}>Your reward</p>
            <p className="mt-1 break-words text-base font-semibold leading-tight">{cafe.rewardName || "Member reward"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onShowQrCode}
          className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ backgroundColor: MB_VAPE_WALNUT, color: MB_VAPE_IVORY }}
        >
          <QrCode size={18} aria-hidden="true" /> Show QR Code
        </button>

        {(walletEnabled || googleEnabled) && (
          <div className="-mx-3 flex flex-wrap items-center justify-center gap-x-2 [&>div]:m-0 [&>div]:w-auto">
            <AppleWalletButton token={customer.publicToken} enabled={Boolean(walletEnabled)} />
            <GoogleWalletButton token={customer.publicToken} enabled={Boolean(googleEnabled)} />
          </div>
        )}

        {cafe.birthdayRewardsEnabled && birthday}

        <div className="flex items-start justify-between gap-2 border-t pt-1" style={{ borderColor: cardBorder }}>
          <details className="group min-w-0 flex-1 text-xs leading-5" style={{ color: textSecondary }}>
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
              Card details <ChevronDown size={14} aria-hidden="true" className="group-open:rotate-180" />
            </summary>
            <div className="space-y-2 pb-2">
              <p>{cafe.eligiblePurchaseDescription || "One stamp per eligible purchase."}</p>
              {minimumPurchase > 0 && <p>Minimum purchase EGP {minimumPurchase.toLocaleString("en-EG")}</p>}
              {cafe.rewardDescription && <p>{cafe.rewardDescription}</p>}
              <p>Member since {props.memberSince}</p>
              <p>Last updated {props.lastUpdated}</p>
              {!cafe.birthdayRewardsEnabled && birthday}
              {cafe.feedbackEnabled && (
                <button type="button" onClick={onShowFeedback} className="min-h-10 text-sm underline underline-offset-4">
                  Share your thoughts
                </button>
              )}
            </div>
          </details>
          <button
            type="button"
            aria-label="Refresh loyalty card"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: textSecondary }}
          >
            <RefreshCw size={16} aria-hidden="true" className={refreshing ? "motion-safe:animate-spin" : undefined} />
          </button>
        </div>
      </div>
    </article>
  );
}
