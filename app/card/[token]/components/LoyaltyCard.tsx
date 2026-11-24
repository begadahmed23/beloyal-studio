"use client";
import LanguageToggle, { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import type { BusinessType, LoyaltyMode } from "@prisma/client";
import Image from "next/image";
import { fireyNashBrand } from "@/lib/business/points";
import { ChevronDown, MessageCircle, QrCode, RefreshCw } from "lucide-react";
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
  loyaltyMode?: LoyaltyMode;
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
  pointsBalance?: string;
  rewards?: { id: string; name: string; description: string | null; conditions: string | null; photoUrl: string | null;
    cost: string; remaining: string; locations: { location: { name: string } }[] }[];
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
  const minimumPurchase = Number(cafe.minimumPurchaseAmount);
  const points = cafe.loyaltyMode === "POINTS";
  const copy = (en: string, ar: string) => lang === "ar" ? ar : en;
  const firey = cafe.slug === fireyNashBrand.slug;
  const earnCopy = firey ? copy("Collect flames with your orders", "جمّع لهب مع طلباتك")
    : copy("Collect points with your purchases", "جمّع نقاط مع مشترياتك");
  const unit = firey ? copy("flames", "لهب") : copy("points", "نقطة");
  const defaultRule = cafe.businessType === "BARBERSHOP" ? "One visit per eligible service." : "One stamp per eligible purchase.";

  return (
    <div className="mx-auto w-full max-w-md" lang={lang} dir={dir}>
      <div className="mb-3 flex justify-end"><LanguageToggle /></div>
      <article
        aria-label={`${cafe.name} loyalty card`}
        className={cardFrame}
        style={{ backgroundColor: cardBackground, borderColor: cardBorder, color: textPrimary, colorScheme: cardIsLight ? "light" : "dark" }}
      >
        <CardBrandHeader business={cafe} balance={points ? { value: customer.pointsBalance ?? "0", label: firey ? copy("Flames", "اللهب") : copy("Points balance", "رصيد النقاط") } : undefined} progress={points ? undefined : { target: rewardTarget, stamps: visibleStamps, label: t(rewardReady ? "Reward ready" : cafe.businessType === "BARBERSHOP" ? "Visits" : "Stamps") }}
          logoUrl={props.showLogo ? props.logoUrl : null}
          onLogoError={props.logoUrl ? () => props.onLogoError(props.logoUrl!) : undefined} />
        {points ? <div className="flex items-center justify-center gap-3 border-y px-4 py-4 text-sm font-semibold" style={{ borderColor: cardBorder }}>
          {firey && <Image src={fireyNashBrand.flame} alt="" width={16} height={28} />}
          <p>{earnCopy}</p>
        </div> : <CardStampStrip business={cafe} target={rewardTarget} stamps={visibleStamps} accent={props.primaryColor}
          ink={textPrimary} background={cardBackground} newStampIndex={props.newStampIndex} />}

        <div className="space-y-3 px-4 py-4 min-[380px]:px-5">
          <div className={points ? "grid gap-3" : "grid grid-cols-2 gap-3"}>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: textMuted }}>{t("Member")}</p>
              <h1 className="mt-1 break-words text-base font-semibold leading-tight"><bdi>{customer.name}</bdi></h1>
            </div>
            {!points && <div className="min-w-0 border-s ps-3" style={{ borderColor: cardBorder }}>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ color: textMuted }}>{t("Your reward")}</p>
              <p className="mt-1 break-words text-base font-semibold leading-tight"><bdi>{cafe.rewardName || "Member reward"}</bdi></p>
            </div>}
          </div>

          <button
            type="button"
            onClick={onShowQrCode}
            className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: mbVape ? MB_VAPE_WALNUT : textPrimary, color: mbVape ? MB_VAPE_IVORY : cardBackground }}
          >
            <QrCode size={18} aria-hidden="true" /> {t("Show QR Code")}
          </button>

          {cafe.feedbackEnabled && (
            <button
              type="button"
              onClick={onShowFeedback}
              aria-haspopup="dialog"
              className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-75"
              style={{ backgroundColor: props.surfaceColor, borderColor: props.primaryBorder, color: textPrimary }}
            >
              <MessageCircle size={18} aria-hidden="true" /> {t("Share your thoughts")}
            </button>
          )}

          {(walletEnabled || googleEnabled) && (
            <div className="-mx-3 flex flex-wrap items-start justify-center gap-x-2 [&>div]:m-0 [&>div]:w-auto">
              <AppleWalletButton token={customer.publicToken} enabled={Boolean(walletEnabled)} />
              <GoogleWalletButton token={customer.publicToken} enabled={Boolean(googleEnabled)} />
            </div>
          )}

          {props.birthdayText && <BirthdayCustomerDisplay {...props} />}
          {points && <section className="space-y-3 border-t pt-3" style={{ borderColor: cardBorder }}>
            <h2 className="font-semibold">{copy("Rewards", "المكافآت")}</h2>
            {!customer.rewards?.length && <p className="text-sm">{copy("No rewards available yet.", "مفيش مكافآت متاحة دلوقتي.")}</p>}
            {customer.rewards?.map(reward => <article key={reward.id} className="overflow-hidden rounded-xl border" style={{ borderColor: cardBorder, backgroundColor: props.surfaceColor }}>
              {reward.photoUrl && <Image src={reward.photoUrl} alt="" width={460} height={200} unoptimized className="aspect-[2.3] w-full object-cover" />}
              <div className="space-y-2 p-3">
                <h3 className="text-sm font-semibold">{reward.name}</h3>
                <p className="text-xs">{reward.cost} {unit} · {reward.remaining === "0" ? copy("Available", "متاحة") : copy(`${reward.remaining} more ${unit} needed`, `فاضل ${reward.remaining} ${unit}`)}</p>
                <div role="progressbar" aria-label={reward.name} aria-valuemin={0} aria-valuemax={Number(reward.cost)}
                  aria-valuenow={Math.min(Number(reward.cost), Number(customer.pointsBalance))}
                  className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: props.primarySoft }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(customer.pointsBalance) / Number(reward.cost) * 100)}%`, backgroundColor: props.primaryColor }} />
                </div>
                {reward.description && <p className="text-xs">{reward.description}</p>}
                {reward.conditions && <p className="text-xs">{reward.conditions}</p>}
                <p className="text-xs">{reward.locations.map(item => item.location.name).join(" · ")}</p>
              </div>
            </article>)}
          </section>}
          <div className="flex items-start justify-between gap-2 border-t pt-1" style={{ borderColor: cardBorder }}>
            <details className="group min-w-0 flex-1 text-xs leading-5" style={{ color: textSecondary }}>
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
                {t("Card details")} <ChevronDown size={14} aria-hidden="true" className="group-open:rotate-180" />
              </summary>
              <div className="space-y-2 pb-2">
                <p>{points ? earnCopy : cafe.eligiblePurchaseDescription || t(defaultRule)}</p>
                {!points && minimumPurchase > 0 && <p>{t("Minimum purchase")} EGP {minimumPurchase.toLocaleString("en-EG")}</p>}
                {!points && cafe.rewardDescription && <p>{cafe.rewardDescription}</p>}
                <p>{t("Member since")} {props.memberSince}</p>
                <p>{t("Last updated")} {props.lastUpdated}</p>
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
        </div>
      </article>
    </div>
  );
}
