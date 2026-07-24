"use client";

import { useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";
import { toPng } from "html-to-image";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

const POSTER_WIDTH = 420;
const POSTER_HEIGHT = 720;

export default function JoinQRCode() {
  const { theme, cafe } = useCafeTheme();

  const posterRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const joinUrl = useMemo(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://getbeloyal.app";

    return `${baseUrl}/join/${cafe.slug}`;
  }, [cafe.slug]);

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

  async function waitForImages(element: HTMLElement) {
    const images = Array.from(
      element.querySelectorAll("img")
    );

    await Promise.all(
      images.map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      })
    );
  }

  async function downloadPoster() {
    if (!posterRef.current) {
      return;
    }

    setDownloading(true);

    try {
      const poster = posterRef.current;

      await waitForImages(poster);

      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const image = await toPng(poster, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        canvasWidth: POSTER_WIDTH * 3,
        canvasHeight: POSTER_HEIGHT * 3,
        style: {
          width: `${POSTER_WIDTH}px`,
          height: `${POSTER_HEIGHT}px`,
          maxWidth: "none",
          minWidth: `${POSTER_WIDTH}px`,
          minHeight: `${POSTER_HEIGHT}px`,
          margin: "0",
          transform: "none",
        },
      });

      const link = document.createElement("a");

      link.download = `${cafe.slug}-loyalty-qr.png`;
      link.href = image;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(
        "Could not download QR poster:",
        error
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      className="overflow-hidden border"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        borderRadius: theme.radiusMedium,
      }}
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_500px]">
        <div className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <p
              className="text-sm font-medium"
              style={{
                color: theme.accent,
              }}
            >
              Customer join QR
            </p>

            <h3
              className="mt-2 text-2xl font-semibold tracking-tight"
              style={{
                color: theme.textPrimary,
              }}
            >
              Let customers join in seconds
            </h3>

            <p
              className="mt-3 max-w-xl text-sm leading-6"
              style={{
                color: theme.textMuted,
              }}
            >
              Download this branded QR poster, print it,
              and place it near the cashier. Customers can
              scan it to create their loyalty card.
            </p>
          </div>

          <div className="mt-7">
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
                    Customer join link
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
                  aria-label="Open customer join page"
                  className="flex h-10 w-10 shrink-0 items-center justify-center border transition hover:opacity-80"
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copyJoinLink}
                className="flex h-11 items-center justify-center gap-2 border px-4 text-sm font-medium transition hover:opacity-80"
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

                {copied ? "Link copied" : "Copy link"}
              </button>

              <button
                type="button"
                onClick={downloadPoster}
                disabled={downloading}
                className="flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.accentText,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Download size={17} />

                {downloading
                  ? "Preparing poster..."
                  : "Download PNG"}
              </button>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto border-t p-5 sm:p-7 lg:border-l lg:border-t-0"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.pageBackground,
          }}
        >
          <div className="mx-auto w-fit">
            <div
              ref={posterRef}
              className="flex shrink-0 flex-col bg-white text-center"
              style={{
                width: `${POSTER_WIDTH}px`,
                height: `${POSTER_HEIGHT}px`,
                minWidth: `${POSTER_WIDTH}px`,
                minHeight: `${POSTER_HEIGHT}px`,
                padding: "44px 42px 34px",
                color: "#111111",
                borderRadius: "28px",
                boxShadow:
                  "0 24px 70px rgba(0, 0, 0, 0.14)",
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
                {cafe.logoUrl ? (
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
                        src={cafe.logoUrl}
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
                    margin: cafe.logoUrl
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
                  Let coffee connect us
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
                    Collect stamps.
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
                    Earn free drinks.
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
                      color: "#8a8a8a",
                      fontSize: "9px",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Powered by
                  </p>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#111111",
                      fontSize: "14px",
                      fontWeight: 700,
                      lineHeight: 1.4,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    BeLoyal Studio
                  </p>

                  <p
                    style={{
                      margin: "3px 0 0",
                      color: "#737373",
                      fontSize: "10px",
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    getbeloyal.app
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}