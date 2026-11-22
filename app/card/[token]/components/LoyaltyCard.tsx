"use client";
import LanguageToggle, { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import type { BusinessType } from "@prisma/client";
import { ChevronDown, QrCode, RefreshCw } from "lucide-react";
import { CardBrandHeader, CardStampStrip, cardFrame } from "@/components/loyalty/CardBrand";
import { MB_VAPE_IVORY, MB_VAPE_WALNUT } from "@/lib/business/mb-vape";
import AppleWalletButton from "./AppleWalletButton";
import BirthdayCustomerDisplay from "./BirthdayCustomerDisplay";
import GoogleWalletButton from "./GoogleWalletButton";

export type Cafe = {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  logoUrl: string | null;
  theme: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
  minimumPurchaseAmount?: string | null;
  feedbackEnabled: boolean;
  feedbackRewardEnabled: boolean;
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

export type LoyaltyCardProps = {
  walletEnabled?: boolean;
  googleEnabled?: boolean;
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
  primaryColor: string;
  cardBackground: string;
  cardIsLight: boolean;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBorder: string;
  surfaceColor: string;
  surfaceRaised: string;
  primarySoft: string;
  primaryBorder: string;
  logoUrl: string | null;
  showLogo: boolean;
  onRefresh: () => void;
  onLogoError: (logoUrl: string) => void;
  onShowQrCode: () => void;
  onShowFeedback: () => void;
};

export default function LoyaltyCard(props: LoyaltyCardProps) {
  const { t, lang, dir } = useBeLoyalLanguage();
  const {
    customer, rewardTarget, visibleStamps, rewardReady, refreshing, onRefresh,
    walletEnabled, googleEnabled, onShowQrCode, onShowFeedback,
    cardBackground, cardBorder, cardIsLight, textPrimary, textSecondary, textMuted,
  } = props;
  const { cafe } = customer;
  const mbVape = cafe.businessType === "VAPE";
  const loretto = cafe.businessType === "CAFE" && /loretto/i.test(cafe.slug + cafe.name);
  const displayBackground = loretto ? "#193A32" : cardBackground;
  const displayInk = loretto ? "#F8F5ED" : textPrimary;
  const displayBorder = loretto ? "rgba(210,186,138,.38)" : cardBorder;
  const displayMuted = loretto ? "#D2BA8A" : textMuted;
  const displaySecondary = loretto ? "#E8E5D9" : textSecondary;
  const minimumPurchase = Number(cafe.minimumPurchaseAmount);
  const defaultRule = cafe.businessType === "BARBERSHOP" ? "One visit per eligible service." : "One stamp per eligible purchase.";

  return (
    <div className="mx-auto w-full max-w-md" lang={lang} dir={dir}>
      <div className="mb-3 flex justify-end"><LanguageToggle /></div>
      <article
        aria-label={`${cafe.name} loyalty card`}
        className={`${cardFrame} ${loretto ? "shadow-[0_30px_75px_rgba(16,47,36,.26)]" : ""}`}
        style={{ backgroundColor: displayBackground, borderColor: displayBorder, color: displayInk, colorScheme: loretto ? "dark" : cardIsLight ? "light" : "dark" }}
      >
        <CardBrandHeader business={cafe} progress={{ target: rewardTarget, stamps: visibleStamps, label: t(rewardReady ? "Reward ready" : cafe.businessType === "BARBERSHOP" ? "Visits" : "Stamps") }}
          logoUrl={loretto ? null : props.showLogo ? props.logoUrl : null}
          onLogoError={props.logoUrl ? () => props.onLogoError(props.logoUrl!) : undefined} />
        <CardStampStrip business={cafe} target={rewardTarget} stamps={visibleStamps} accent={props.primaryColor}
          ink={displayInk} background={displayBackground} newStampIndex={props.newStampIndex} />

        <div className="space-y-3 px-4 py-4 min-[380px]:px-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: displayMuted }}>{t("Member")}</p>
              <h1 className="mt-1 break-words text-base font-semibold leading-tight"><bdi>{customer.name}</bdi></h1>
            </div>
            <div className="min-w-0 border-s ps-3" style={{ borderColor: displayBorder }}>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: textMuted }}>{t("Your reward")}</p>
              <p className="mt-1 break-words text-base font-semibold leading-tight"><bdi>{cafe.rewardName || "Member reward"}</bdi></p>
            </div>
          </div>

          <button
            type="button"
            onClick={onShowQrCode}
            className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: mbVape ? MB_VAPE_WALNUT : loretto ? "#D2BA8A" : textPrimary, color: mbVape ? MB_VAPE_IVORY : loretto ? "#193A32" : cardBackground }}
          >
            <QrCode size={18} aria-hidden="true" /> {t("Show QR Code")}
          </button>

          {(walletEnabled || googleEnabled) && (
            <div className="-mx-3 flex flex-wrap items-start justify-center gap-x-2 [&>div]:m-0 [&>div]:w-auto">
              <AppleWalletButton token={customer.publicToken} enabled={Boolean(walletEnabled)} />
              <GoogleWalletButton token={customer.publicToken} enabled={Boolean(googleEnabled)} />
            </div>
          )}

          <div className="flex items-start justify-between gap-2 border-t pt-1" style={{ borderColor: cardBorder }}>
            <details className="group min-w-0 flex-1 text-xs leading-5" style={{ color: displaySecondary }}>
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
                {t("Card details")} <ChevronDown size={14} aria-hidden="true" className="group-open:rotate-180" />
              </summary>
              <div className="space-y-2 pb-2">
                <p>{cafe.eligiblePurchaseDescription || t(defaultRule)}</p>
                {minimumPurchase > 0 && <p>{t("Minimum purchase")} EGP {minimumPurchase.toLocaleString("en-EG")}</p>}
                {cafe.rewardDescription && <p>{cafe.rewardDescription}</p>}
                <p>{t("Member since")} {props.memberSince}</p>
                <p>{t("Last updated")} {props.lastUpdated}</p>
                {cafe.feedbackEnabled && (
                  <button type="button" onClick={onShowFeedback} className="min-h-10 text-sm underline underline-offset-4">
                    {t("Share your thoughts")}
                  </button>
                )}
              </div>
            </details>
            <button
              type="button"
              aria-label={t("Refresh loyalty card")}
              onClick={onRefresh}
              disabled={refreshing}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ color: textSecondary }}
            >
              <RefreshCw size={16} aria-hidden="true" className={refreshing ? "motion-safe:animate-spin" : undefined} />
            </button>
          </div>
          {props.birthdayText && <BirthdayCustomerDisplay {...props} cardBorder={displayBorder} surfaceColor={loretto ? "#244E41" : props.surfaceColor} surfaceRaised={loretto ? "#193A32" : props.surfaceRaised} textPrimary={displayInk} textSecondary={displaySecondary} textMuted={displayMuted} primaryColor={loretto ? "#D2BA8A" : props.primaryColor} primarySoft={loretto ? "rgba(210,186,138,.18)" : props.primarySoft} primaryBorder={displayBorder} />}
        </div>
      </article>
    </div>
  );
}
