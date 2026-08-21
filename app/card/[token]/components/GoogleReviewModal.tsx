"use client";

import { Star } from "lucide-react";

type GoogleReviewModalProps = {
  businessType: "CAFE" | "BARBERSHOP";
  selectedRating: number | null;
  googleReviewUrl: string | null;
  cardBorder: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surfaceColor: string;
  primaryColor: string;
  accentText: string;
  onClose: () => void;
  onOpenGoogleReview: () => void;
};

export default function GoogleReviewModal({
  businessType,
  selectedRating,
  googleReviewUrl,
  cardBorder,
  cardBackground,
  textPrimary,
  textSecondary,
  textMuted,
  surfaceColor,
  primaryColor,
  accentText,
  onClose,
  onOpenGoogleReview,
}: GoogleReviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Google review"
    >
      <div
        className="w-full max-w-sm rounded-[30px] border p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        style={{
          borderColor: cardBorder,
          backgroundColor: cardBackground,
          color: textPrimary,
        }}
      >
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Star
              key={rating}
              size={24}
              style={{
                color:
                  rating <= (selectedRating ?? 0) ? "#FBBF24" : textMuted,
                fill:
                  rating <= (selectedRating ?? 0)
                    ? "#FBBF24"
                    : "transparent",
              }}
            />
          ))}
        </div>

        <p className="mt-5 text-2xl font-semibold">
          Thanks for your feedback
        </p>

        <p className="mt-2 text-sm leading-6" style={{ color: textSecondary }}>
          Would you like to share your experience on Google?
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl border text-sm font-semibold transition hover:opacity-80"
            style={{
              borderColor: cardBorder,
              backgroundColor: surfaceColor,
              color: textSecondary,
            }}
          >
            Not now
          </button>

          <button
            type="button"
            onClick={onOpenGoogleReview}
            disabled={!googleReviewUrl}
            className="h-12 rounded-2xl text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              backgroundColor: primaryColor,
              color: accentText,
            }}
          >
            Review on Google
          </button>
        </div>

        {!googleReviewUrl ? (
          <p className="mt-4 text-xs" style={{ color: textMuted }}>
            This {businessType === "BARBERSHOP"
              ? "barbershop"
              : "café"} has not added a Google review link yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
