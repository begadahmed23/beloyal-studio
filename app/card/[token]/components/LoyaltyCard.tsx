"use client";
import LanguageToggle, { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import type { BusinessType, LoyaltyMode } from "@prisma/client";
import Image from "next/image";
import FireyCardFace from "@/components/loyalty/FireyCardFace";
import { fireyNashBrand } from "@/lib/business/points";
import { ArrowUpRight, ChevronDown, Flame, MapPin, MessageCircle, QrCode, RefreshCw } from "lucide-react";
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
  onRedeemReward: (reward: { id: string; name: string }) => void;
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
  const flameCard = firey && points;
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
        {flameCard ? <FireyCardFace balance={customer.pointsBalance ?? "0"} label={copy("Flame balance", "رصيد اللهب")} /> :
          <CardBrandHeader business={cafe} balance={points ? { value: customer.pointsBalance ?? "0", label: firey ? copy("Flames", "اللهب") : copy("Points balance", "رصيد النقاط") } : undefined} progress={points ? undefined : { target: rewardTarget, stamps: visibleStamps, label: t(rewardReady ? "Reward ready" : cafe.businessType === "BARBERSHOP" ? "Visits" : "Stamps") }}
          logoUrl={props.showLogo ? props.logoUrl : null}
          onLogoError={props.logoUrl ? () => props.onLogoError(props.logoUrl!) : undefined} />}
        {!points && <CardStampStrip business={cafe} target={rewardTarget} stamps={visibleStamps} accent={props.primaryColor}
          ink={textPrimary} background={cardBackground} newStampIndex={props.newStampIndex} />}

        <div className={points ? "space-y-4 px-5 py-5 sm:px-7 sm:py-6" : "space-y-3 px-4 py-4 min-[380px]:px-5"}>
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
            style={{ backgroundColor: flameCard ? props.primaryColor : mbVape ? MB_VAPE_WALNUT : textPrimary, color: flameCard ? "#0b0b0c" : mbVape ? MB_VAPE_IVORY : cardBackground }}
          >
            <QrCode size={18} aria-hidden="true" /> {points ? copy("Show membership QR", "عرض كود العضوية") : t("Show QR Code")}
          </button>

          {cafe.feedbackEnabled && (
            <button
              type="button"
              onClick={onShowFeedback}
              aria-haspopup="dialog"
              className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-opacity hover:opacity-85 active:opacity-75"
              style={{ backgroundColor: props.surfaceColor, borderColor: props.primaryBorder, color: textPrimary }}
            >
              <MessageCircle size={18} aria-hidden="true" /> {points ? copy("Send feedback", "إرسال ملاحظات") : t("Share your thoughts")}
            </button>
          )}

          {(walletEnabled || googleEnabled) && (
            <div className="-mx-3 flex flex-wrap items-start justify-center gap-x-2 [&>div]:m-0 [&>div]:w-auto">
              <AppleWalletButton token={customer.publicToken} enabled={Boolean(walletEnabled)} />
              <GoogleWalletButton token={customer.publicToken} enabled={Boolean(googleEnabled)} />
            </div>
          )}

          {props.birthdayText && <BirthdayCustomerDisplay {...props} />}
          {points && !!customer.rewards?.length && (
            <section aria-labelledby="card-rewards" className={flameCard ? "space-y-4 border-t pt-5" : "space-y-3 border-t pt-4"} style={{ borderColor: cardBorder }}>
              <h2 id="card-rewards" className={flameCard ? "text-[1.375rem] font-semibold tracking-tight" : "text-lg font-semibold tracking-tight"}>{copy("Rewards", "المكافآت")}</h2>
              {customer.rewards.map(reward => {
                const cost = Number(reward.cost);
                const balance = Math.min(cost, Number(customer.pointsBalance ?? "0"));
                const available = reward.remaining === "0";
                return (
                  <article key={reward.id} className={flameCard ? "overflow-hidden rounded-[24px] border shadow-[0_12px_24px_#0003]" : "overflow-hidden rounded-[20px] border"}
                    style={{ borderColor: cardBorder, background: flameCard ? "linear-gradient(155deg, #201914 0%, #151517 56%)" : props.surfaceColor }}>
                    {reward.photoUrl && (
                      <div className={flameCard ? "grid aspect-[4/3] place-items-center border-b p-3 sm:aspect-[16/10]" : "grid place-items-center border-b p-2"}
                        style={{ background: flameCard ? "radial-gradient(ellipse at 50% 85%, #392017 0%, #101012 72%)" : cardBackground, borderColor: cardBorder }}>
                        <Image src={reward.photoUrl} alt={reward.name} width={460} height={300} unoptimized
                          className={flameCard ? "h-full min-h-0 w-full rounded-[14px] object-contain" : "h-auto max-h-52 w-full rounded-xl object-contain"} />
                      </div>
                    )}
                    <div className={flameCard ? "space-y-3.5 px-4 py-5 sm:px-5" : "space-y-3 p-4"}>
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <h3 className={flameCard ? "min-w-0 flex-1 wrap-anywhere text-lg leading-tight font-semibold tracking-tight" : "min-w-0 wrap-anywhere text-base font-semibold tracking-tight"}>{reward.name}</h3>
                        <p className={flameCard ? "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums" : "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"} style={{ color: flameCard ? props.primaryColor : textPrimary, backgroundColor: props.primarySoft }}>
                          {flameCard && <Flame size={13} className="shrink-0" aria-hidden="true" />}
                          <bdi className="wrap-anywhere">{reward.cost}</bdi> {unit}
                        </p>
                      </div>
                      {reward.description && <p className="wrap-anywhere text-sm leading-relaxed" style={{ color: textSecondary }}>{reward.description}</p>}
                      {reward.conditions && <p className="wrap-anywhere text-xs leading-relaxed" style={{ color: textSecondary }}>{reward.conditions}</p>}
                      {!!reward.locations.length && <p className={flameCard ? "flex items-start gap-1.5 wrap-anywhere text-xs" : "wrap-anywhere text-xs"} style={{ color: textMuted }}>
                        {flameCard && <MapPin size={13} className="shrink-0" aria-hidden="true" />}
                        <span className="min-w-0">{reward.locations.map(item => item.location.name).join(" · ")}</span>
                      </p>}
                      {available ? (
                        <button type="button" onClick={() => props.onRedeemReward(reward)}
                          className={flameCard ? "flex min-h-12 w-full items-center justify-between gap-2 rounded-[14px] px-4 text-start text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-75" : "min-h-11 w-full rounded-xl px-4 text-sm font-semibold transition-opacity active:opacity-75"}
                          style={{ backgroundColor: flameCard ? props.primaryColor : textPrimary, color: flameCard ? "#0b0b0c" : cardBackground }}>
                          {copy("Redeem reward", "استبدال المكافأة")}
                          {flameCard && <ArrowUpRight size={17} className="shrink-0 rtl:-scale-x-100" aria-hidden="true" />}
                        </button>
                      ) : (
                        <div className={flameCard ? "space-y-2 border-t pt-3" : "space-y-2"} style={flameCard ? { borderColor: cardBorder } : undefined}>
                          <p className="text-xs font-medium" style={{ color: textSecondary }}>{copy(`${reward.remaining} more ${unit} needed`, `فاضل ${reward.remaining} ${unit}`)}</p>
                          <div role="progressbar" aria-label={reward.name} aria-valuemin={0} aria-valuemax={cost} aria-valuenow={balance}
                            className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: props.primarySoft }}>
                            <div className="h-full rounded-full" style={{ width: `${balance / cost * 100}%`, backgroundColor: props.primaryColor }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
          <div className="flex items-start justify-between gap-2 border-t pt-1" style={{ borderColor: cardBorder }}>
            <details className="group min-w-0 flex-1 text-xs leading-5" style={{ color: textSecondary }}>
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
                {t("Card details")} <ChevronDown size={14} aria-hidden="true" className="group-open:rotate-180" />
              </summary>
              <div className="space-y-2 pb-2">
                {!points && <p>{cafe.eligiblePurchaseDescription || t(defaultRule)}</p>}
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
