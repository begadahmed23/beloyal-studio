"use client";

import { CakeSlice, CheckCircle2, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type BirthdayConfig = {
  enabled: boolean;
  rewardName: string;
  rewardDescription: string | null;
  purchaseRequirement: string | null;
  validityDays: number;
  friendDiscountEnabled: boolean;
  oneFriendDiscount: number;
  groupDiscount: number;
};

type BirthdayOffer = {
  year: number;
  isActive: boolean;
  isBirthday: boolean;
  isDayAfterBirthday?: boolean;
  validDay?: string | null;
  redeemed: boolean;
  redeemedAt: string | null;
  canRedeem: boolean;
};

type BirthdayResponse = {
  message?: string;
  config?: BirthdayConfig;
  birthdayOffer?: BirthdayOffer;
};

type Props = {
  customerId: string;
  active: boolean;
  onRedeemed?: () => void;
};

export default function BirthdayRewardAction({
  customerId,
  active,
  onRedeemed,
}: Props) {
  const { cafe, theme } = useCafeTheme();
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<BirthdayConfig | null>(null);
  const [offer, setOffer] = useState<BirthdayOffer | null>(null);

  const loadOffer = useCallback(async () => {
    if (!active || !cafe.birthdayRewardsEnabled) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/customers/birthday-reward?id=${encodeURIComponent(customerId)}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      const data = (await response.json()) as BirthdayResponse;

      if (!response.ok) {
        throw new Error(data.message || "Unable to load birthday reward.");
      }

      setConfig(data.config ?? null);
      setOffer(data.birthdayOffer ?? null);
    } catch (caughtError) {
      console.error("Birthday reward lookup failed:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load birthday reward.",
      );
    } finally {
      setLoading(false);
    }
  }, [active, cafe.birthdayRewardsEnabled, customerId]);

  useEffect(() => {
    void loadOffer();
  }, [loadOffer]);

  async function redeemBirthdayReward() {
    if (!offer?.canRedeem || redeeming) {
      return;
    }

    try {
      setRedeeming(true);
      setError("");

      const response = await fetch("/api/customers/birthday-reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: customerId }),
      });

      const data = (await response.json()) as BirthdayResponse;

      if (!response.ok) {
        if (data.birthdayOffer?.redeemed) {
          setOffer(data.birthdayOffer);
        }

        throw new Error(data.message || "Unable to redeem birthday reward.");
      }

      if (data.config) {
        setConfig(data.config);
      }

      if (data.birthdayOffer) {
        setOffer(data.birthdayOffer);
      }

      window.dispatchEvent(new Event("birthday-rewards-updated"));
      onRedeemed?.();
    } catch (caughtError) {
      console.error("Birthday reward redemption failed:", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to redeem birthday reward.",
      );
    } finally {
      setRedeeming(false);
    }
  }

  if (!cafe.birthdayRewardsEnabled) {
    return null;
  }

  if (loading) {
    return (
      <div
        className="flex min-h-16 items-center justify-center border px-4 py-3"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surfaceRaised,
          borderRadius: theme.radiusMedium,
          color: theme.textMuted,
        }}
      >
        <LoaderCircle size={16} className="mr-2 animate-spin" />
        <span className="text-xs">Checking birthday offer...</span>
      </div>
    );
  }

  if (!config || !offer || (!offer.isActive && !offer.redeemed)) {
    return null;
  }

  return (
    <div
      className="border p-4"
      style={{
        borderColor: offer.redeemed ? `${theme.success}55` : `${theme.accent}55`,
        backgroundColor: offer.redeemed ? `${theme.success}0F` : theme.accentSoft,
        borderRadius: theme.radiusMedium,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          style={{
            backgroundColor: offer.redeemed ? `${theme.success}18` : theme.surface,
            color: offer.redeemed ? theme.success : theme.accent,
            borderRadius: theme.radiusMedium,
          }}
        >
          {offer.redeemed ? <CheckCircle2 size={19} /> : <CakeSlice size={19} />}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: offer.redeemed ? theme.success : theme.accent }}
          >
            Birthday offer
          </p>

          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: theme.textPrimary }}
          >
            {config.rewardName}
          </p>

          {config.purchaseRequirement && (
            <p className="mt-1 text-xs leading-5" style={{ color: theme.textMuted }}>
              {config.purchaseRequirement}
            </p>
          )}

          {config.friendDiscountEnabled && (
            <p className="mt-1 text-xs leading-5" style={{ color: theme.textMuted }}>
              1 friend: {config.oneFriendDiscount}% off · 2+ friends: {config.groupDiscount}% off
            </p>
          )}
        </div>
      </div>

      {offer.redeemed ? (
        <div
          className="mt-4 flex h-11 items-center justify-center gap-2 border text-sm font-semibold"
          style={{
            borderColor: `${theme.success}55`,
            color: theme.success,
            backgroundColor: `${theme.success}10`,
            borderRadius: theme.radiusMedium,
          }}
        >
          <CheckCircle2 size={17} />
          Birthday Gift Redeemed
        </div>
      ) : (
        <button
          type="button"
          onClick={redeemBirthdayReward}
          disabled={!offer.canRedeem || redeeming}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: theme.accent,
            color: theme.buttonText,
            borderRadius: theme.radiusMedium,
          }}
        >
          {redeeming ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <CakeSlice size={17} />
          )}
          {redeeming ? "Redeeming..." : "Redeem Birthday Gift"}
        </button>
      )}

      {error && (
        <p className="mt-3 text-xs leading-5" style={{ color: theme.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
