"use client";

import {
  LoaderCircle,
  MessageCircle,
  Star,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type RatingRow = {
  id: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    memberNumber: string;
  };
};

type CommentRow = {
  id: string;
  comment: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    memberNumber: string;
  };
};

type FeedbackData = {
  summary: {
    averageRating: number | null;
    ratingCount: number;
    commentCount: number;
  };
  ratings: RatingRow[];
  comments: CommentRow[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AdminFeedbackPanel() {
  const { theme } = useCafeTheme();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] =
    useState<"RATINGS" | "COMMENTS">("RATINGS");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/feedback", {
        cache: "no-store",
      });

      const body = (await response.json()) as
        | FeedbackData
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in body && body.message
            ? body.message
            : "Failed to load customer feedback.",
        );
      }

      setData(body as FeedbackData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load customer feedback.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className="rounded-[26px] border p-5 sm:p-6"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        boxShadow: theme.cardShadow,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.accent }}
          >
            Customer feedback
          </p>
          <h3
            className="mt-2 text-lg font-semibold"
            style={{ color: theme.textPrimary }}
          >
            Ratings & comments
          </h3>
          <p
            className="mt-1 text-xs"
            style={{ color: theme.textMuted }}
          >
            Visible to café administrators only.
          </p>
        </div>

        {data && (
          <div className="flex gap-3">
            <div
              className="rounded-[16px] border px-4 py-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
              }}
            >
              <div className="flex items-center gap-2">
                <Star size={15} style={{ color: theme.accent }} />
                <span
                  className="text-lg font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  {data.summary.averageRating === null
                    ? "—"
                    : data.summary.averageRating.toFixed(1)}
                </span>
              </div>
              <p
                className="mt-1 text-[10px]"
                style={{ color: theme.textMuted }}
              >
                {data.summary.ratingCount} ratings
              </p>
            </div>

            <div
              className="rounded-[16px] border px-4 py-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
              }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={15} style={{ color: theme.accent }} />
                <span
                  className="text-lg font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  {data.summary.commentCount}
                </span>
              </div>
              <p
                className="mt-1 text-[10px]"
                style={{ color: theme.textMuted }}
              >
                comments
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center">
          <LoaderCircle
            size={22}
            className="animate-spin"
            style={{ color: theme.accent }}
          />
        </div>
      ) : error ? (
        <p
          className="mt-5 text-sm"
          style={{ color: theme.danger }}
        >
          {error}
        </p>
      ) : data ? (
        <div className="mt-5">
          <div
            className="inline-flex rounded-[16px] border p-1"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("RATINGS")}
              className="rounded-[12px] px-4 py-2 text-xs font-semibold transition"
              style={{
                backgroundColor:
                  activeTab === "RATINGS"
                    ? theme.accent
                    : "transparent",
                color:
                  activeTab === "RATINGS"
                    ? theme.buttonText
                    : theme.textSecondary,
              }}
            >
              Ratings ({data.summary.ratingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("COMMENTS")}
              className="rounded-[12px] px-4 py-2 text-xs font-semibold transition"
              style={{
                backgroundColor:
                  activeTab === "COMMENTS"
                    ? theme.accent
                    : "transparent",
                color:
                  activeTab === "COMMENTS"
                    ? theme.buttonText
                    : theme.textSecondary,
              }}
            >
              Comments ({data.summary.commentCount})
            </button>
          </div>

          <div
            className="mt-4 overflow-hidden rounded-[20px] border"
            style={{ borderColor: theme.border }}
          >
            {activeTab === "RATINGS" ? (
              <div className="max-h-[360px] overflow-y-auto">
                {data.ratings.length === 0 ? (
                  <p
                    className="p-5 text-sm"
                    style={{ color: theme.textMuted }}
                  >
                    No ratings yet.
                  </p>
                ) : (
                  data.ratings.map((row) => (
                    <div
                      key={row.id}
                      className="border-b px-4 py-3 last:border-b-0"
                      style={{ borderColor: theme.border }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {row.customer.name}
                          </p>
                          <p
                            className="mt-0.5 text-[10px]"
                            style={{ color: theme.textMuted }}
                          >
                            {row.customer.memberNumber}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={13}
                              fill={
                                index < row.rating
                                  ? "currentColor"
                                  : "none"
                              }
                              style={{
                                color:
                                  index < row.rating
                                    ? theme.accent
                                    : theme.textMuted,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <p
                        className="mt-2 text-[10px]"
                        style={{ color: theme.textMuted }}
                      >
                        {formatDate(row.updatedAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto">
                {data.comments.length === 0 ? (
                  <p
                    className="p-5 text-sm"
                    style={{ color: theme.textMuted }}
                  >
                    No written feedback yet.
                  </p>
                ) : (
                  data.comments.map((row) => (
                    <div
                      key={row.id}
                      className="border-b px-4 py-3 last:border-b-0"
                      style={{ borderColor: theme.border }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {row.customer.name}
                          </p>
                          <p
                            className="mt-0.5 text-[10px]"
                            style={{ color: theme.textMuted }}
                          >
                            {row.customer.memberNumber}
                          </p>
                        </div>

                        <span
                          className="text-[10px]"
                          style={{ color: theme.textMuted }}
                        >
                          {formatDate(row.createdAt)}
                        </span>
                      </div>

                      <p
                        className="mt-2 text-sm leading-6"
                        style={{ color: theme.textSecondary }}
                      >
                        {row.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
