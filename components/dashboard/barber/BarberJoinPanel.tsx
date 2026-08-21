"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  ExternalLink,
  QrCode,
} from "lucide-react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function BarberJoinPanel() {
  const { cafe, theme } = useCafeTheme();
  const [copied, setCopied] = useState(false);

  const joinUrl = useMemo(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://getbeloyal.app";

    return `${baseUrl}/join/${cafe.slug}`;
  }, [cafe.slug]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Could not copy join link:", error);
    }
  }

  return (
    <section
      className="overflow-hidden rounded-[26px] border"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        boxShadow: theme.cardShadow,
      }}
    >
      <div className="grid lg:grid-cols-[1fr_230px]">
        <div className="p-5 sm:p-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: theme.accentSoft,
              color: theme.accent,
            }}
          >
            <QrCode size={18} />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">
            Grow your client list
          </h2>
          <p
            className="mt-2 max-w-lg text-sm leading-6"
            style={{ color: theme.textMuted }}
          >
            Let clients scan this code to create their barber
            loyalty card before or after their cut.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyLink}
              className="flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
              style={{
                backgroundColor: theme.accent,
                color: theme.buttonText,
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy join link"}
            </button>
            <Link
              href={joinUrl}
              target="_blank"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium"
              style={{
                borderColor: theme.border,
                color: theme.textSecondary,
              }}
            >
              <ExternalLink size={16} />
              Open join page
            </Link>
          </div>
        </div>

        <div
          className="flex items-center justify-center border-t bg-white p-6 lg:border-l lg:border-t-0"
          style={{ borderColor: theme.border }}
        >
          <div className="rounded-2xl border border-black/10 bg-white p-3">
            <QRCode
              value={joinUrl}
              size={150}
              bgColor="#FFFFFF"
              fgColor="#111111"
              level="H"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
