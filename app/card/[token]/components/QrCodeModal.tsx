"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import QRCode from "react-qr-code";

type QrCodeModalProps = {
  businessType: "CAFE" | "BARBERSHOP";
  cafeName: string;
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
  onLogoError: (logoUrl: string) => void;
};

type CardSyncResponse = {
  stamps?: number;
  updatedAt?: string;
};

const QR_SYNC_INTERVAL_MS = 2000;

export default function QrCodeModal({
  businessType,
  cafeName,
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
  onLogoError,
}: QrCodeModalProps) {
  const isBarbershop = businessType === "BARBERSHOP";
  const baselineRef = useRef<{
    stamps: number;
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    let stopped = false;
    let timeout: number | null = null;
    let requestInFlight = false;

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

        if (
          typeof data.stamps !== "number" ||
          typeof data.updatedAt !== "string"
        ) {
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

          window.setTimeout(() => {
            window.location.reload();
          }, 80);
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
  }, [onClose, publicToken]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-md min-[380px]:px-5 min-[380px]:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Loyalty card QR code"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[24px] border p-4 shadow-[0_30px_100px_rgba(0,0,0,0.55)] min-[380px]:rounded-[30px] min-[380px]:p-6"
        style={{
          borderColor: cardBorder,
          backgroundColor: cardBackground,
          color: textPrimary,
          forcedColorAdjust: "none",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: primaryGlow }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close QR code"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border transition hover:opacity-75"
          style={{
            borderColor: cardBorder,
            backgroundColor: surfaceColor,
            color: textSecondary,
          }}
        >
          <X size={18} />
        </button>

        <div className="relative text-center">
          {showLogo && logoUrl ? (
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
            Your loyalty code
          </p>

          <p className="mt-2 text-sm leading-6" style={{ color: textSecondary }}>
            Show this code to the {isBarbershop ? "barber" : "cashier"}{" "}
            after an eligible {isBarbershop ? "service" : "purchase"}.
          </p>

          <div
            className="mx-auto mt-5 w-fit max-w-full rounded-[20px] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] min-[380px]:mt-6 min-[380px]:rounded-[24px] min-[380px]:p-4"
            style={{
              backgroundColor: "#FFFFFF",
              colorScheme: "light",
              forcedColorAdjust: "none",
              isolation: "isolate",
              filter: "none",
              opacity: 1,
            }}
          >
            <QRCode
              value={`BL:${publicToken}`}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxWidth: "200px",
                backgroundColor: "#FFFFFF",
                colorScheme: "light",
                forcedColorAdjust: "none",
                filter: "none",
                opacity: 1,
              }}
            />
          </div>

          <p className="mt-3 text-xs" style={{ color: textMuted }}>
            Your card updates automatically after the scan.
          </p>

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
            className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold transition hover:opacity-90 active:scale-[0.99]"
            style={{
              backgroundColor: primaryColor,
              color: accentText,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
