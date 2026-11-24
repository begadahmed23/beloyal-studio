"use client";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";

import { isMbVape, MB_VAPE_LOGO_URL } from "@/lib/business/mb-vape";
import { isGourmeal } from "@/lib/business/gourmeal";
import { fireyNashBrand } from "@/lib/business/points";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import { exportJoinPoster, POSTER_HEIGHT, POSTER_WIDTH } from "./export-join-poster";
import { JOIN_POSTER_CREDIT } from "./join-poster-credit";

export default function JoinQRCode({ location }: { location?: { id: string; name: string } }) {
  const { t } = useBeLoyalLanguage();
  const { theme, cafe } = useCafeTheme();
  const mbVape = isMbVape(cafe);
  const gourmeal = isGourmeal(cafe);
  const firey = cafe.slug === fireyNashBrand.slug;
  const brand = firey ? "firey-nash" : gourmeal ? "gourmeal" : mbVape ? "mb-vape" : undefined;
  const logoUrl = cafe.logoUrl;
  const isBarbershop = cafe.businessType === "BARBERSHOP";

  const tagline = location?.name ?? (firey ? "كارت العضوية" : gourmeal ? "Loyalty card" : isBarbershop ? "Sharp style. Loyal clients." : cafe.businessType === "CAFE" ? "Let coffee connect us" : "Member rewards");
  const points = cafe.loyaltyMode === "POINTS";
  const progress = firey ? "" : points ? "Join the rewards program." : gourmeal ? `Collect ${getLoyaltyProgressTarget(cafe)} stamps.` : `Collect ${isBarbershop ? "visits" : "stamps"}.`;
  const rewardName = cafe.rewardName?.trim() || "a reward";
  const reward = points ? "" : gourmeal && rewardName.toLowerCase() === "free drink"
    ? "Get a free drink."
    : mbVape ? `Earn ${/[.!?]$/.test(rewardName) ? rewardName : rewardName + "."}` : `Earn ${rewardName.toLowerCase()}.`;
  const filename = gourmeal
    ? `Gourmeal-${tagline.replace(/[^\p{L}\p{N}]+/gu, "-")}-QR.png`
    : `${cafe.slug}${location ? `-${location.id}` : ""}-${isBarbershop ? "barber" : "loyalty"}-qr.png`;

  const previewRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0);
  const [brandedPreview, setBrandedPreview] = useState<{ key: string; url: string | null } | null>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || brand) return;

    const observer = new ResizeObserver(([entry]) => {
      setPreviewScale(entry.contentRect.width / POSTER_WIDTH);
    });
    observer.observe(preview);

    return () => observer.disconnect();
  }, [brand]);

  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const joinUrl = useMemo(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://getbeloyal.app";

    const url = new URL(`/join/${encodeURIComponent(cafe.slug)}`, baseUrl);
    if (location) url.searchParams.set("location", location.id);
    return url.toString();
  }, [cafe.slug, location]);

  const posterKey = JSON.stringify([joinUrl, cafe.name, tagline, progress, reward]);
  const currentPreview = brandedPreview?.key === posterKey ? brandedPreview : null;
  const brandedPosterUrl = currentPreview?.url;
  const saveUrl = brand ? brandedPosterUrl : downloadUrl;

  useEffect(() => {
    const source = posterRef.current;
    if (!brand || !source) return;
    let active = true;
    let url: string | undefined;
    void exportJoinPoster(source, cafe.name, tagline, progress, reward, brand).then((blob) => {
      if (!active) return;
      url = URL.createObjectURL(blob);
      setBrandedPreview({ key: posterKey, url });
    }).catch((error) => {
      if (!active) return;
      console.error("Could not prepare the branded QR poster:", error);
      setBrandedPreview({ key: posterKey, url: null });
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [brand, posterKey, cafe.name, tagline, progress, reward]);

  async function copyJoinLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Could not copy join link:", error);
    }
  }

  async function downloadPoster() {
    if (!posterRef.current) return;

    setDownloading(true);
    setDownloadMessage(null);
    try {
      let url = brandedPosterUrl;
      if (!brand) {
        const blob = await exportJoinPoster(posterRef.current, cafe.name, tagline, progress, reward);
        url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      }
      if (!url) throw new Error("The poster is still loading.");
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadMessage({ type: "success", text: "QR poster ready." });
    } catch (error) {
      console.error("Could not download QR poster:", error);
      setDownloadMessage({ type: "error", text: "The QR poster could not be downloaded. Please try again." });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      className="min-w-0 overflow-hidden border"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        borderRadius: theme.radiusMedium,
      }}
    >
      <div className="grid lg:grid-cols-2">
        <div className="flex min-w-0 flex-col justify-between p-4 sm:p-8">
          <div>
            <p
              className="text-sm font-medium"
              style={{
                color: theme.accent,
              }}
            >
              {location?.name ?? (isBarbershop ? "Client join QR" : "Customer join QR")}
            </p>

            <h3
              className="mt-2 text-2xl font-semibold tracking-tight"
              style={{
                color: theme.textPrimary,
              }}
            >
              Let {isBarbershop ? "clients" : "customers"} join in seconds
            </h3>

            <p
              className="mt-3 max-w-xl text-sm leading-6"
              style={{
                color: theme.textMuted,
              }}
            >
              Share the join link or download the poster to print.
              {isBarbershop ? " Clients" : " Customers"} can scan the code to create their loyalty card.
            </p>
          </div>

          <div className="mt-5 sm:mt-7">
            <div
              className="overflow-hidden border"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-medium uppercase tracking-[0.16em]"
                    style={{
                      color: theme.textMuted,
                    }}
                  >
                    {isBarbershop ? "Client join link" : "Customer join link"}
                  </p>

                  <p
                    className="mt-1 truncate text-sm"
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    {joinUrl}
                  </p>
                </div>

                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${
                    isBarbershop ? "client" : "customer"
                  } join page`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center border transition hover:opacity-80"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.textSecondary,
                    borderRadius: theme.radiusMedium,
                  }}
                >
                  <ExternalLink size={17} />
                </a>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
              <button
                type="button"
                onClick={copyJoinLink}
                className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 border px-2 text-sm font-medium transition hover:opacity-80"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceRaised,
                  color: theme.textPrimary,
                  borderRadius: theme.radiusMedium,
                }}
              >
                {copied ? (
                  <Check size={17} />
                ) : (
                  <Copy size={17} />
                )}

                {copied ? "Link copied" : t("Copy link")}
              </button>

              <button
                type="button"
                onClick={downloadPoster}
                disabled={downloading || Boolean(brand && !brandedPosterUrl)}
                className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 px-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.accentText,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Download size={17} />

                {downloading
                  ? "Preparing…"
                  : "Download PNG"}
              </button>
            </div>

            {downloadMessage ? (
              <div
                role="status"
                aria-live="polite"
                className="mt-3 flex items-start gap-2 text-sm font-medium"
                style={{
                  color:
                    downloadMessage.type === "success"
                      ? "#16a34a"
                      : "#dc2626",
                }}
              >
                {downloadMessage.type === "success" ? (
                  <Check className="mt-0.5 shrink-0" size={17} />
                ) : null}

                <span>
                  {downloadMessage.text}
                  {downloadMessage.type === "success" && saveUrl && (
                    <> <a className="underline" href={saveUrl} download={filename}>Save PNG</a></>
                  )}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="min-w-0 border-t p-3 sm:p-7 lg:border-l lg:border-t-0"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.pageBackground,
          }}
        >
          <div
            ref={previewRef}
            className="relative mx-auto w-full overflow-hidden rounded-[18px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] sm:rounded-[28px]"
            style={{ maxWidth: POSTER_WIDTH, aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
          >
            {brand ? (
              <>
                <div ref={posterRef} className="sr-only" aria-hidden="true">
                  {(mbVape || firey) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firey ? fireyNashBrand.wordmark : MB_VAPE_LOGO_URL} alt="" />
                  )}
                  <QRCode value={joinUrl} size={210} level="H" />
                </div>
                {brandedPosterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandedPosterUrl} alt={`${cafe.name} loyalty signup poster. ${progress} ${reward} ${JOIN_POSTER_CREDIT.title} ${JOIN_POSTER_CREDIT.domain}.`} className="block h-full w-full" />
                ) : (
                  <p role="status" className="grid h-full place-items-center px-5 text-center text-sm text-[#432B1D]">
                    {currentPreview ? "The QR poster could not load. Refresh to try again." : "Preparing QR poster…"}
                  </p>
                )}
              </>
            ) : (
            <div
              ref={posterRef}
              className="absolute top-0 left-0 flex origin-top-left flex-col bg-white text-center"
              style={{
                width: `${POSTER_WIDTH}px`,
                height: `${POSTER_HEIGHT}px`,
                transform: `scale(${previewScale})`,
                visibility: previewScale ? undefined : "hidden",
                padding: "44px 42px 34px",
                color: "#111111",
                fontFamily:
                  "Inter, Arial, Helvetica, sans-serif",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {logoUrl ? (
                  <>
                    <div
                      style={{
                        width: "96px",
                        height: "96px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={logoUrl}
                        alt={`${cafe.name} logo`}
                        crossOrigin="anonymous"
                        style={{
                          display: "block",
                          width: "96px",
                          height: "96px",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    <h4
                      style={{
                        maxWidth: "310px",
                        margin: "18px 0 0",
                        color: "#111111",
                        fontSize: "26px",
                        fontWeight: 650,
                        lineHeight: 1.15,
                        letterSpacing: "-0.025em",
                        overflowWrap: "break-word",
                      }}
                    >
                      {cafe.name}
                    </h4>
                  </>
                ) : (
                  <div
                    style={{
                      maxWidth: "320px",
                      minHeight: "96px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px 18px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#111111",
                        fontSize: "30px",
                        fontWeight: 750,
                        lineHeight: 1.15,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        overflowWrap: "break-word",
                      }}
                    >
                      {cafe.name}
                    </p>
                  </div>
                )}

                <p
                  style={{
                    margin: logoUrl
                      ? "9px 0 0"
                      : "4px 0 0",
                    color: "#737373",
                    fontSize: "11px",
                    fontWeight: 600,
                    lineHeight: 1.4,
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                  }}
                >
                  {tagline}
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 0,
                  paddingTop: "20px",
                  paddingBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    padding: "18px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "24px",
                    boxShadow:
                      "0 14px 36px rgba(0, 0, 0, 0.10)",
                  }}
                >
                  <QRCode
                    value={joinUrl}
                    size={210}
                    title="Loyalty signup QR code"
                    bgColor="#FFFFFF"
                    fgColor="#111111"
                    level="H"
                  />
                </div>

                <div
                  style={{
                    marginTop: "22px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#111111",
                      fontSize: "22px",
                      fontWeight: 700,
                      lineHeight: 1.18,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {progress}
                  </p>

                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "#111111",
                      fontSize: "22px",
                      fontWeight: 700,
                      lineHeight: 1.18,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {reward}
                  </p>

                  <p
                    style={{
                      margin: "11px 0 0",
                      color: "#737373",
                      fontSize: "13px",
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    Scan the QR code to join.
                  </p>
                </div>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "#e5e5e5",
                  }}
                />

                <div
                  style={{
                    paddingTop: "17px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#111111",
                      fontSize: JOIN_POSTER_CREDIT.titleSize,
                      fontWeight: JOIN_POSTER_CREDIT.titleWeight,
                      lineHeight: 1.25,
                    }}
                  >
                    {JOIN_POSTER_CREDIT.title}
                  </p>

                  <p
                    style={{
                      margin: "2px 0 0",
                      color: "#737373",
                      fontSize: JOIN_POSTER_CREDIT.domainSize,
                      fontWeight: JOIN_POSTER_CREDIT.domainWeight,
                      lineHeight: 1.4,
                    }}
                  >
                    {JOIN_POSTER_CREDIT.domain}
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
