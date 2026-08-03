"use client";

import { LoaderCircle, Star } from "lucide-react";

type RatingModalProps = {
  cafeName: string;
  selectedRating: number | null;
  hoveredRating: number | null;
  reviewSubmitting: boolean;
  reviewError: string;
  cardBorder: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surfaceColor: string;
  reviewErrorBorderColor: string;
  reviewErrorBackgroundColor: string;
  reviewErrorTextColor: string;
  onHoveredRatingChange: (rating: number | null) => void;
  onRatingSelect: (rating: number) => void;
  onClose: () => void;
};

export default function RatingModal({
  cafeName,
  selectedRating,
  hoveredRating,
  reviewSubmitting,
  reviewError,
  cardBorder,
  cardBackground,
  textPrimary,
  textSecondary,
  textMuted,
  surfaceColor,
  reviewErrorBorderColor,
  reviewErrorBackgroundColor,
  reviewErrorTextColor,
  onHoveredRatingChange,
  onRatingSelect,
  onClose,
}: RatingModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Rate your visit"
    >
      <div
        className="w-full max-w-sm rounded-[30px] border p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        style={{
          borderColor: cardBorder,
          backgroundColor: cardBackground,
          color: textPrimary,
        }}
      >
        <p className="text-2xl font-semibold">How was your visit?</p>
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: textSecondary }}
        >
          Tap a star to share quick feedback with {cafeName}.
        </p>

        <div
          className="mt-7 flex items-center justify-center gap-2"
          onMouseLeave={() => onHoveredRatingChange(null)}
        >
          {[1, 2, 3, 4, 5].map((rating) => {
            const active = rating <= (hoveredRating ?? selectedRating ?? 0);

            return (
              <button
                key={rating}
                type="button"
                disabled={reviewSubmitting}
                onMouseEnter={() => onHoveredRatingChange(rating)}
                onFocus={() => onHoveredRatingChange(rating)}
                onBlur={() => onHoveredRatingChange(null)}
                onClick={() => onRatingSelect(rating)}
                aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                className="rounded-full p-1 transition hover:scale-110 active:scale-95 disabled:cursor-wait disabled:opacity-60"
              >
                <Star
                  size={38}
                  strokeWidth={1.8}
                  style={{
                    color: active ? "#FBBF24" : textMuted,
                    fill: active ? "#FBBF24" : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        {reviewSubmitting ? (
          <div
            className="mt-5 flex items-center justify-center gap-2 text-sm"
            role="status"
            style={{ color: textSecondary }}
          >
            <LoaderCircle size={16} className="animate-spin" />
            Saving your rating...
          </div>
        ) : null}

        {reviewError ? (
          <p
            className="mt-5 rounded-2xl border px-4 py-3 text-sm leading-5"
            role="alert"
            style={{
              borderColor: reviewErrorBorderColor,
              backgroundColor: reviewErrorBackgroundColor,
              color: reviewErrorTextColor,
            }}
          >
            {reviewError}
          </p>
        ) : null}

        <button
          type="button"
          disabled={reviewSubmitting}
          onClick={onClose}
          className="mt-7 h-11 w-full rounded-2xl border text-sm font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-50"
          style={{
            borderColor: cardBorder,
            backgroundColor: surfaceColor,
            color: textSecondary,
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
