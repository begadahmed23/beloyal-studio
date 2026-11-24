"use client";
import type { BusinessType } from "@prisma/client";

import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CheckCircle2, Clock3, X } from "lucide-react";
import { loyaltyScanValue, rewardScanValue } from "@/lib/business/loyalty-scan";
import QRCode from "react-qr-code";

type QrCodeModalProps = {
  businessType: BusinessType;
  cafeName: string;
  cafeSlug?: string;
  pointsBalance?: string;
  redeemReward?: { id: string; name: string } | null;
  memberNumber: string;
  publicToken: string;
  logoUrl: string | null;
  showLogo: boolean;
  cafeInitial: string;
  cardBorder: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surfaceColor: string;
  primaryColor: string;
  primaryGlow: string;
  primarySoft: string;
  accentText: string;
  onClose: () => void;
  onStampDetected: () => void;
  onLogoError: (logoUrl: string) => void;
};

type CardSyncResponse = {
  stamps?: number;
  pointsBalance?: string;
  updatedAt?: string;
};

const QR_SYNC_INTERVAL_MS = 2000;

type RewardCodeResponse = {
  code: string;
  status: "active" | "expired" | "redeemed";
  expiresAt: string;
  now: string;
};

function useRewardCode(publicToken: string, rewardId: string | undefined, onRedeemed: () => void) {
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState<string>();
  const [status, setStatus] = useState<RewardCodeResponse["status"] | "loading" | "error">("loading");
  const [seconds, setSeconds] = useState(0);
  const notifyRedeemed = useEffectEvent(onRedeemed);

  useEffect(() => {
    if (!rewardId) return;
    const controller = new AbortController();
    const url = `/api/customers/card/${encodeURIComponent(publicToken)}/reward-code`;
    let interval: number | undefined;
    let poll: number | undefined;
    let deadline = 0;

    function tick() {
      const remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        setStatus(current => current === "active" ? "expired" : current);
        window.clearInterval(interval);
      }
    }

    async function check(codeValue: string) {
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal, headers: { "X-Reward-Code": codeValue } });
        if (controller.signal.aborted) return;
        if (response.status === 404) {
          setStatus("expired");
          window.clearInterval(interval);
          return;
        }
        if (response.ok) {
          const latest: RewardCodeResponse = await response.json();
          if (controller.signal.aborted) return;
          if (latest.status === "redeemed") {
            setStatus("redeemed");
            window.clearInterval(interval);
            notifyRedeemed();
            return;
          }
          if (latest.status === "expired") {
            setStatus("expired");
            window.clearInterval(interval);
            return;
          }
        }
      } catch {
        // A momentary network interruption should not produce a success message.
      }
      if (!controller.signal.aborted && performance.now() < deadline + 5000) {
        poll = window.setTimeout(() => void check(codeValue), 4000);
      }
    }

    async function issue() {
      try {
        const response = await fetch(url, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rewardId }), signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const data: RewardCodeResponse = await response.json();
        if (controller.signal.aborted) return;
        setCode(data.code);
        setStatus(data.status);
        if (data.status === "redeemed") {
          notifyRedeemed();
        } else if (data.status === "active") {
          deadline = performance.now() + Date.parse(data.expiresAt) - Date.parse(data.now);
          tick();
          interval = window.setInterval(tick, 250);
          poll = window.setTimeout(() => void check(data.code), 2500);
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }

    void issue();
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.clearTimeout(poll);
    };
  }, [attempt, publicToken, rewardId]);

  function retry() {
    setCode(undefined);
    setStatus("loading");
    setAttempt(value => value + 1);
  }

  return { code, status, seconds, retry };
}

export default function QrCodeModal({
  businessType,
  cafeName,
  cafeSlug = "",
  pointsBalance,
  redeemReward,
  memberNumber,
  publicToken,
  logoUrl,
  showLogo,
  cafeInitial,
  cardBorder,
  cardBackground,
  textPrimary,
  textSecondary,
  textMuted,
  surfaceColor,
  primaryColor,
  primaryGlow,
  primarySoft,
  accentText,
  onClose,
  onStampDetected,
  onLogoError,
}: QrCodeModalProps) {
  const { t, lang, dir, arabic } = useBeLoyalLanguage();
  const isBarbershop = businessType === "BARBERSHOP";
  const normalizedCafeName = cafeName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isLoretto = businessType === "CAFE" && (cafeSlug.toLowerCase().includes("loretto") || normalizedCafeName.includes("loretto"));
  const baselineRef = useRef<{
    stamps: number;
    pointsBalance?: string;
    updatedAt: string;
  } | null>(null);

  const reward = useRewardCode(publicToken, redeemReward?.id, onStampDetected);
  const qrValue = redeemReward ? reward.status === "active" && reward.code ? rewardScanValue(reward.code) : null
    : loyaltyScanValue(publicToken);

  useEffect(() => {
    if (redeemReward) return;
    let stopped = false;
    let timeout: number | null = null;
    let requestInFlight = false;

    // The same shared modal is used by Kato, Keka, Loretto, and every other
    // business. Reset sync state whenever a different member token is shown.
    baselineRef.current = null;

    async function checkForStampUpdate() {
      if (requestInFlight || stopped) {
        return;
      }

      requestInFlight = true;

      try {
        const response = await fetch(
          `/api/customers/card/${encodeURIComponent(publicToken)}?qrSync=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as CardSyncResponse;

        if (stopped) {
          return;
        }

        if (
          typeof data.stamps !== "number" ||
          typeof data.updatedAt !== "string"
        ) {
          return;
        }

        if (pointsBalance !== undefined && typeof data.pointsBalance === "string" && data.pointsBalance !== pointsBalance) {
          stopped = true;
          onClose();
          onStampDetected();
          return;
        }

        if (!baselineRef.current) {
          baselineRef.current = {
            stamps: data.stamps,
            updatedAt: data.updatedAt,
          };
          return;
        }

        const stampChanged = data.stamps !== baselineRef.current.stamps;
        const customerUpdated = data.updatedAt !== baselineRef.current.updatedAt;

        if (stampChanged && customerUpdated) {
          stopped = true;
          onClose();
          onStampDetected();
        }
      } catch {
        // Keep the QR usable even if a background sync check fails.
      } finally {
        requestInFlight = false;
      }
    }

    function scheduleNextCheck() {
      if (stopped) {
        return;
      }

      timeout = window.setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await checkForStampUpdate();
        }

        scheduleNextCheck();
      }, QR_SYNC_INTERVAL_MS);
    }

    void checkForStampUpdate();
    scheduleNextCheck();

    return () => {
      stopped = true;

      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
    };
  }, [onClose, onStampDetected, pointsBalance, publicToken, redeemReward]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 px-3 py-4 min-[380px]:px-5 min-[380px]:py-8"
      style={{
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
        overscrollBehavior: "contain",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("Loyalty card QR code")} lang={lang} dir={dir}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[26px] border p-4 shadow-[0_30px_100px_rgba(0,0,0,0.55)] min-[380px]:rounded-[32px] min-[380px]:p-6"
        style={{
          borderColor: cardBorder,
          backgroundColor: cardBackground,
          color: textPrimary,
          forcedColorAdjust: "none",
          maxHeight: "calc(100dvh - 2rem)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: isLoretto ? "rgba(126,137,127,.11)" : primaryGlow }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close QR code")}
          className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border transition hover:opacity-75"
          style={{
            borderColor: cardBorder,
            backgroundColor: surfaceColor,
            color: textSecondary,
            touchAction: "manipulation",
          }}
        >
          <X size={18} />
        </button>

        <div className="relative text-center">
          {isLoretto ? (
            <div className="mx-auto inline-flex flex-col items-end" aria-label="LORETTO">
              <div className="flex items-baseline font-serif text-[2.4rem] font-bold uppercase leading-none tracking-[0.02em]" style={{ color: textPrimary }}>
                <span>L</span>
                <span>O</span>
                <span className="inline-block" style={{ transform: "scaleX(-1)" }} aria-hidden="true">R</span>
                <span>E</span>
                <span>T</span>
                <span>T</span>
                <span>O</span>
              </div>
              <p className="mt-1.5 text-[7px] font-semibold uppercase tracking-[0.27em]" style={{ color: textPrimary }}>
                Artisan coffee &amp; bakery
              </p>
            </div>
          ) : showLogo && logoUrl ? (
            <img
              src={logoUrl}
              alt={`${cafeName} logo`}
              className="mx-auto h-12 w-12 object-contain"
              referrerPolicy="no-referrer"
              onError={() => onLogoError(logoUrl)}
            />
          ) : (
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold"
              style={{
                backgroundColor: primarySoft,
                color: primaryColor,
              }}
            >
              {cafeInitial}
            </div>
          )}

          <p className="mt-4 text-lg font-semibold" style={{ color: textPrimary }}>
            {redeemReward?.name ?? t("Your loyalty code")}
          </p>

          <p className="mt-2 text-sm leading-6" style={{ color: textSecondary }}>
            {redeemReward ? (arabic ? "ورّي الكود للكاشير عشان يأكد استبدال المكافأة." : "Show this code to the cashier to confirm your reward.")
              : arabic
              ? isBarbershop ? "ورّي الكود للحلاق بعد الخدمة المؤهلة." : "ورّي الكود للكاشير بعد عملية شراء مؤهلة."
              : `Show this code to the ${isBarbershop ? "barber" : "cashier"} after an eligible ${isBarbershop ? "service" : "purchase"}.`}
          </p>

          {redeemReward && reward.status === "active" && <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: cardBorder, backgroundColor: surfaceColor }}>
            <Clock3 size={16} aria-hidden="true" />
            <span>{arabic ? "الكود صالح لمدة" : "Code expires in"}</span>
            <span dir="ltr" role="timer" className="tabular-nums">{Math.floor(reward.seconds / 60)}:{String(reward.seconds % 60).padStart(2, "0")}</span>
          </div>}
          {qrValue && <div
            className="mx-auto mt-5 max-w-full rounded-[20px] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] min-[380px]:mt-6 min-[380px]:rounded-[24px] min-[380px]:p-4"
            style={{
              width: "min(232px, calc(100vw - 56px))",
              backgroundColor: "#FFFFFF",
              colorScheme: "only light",
              forcedColorAdjust: "none",
              isolation: "isolate",
              filter: "none",
              opacity: 1,
              transform: "translateZ(0)",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <QRCode
              value={qrValue}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxWidth: "200px",
                margin: "0 auto",
                backgroundColor: "#FFFFFF",
                colorScheme: "only light",
                forcedColorAdjust: "none",
                shapeRendering: "crispEdges",
                filter: "none",
                opacity: 1,
              }}
            />
          </div>}
          {redeemReward && reward.status === "redeemed" && <div role="status" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: cardBorder, backgroundColor: surfaceColor }}>
            <CheckCircle2 size={20} aria-hidden="true" /> {arabic ? "تم استبدال المكافأة" : "Reward redeemed"}
          </div>}
          {redeemReward && reward.status === "loading" && <p role="status" className="mt-5 text-sm">{arabic ? "جارٍ تجهيز الكود…" : "Preparing your reward code…"}</p>}
          {redeemReward && (reward.status === "expired" || reward.status === "error") && <div className="mt-5 space-y-3">
            <p role="status" className="text-sm">{reward.status === "expired"
              ? (arabic ? "انتهت صلاحية الكود." : "This code expired.")
              : (arabic ? "تعذّر تجهيز الكود. حاول مرة تانية." : "Could not prepare the code. Try again.")}</p>
            <button type="button" onClick={reward.retry} className="min-h-11 rounded-xl border px-4 text-sm font-semibold" style={{ borderColor: cardBorder, backgroundColor: surfaceColor }}>
              {arabic ? "اعرض كود جديد" : "Get a fresh code"}
            </button>
          </div>}

          {(!redeemReward || reward.status === "active") && <p className="mt-3 text-xs" style={{ color: textMuted }}>
            {redeemReward
              ? (arabic ? "يتأكد الاستبدال بعد ما الكاشير يسجّله." : "Your reward is confirmed when the cashier completes checkout.")
              : t("Your card updates automatically after the scan.")}
          </p>}

          <div
            className="mt-5 rounded-2xl border px-4 py-3"
            style={{
              borderColor: cardBorder,
              backgroundColor: surfaceColor,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: textMuted }}
            >
              Member number
            </p>

            <p
              className="mt-1 text-sm font-semibold tracking-[0.08em]"
              style={{ color: textPrimary }}
            >
              {memberNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold transition hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: primaryColor,
              color: accentText,
              touchAction: "manipulation",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
