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

export default function JoinQRCode() {
  const { theme, cafe } = useCafeTheme();

  const posterRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/join/${cafe.slug}`;
    }

    return `${window.location.origin}/join/${cafe.slug}`;
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

  async function downloadPoster() {
    if (!posterRef.current) {
      return;
    }

    setDownloading(true);

    try {
      const poster = posterRef.current;

      const image = await toPng(poster, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: theme.pageBackground,
        width: poster.scrollWidth,
        height: poster.scrollHeight,
        style: {
          width: `${poster.scrollWidth}px`,
          height: `${poster.scrollHeight}px`,
        },
      });

      const link = document.createElement("a");

      link.download = `${cafe.slug}-loyalty-qr.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Could not download QR poster:", error);
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
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
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
              Download this branded QR poster, print it, and place it near the
              cashier. Customers can scan it to create their loyalty card.
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
                {copied ? <Check size={17} /> : <Copy size={17} />}

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

                {downloading ? "Preparing poster..." : "Download PNG"}
              </button>
            </div>
          </div>
        </div>

        <div
          className="border-t p-5 sm:p-7 lg:border-l lg:border-t-0"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.pageBackground,
          }}
        >
          <div
            ref={posterRef}
            className="mx-auto flex min-h-[680px] w-full max-w-[340px] flex-col items-center justify-between px-7 py-8 text-center"
            style={{
              background: `
                radial-gradient(
                  circle at top,
                  ${theme.accent}35 0%,
                  transparent 42%
                ),
                ${theme.pageBackground}
              `,
              color: theme.textPrimary,
              borderRadius: "28px",
              boxShadow: `0 22px 60px ${theme.accent}20`,
            }}
          >
            <div className="flex flex-col items-center">
              {cafe.logoUrl ? (
                <img
                  src={cafe.logoUrl}
                  alt={`${cafe.name} logo`}
                  crossOrigin="anonymous"
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-[24px] text-3xl font-bold"
                  style={{
                    background: `linear-gradient(
                      135deg,
                      ${theme.accent},
                      ${theme.accentSoft}
                    )`,
                    color: theme.accentText,
                    boxShadow: `0 14px 32px ${theme.accent}35`,
                  }}
                >
                  {cafe.name.charAt(0).toUpperCase()}
                </div>
              )}

              <h4
                className="mt-5 max-w-[260px] text-2xl font-semibold tracking-tight"
                style={{
                  color: theme.textPrimary,
                }}
              >
                {cafe.name}
              </h4>

              <p
                className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: theme.accent,
                }}
              >
                Join our loyalty club
              </p>
            </div>

            <div
              className="my-6 rounded-[24px] bg-white p-5"
              style={{
                boxShadow: "0 18px 45px rgba(0, 0, 0, 0.24)",
              }}
            >
              <QRCode
                value={joinUrl}
                size={178}
                bgColor="#FFFFFF"
                fgColor="#111111"
                level="H"
              />
            </div>

            <div>
              <p
                className="text-base font-semibold"
                style={{
                  color: theme.textPrimary,
                }}
              >
                Scan to join in seconds
              </p>

              <p
                className="mt-2 text-sm"
                style={{
                  color: theme.textMuted,
                }}
              >
                Collect stamps automatically
              </p>

              <div
                className="mx-auto my-5 h-px w-44"
                style={{
                  backgroundColor: `${theme.accent}45`,
                }}
              />

              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{
                  color: theme.textMuted,
                }}
              >
                Powered by
              </p>

              <p
                className="mt-1 text-sm font-semibold tracking-wide"
                style={{
                  color: theme.textPrimary,
                }}
              >
                BeLoyal Studio
              </p>

              <p
                className="mt-1 text-[10px]"
                style={{
                  color: theme.textMuted,
                }}
              >
                beloyalstudio.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}