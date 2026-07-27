"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Gift,
  LoaderCircle,
  Palette,
  Save,
  ShieldCheck,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type CafeTheme =
  | "COFFEE_CLASSIC"
  | "MODERN_MINIMAL"
  | "DARK_LUXURY"
  | "MEDITERRANEAN_BLUE"
  | "ORGANIC";

type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED";

type Cafe = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;

  theme: CafeTheme;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;

  minimumPurchaseAmount: number | null;
  eligiblePurchaseDescription: string | null;

  googleReviewUrl: string | null;

  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  lastPaymentAt: string | null;

  monthlyPrice: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  user: {
    id: string;
    name: string;
    email: string;
  } | null;

  _count: {
    customers: number;
    transactions: number;
    reviews: number;
  };

  reviews: {
    id: string;
    rating: number;
    createdAt: string;
    updatedAt: string;
    customer: {
      id: string;
      name: string;
      memberNumber: string;
    };
  }[];

  reviewSummary: {
    averageRating: number;
    totalRatings: number;
    breakdown: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
};

const themes: {
  value: CafeTheme;
  label: string;
}[] = [
  {
    value: "COFFEE_CLASSIC",
    label: "Coffee Classic",
  },
  {
    value: "MODERN_MINIMAL",
    label: "Modern Minimal",
  },
  {
    value: "DARK_LUXURY",
    label: "Dark Luxury",
  },
  {
    value: "MEDITERRANEAN_BLUE",
    label: "Mediterranean Blue",
  },
  {
    value: "ORGANIC",
    label: "Organic",
  },
];

const subscriptionStatuses: {
  value: SubscriptionStatus;
  label: string;
}[] = [
  {
    value: "TRIAL",
    label: "Trial",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "PAST_DUE",
    label: "Past due",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

function dateToInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function formatDate(value: string | null) {
  if (!value) return "—";

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      response.status === 404
        ? "The café API route was not found. Restart the development server and try again."
        : `The server returned an unexpected response (${response.status}).`
    );
  }

  return response.json();
}

export default function ManageCafePage() {
  const params = useParams<{
    cafeId: string;
  }>();

  const cafeId = params.cafeId;

  const [cafe, setCafe] = useState<Cafe | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [theme, setTheme] =
    useState<CafeTheme>("COFFEE_CLASSIC");

  const [primaryColor, setPrimaryColor] =
    useState("#8e6045");

  const [secondaryColor, setSecondaryColor] =
    useState("#d6b08c");

  const [backgroundColor, setBackgroundColor] =
    useState("#0c0c0c");

  const [rewardName, setRewardName] =
    useState("Free Drink");

  const [rewardTarget, setRewardTarget] =
    useState("7");

  const [rewardDescription, setRewardDescription] =
    useState("");

  const [
    minimumPurchaseAmount,
    setMinimumPurchaseAmount,
  ] = useState("");

  const [
    eligiblePurchaseDescription,
    setEligiblePurchaseDescription,
  ] = useState("");

  const [
    googleReviewUrl,
    setGoogleReviewUrl,
  ] = useState("");

  const [
    subscriptionStatus,
    setSubscriptionStatus,
  ] = useState<SubscriptionStatus>("TRIAL");

  const [monthlyPrice, setMonthlyPrice] =
    useState("0");

  const [trialStartedAt, setTrialStartedAt] =
    useState("");

  const [trialEndsAt, setTrialEndsAt] =
    useState("");

  const [
    subscriptionStartedAt,
    setSubscriptionStartedAt,
  ] = useState("");

  const [
    subscriptionEndsAt,
    setSubscriptionEndsAt,
  ] = useState("");

  const [lastPaymentAt, setLastPaymentAt] =
    useState("");

  const [isActive, setIsActive] = useState(true);

  function fillForm(nextCafe: Cafe) {
    setCafe(nextCafe);

    setName(nextCafe.name);
    setSlug(nextCafe.slug);
    setLogoUrl(nextCafe.logoUrl || "");

    setOwnerName(nextCafe.user?.name || "");
    setOwnerEmail(nextCafe.user?.email || "");

    setTheme(nextCafe.theme);
    setPrimaryColor(nextCafe.primaryColor);
    setSecondaryColor(nextCafe.secondaryColor);
    setBackgroundColor(nextCafe.backgroundColor);

    setRewardName(nextCafe.rewardName);
    setRewardTarget(String(nextCafe.rewardTarget));

    setRewardDescription(
      nextCafe.rewardDescription || ""
    );

    setMinimumPurchaseAmount(
      nextCafe.minimumPurchaseAmount === null
        ? ""
        : String(nextCafe.minimumPurchaseAmount)
    );

    setEligiblePurchaseDescription(
      nextCafe.eligiblePurchaseDescription || ""
    );

    setGoogleReviewUrl(
      nextCafe.googleReviewUrl || ""
    );

    setSubscriptionStatus(
      nextCafe.subscriptionStatus
    );

    setMonthlyPrice(
      String(nextCafe.monthlyPrice)
    );

    setTrialStartedAt(
      dateToInputValue(nextCafe.trialStartedAt)
    );

    setTrialEndsAt(
      dateToInputValue(nextCafe.trialEndsAt)
    );

    setSubscriptionStartedAt(
      dateToInputValue(
        nextCafe.subscriptionStartedAt
      )
    );

    setSubscriptionEndsAt(
      dateToInputValue(
        nextCafe.subscriptionEndsAt
      )
    );

    setLastPaymentAt(
      dateToInputValue(nextCafe.lastPaymentAt)
    );

    setIsActive(nextCafe.isActive);
  }

  const loadCafe = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/studio/cafes/${cafeId}`,
        {
          cache: "no-store",
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load café."
        );
      }

      const returnedCafe = data.cafe ?? data;

      if (!returnedCafe?.id || !returnedCafe?.name) {
        console.error(
          "Unexpected café API response:",
          data
        );

        throw new Error(
          "The café API returned an invalid response."
        );
      }

      fillForm(returnedCafe);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load café."
      );
    } finally {
      setLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    if (cafeId) {
      loadCafe();
    }
  }, [cafeId, loadCafe]);

  async function saveCafe(event: FormEvent) {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/studio/cafes/${cafeId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug,
            logoUrl,

            ownerName,
            ownerEmail,

            theme,
            primaryColor,
            secondaryColor,
            backgroundColor,

            rewardName,
            rewardTarget: Number(rewardTarget),
            rewardDescription,

            minimumPurchaseAmount,
            eligiblePurchaseDescription,

            googleReviewUrl,
            subscriptionStatus,
            monthlyPrice: Number(monthlyPrice),

            trialStartedAt,
            trialEndsAt,
            subscriptionStartedAt,
            subscriptionEndsAt,
            lastPaymentAt,

            isActive,
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update café."
        );
      }

      fillForm(data.cafe);
      setSuccess("Café updated successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update café."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin text-[#55565B]"
          />

          <p className="mt-4 text-sm text-[#77777E]">
            Loading café...
          </p>
        </div>
      </div>
    );
  }

  if (error && !cafe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] p-5">
        <div className="w-full max-w-xl rounded-[28px] border border-red-600/15 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <TriangleAlert
            size={28}
            className="mx-auto text-red-600"
          />

          <p className="mt-4 font-medium text-[#171719]">
            Café could not load
          </p>

          <p className="mt-2 text-sm text-[#77777E]">
            {error}
          </p>

          <button
            type="button"
            onClick={loadCafe}
            className="mt-6 rounded-xl bg-[#1D1D1F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#343438]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!cafe) return null;

  return (
    <form
      onSubmit={saveCafe}
      className="min-h-screen space-y-7 bg-[#F5F5F7] px-5 py-6 pb-12 text-[#171719] sm:px-7 lg:px-10"
    >
      <header className="relative overflow-hidden rounded-[30px] border border-black/[0.07] bg-white/90 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-8 lg:flex lg:items-center lg:justify-between">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#D9DCE2]/55 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white blur-3xl" />
        <div>
          <Link
            href="/studio"
            className="relative inline-flex items-center gap-2 text-sm font-medium text-[#74747B] transition hover:text-[#171719]"
          >
            <ArrowLeft size={16} />
            Back to Studio
          </Link>

          <div className="mt-5 flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border text-sm font-semibold"
              style={{
                borderColor: `${primaryColor}55`,
                backgroundColor: `${primaryColor}22`,
                color: secondaryColor,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#171719]">
                  {cafe.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    cafe.isActive
                      ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
                      : "border-red-600/15 bg-red-50 text-red-700"
                  }`}
                >
                  {cafe.isActive
                    ? cafe.subscriptionStatus
                    : "INACTIVE"}
                </span>
              </div>

              <p className="mt-1 text-sm text-[#77777E]">
                /{cafe.slug}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
          <a
            href={`/api/studio/cafes/${cafeId}/customers/export`}
            download
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-[#F7F7F8] px-5 text-sm font-semibold text-[#343438] transition hover:bg-[#EEEEF0]"
          >
            <Download size={17} />
            Export customers CSV
          </a>

          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition hover:bg-[#343438] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Users}
          label="Members"
          value={String(cafe._count.customers)}
        />

        <SummaryCard
          icon={Gift}
          label="Transactions"
          value={String(cafe._count.transactions)}
        />

        <SummaryCard
          icon={CreditCard}
          label="Monthly price"
          value={formatMoney(cafe.monthlyPrice)}
        />

        <SummaryCard
          icon={CalendarDays}
          label="Created"
          value={formatDate(cafe.createdAt)}
        />
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <FormSection
        icon={Building2}
        title="Café and account"
        description="Manage the café and its login account."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Café name"
            value={name}
            onChange={setName}
          />

          <Field
            label="Slug"
            value={slug}
            onChange={setSlug}
          />

          <Field
            label="Account name"
            value={ownerName}
            onChange={setOwnerName}
          />

          <Field
            type="email"
            label="Account email"
            value={ownerEmail}
            onChange={setOwnerEmail}
          />

          <div className="sm:col-span-2">
            <Field
              label="Logo URL"
              value={logoUrl}
              onChange={setLogoUrl}
              required={false}
              placeholder="https://..."
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={Palette}
        title="Branding and theme"
        description="Control the café card appearance."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Theme"
            value={theme}
            onChange={(value) =>
              setTheme(value as CafeTheme)
            }
            options={themes}
          />

          <ColorField
            label="Primary color"
            value={primaryColor}
            onChange={setPrimaryColor}
          />

          <ColorField
            label="Secondary color"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />

          <ColorField
            label="Background color"
            value={backgroundColor}
            onChange={setBackgroundColor}
          />
        </div>
      </FormSection>

      <FormSection
        icon={Gift}
        title="Loyalty program"
        description="Manage the reward and eligibility rules."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Reward name"
            value={rewardName}
            onChange={setRewardName}
          />

          <Field
            type="number"
            label="Stamps required"
            value={rewardTarget}
            onChange={setRewardTarget}
            min={2}
            max={30}
          />

          <Field
            type="number"
            label="Minimum purchase amount"
            value={minimumPurchaseAmount}
            onChange={setMinimumPurchaseAmount}
            required={false}
            min={0}
            placeholder="Optional"
          />

          <Field
            label="Eligible purchase description"
            value={eligiblePurchaseDescription}
            onChange={setEligiblePurchaseDescription}
            required={false}
            placeholder="Optional"
          />

          <div className="sm:col-span-2">
            <TextAreaField
              label="Reward description"
              value={rewardDescription}
              onChange={setRewardDescription}
              placeholder="Optional reward details"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={Star}
        title="Customer ratings"
        description="See ratings submitted from this café's digital loyalty cards."
      >
        <RatingsOverview
          averageRating={cafe.reviewSummary?.averageRating ?? 0}
          totalRatings={cafe.reviewSummary?.totalRatings ?? 0}
          breakdown={
            cafe.reviewSummary?.breakdown ?? {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            }
          }
          reviews={cafe.reviews ?? []}
        />

        <div className="mt-7 border-t border-black/[0.07] pt-6">
          <Field
            label="Google Review URL"
            value={googleReviewUrl}
            onChange={setGoogleReviewUrl}
            required={false}
            placeholder="https://..."
          />
        </div>
      </FormSection>

      <FormSection
        icon={CreditCard}
        title="Subscription"
        description="Control the café subscription and dates."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Subscription status"
            value={subscriptionStatus}
            onChange={(value) =>
              setSubscriptionStatus(
                value as SubscriptionStatus
              )
            }
            options={subscriptionStatuses}
          />

          <Field
            type="number"
            label="Monthly price"
            value={monthlyPrice}
            onChange={setMonthlyPrice}
            min={0}
          />

          <ToggleField
            label="Café active"
            description="Inactive cafés remain in the database."
            checked={isActive}
            onChange={setIsActive}
          />

          <DateField
            label="Trial started"
            value={trialStartedAt}
            onChange={setTrialStartedAt}
          />

          <DateField
            label="Trial ends"
            value={trialEndsAt}
            onChange={setTrialEndsAt}
          />

          <DateField
            label="Last payment"
            value={lastPaymentAt}
            onChange={setLastPaymentAt}
          />

          <DateField
            label="Subscription started"
            value={subscriptionStartedAt}
            onChange={setSubscriptionStartedAt}
          />

          <DateField
            label="Subscription ends"
            value={subscriptionEndsAt}
            onChange={setSubscriptionEndsAt}
          />
        </div>
      </FormSection>

      <section className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-gradient-to-br from-white to-[#E4E6EA] text-[#4E5055] shadow-sm">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#171719]">
              Current account state
            </h2>

            <p className="mt-1 text-sm text-[#77777E]">
              These values come directly from the
              existing café database record.
            </p>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Status"
                value={cafe.subscriptionStatus}
              />

              <InfoItem
                label="Trial expiry"
                value={formatDate(cafe.trialEndsAt)}
              />

              <InfoItem
                label="Subscription expiry"
                value={formatDate(
                  cafe.subscriptionEndsAt
                )}
              />

              <InfoItem
                label="Last updated"
                value={formatDate(cafe.updatedAt)}
              />
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}

type IconType = React.ComponentType<{
  size?: number;
  className?: string;
}>;

function RatingsOverview({
  averageRating,
  totalRatings,
  breakdown,
  reviews,
}: {
  averageRating: number;
  totalRatings: number;
  breakdown: Cafe["reviewSummary"]["breakdown"];
  reviews: Cafe["reviews"];
}) {
  const safeAverage = Number.isFinite(averageRating)
    ? averageRating
    : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[24px] border border-black/[0.07] bg-[#FAFAFB] p-5">
        <div className="flex items-end gap-3">
          <p className="text-5xl font-semibold tracking-[-0.06em] text-[#171719]">
            {totalRatings > 0 ? safeAverage.toFixed(1) : "—"}
          </p>

          <p className="pb-1 text-sm text-[#77777E]">
            {totalRatings === 1
              ? "1 rating"
              : `${totalRatings} ratings`}
          </p>
        </div>

        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={20}
              className={
                star <= Math.round(safeAverage)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-black/[0.06] text-black/[0.12]"
              }
            />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              breakdown[rating as keyof typeof breakdown] ?? 0;
            const percentage =
              totalRatings > 0
                ? (count / totalRatings) * 100
                : 0;

            return (
              <div
                key={rating}
                className="grid grid-cols-[34px_1fr_28px] items-center gap-3"
              >
                <span className="text-sm font-medium text-[#55565B]">
                  {rating}★
                </span>

                <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-[width]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="text-right text-xs text-[#77777E]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-[#171719]">
          Recent ratings
        </h3>

        <p className="mt-1 text-sm text-[#77777E]">
          Latest 20 customer submissions.
        </p>

        {reviews.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-dashed border-black/[0.12] bg-[#FAFAFB] p-7 text-center">
            <Star
              size={24}
              className="mx-auto text-[#A0A0A6]"
            />

            <p className="mt-3 text-sm font-medium text-[#55565B]">
              No customer ratings yet
            </p>

            <p className="mt-1 text-xs text-[#8A8A91]">
              New ratings will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-4 max-h-[340px] space-y-2 overflow-y-auto pr-1">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="flex items-center justify-between gap-4 rounded-[18px] border border-black/[0.07] bg-[#FAFAFB] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#343438]">
                    {review.customer.name}
                  </p>

                  <p className="mt-0.5 text-xs text-[#8A8A91]">
                    Member {review.customer.memberNumber} ·{" "}
                    {formatDate(review.updatedAt)}
                  </p>
                </div>

                <div
                  className="flex shrink-0 gap-0.5"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={
                        star <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-black/[0.05] text-black/[0.1]"
                      }
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string;
}) {
  return (
    <article className="group rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-black/[0.13] hover:bg-[#FCFCFD]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.07] bg-gradient-to-br from-white to-[#E4E6EA] text-[#4E5055] shadow-sm transition group-hover:to-[#D8DADE]">
        <Icon size={18} />
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[#171719]">
        {value}
      </p>

      <p className="mt-1 text-sm text-[#77777E]">
        {label}
      </p>
    </article>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: IconType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <header className="flex items-start gap-4 border-b border-black/[0.06] bg-[#FAFAFB] p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-gradient-to-br from-white to-[#E4E6EA] text-[#4E5055]">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#171719]">
            {title}
          </h2>

          <p className="mt-1 text-sm text-[#77777E]">
            {description}
          </p>
        </div>
      </header>

      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#45454A]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="h-12 w-full rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 text-sm text-[#171719] outline-none transition placeholder:text-[#A1A1A7] hover:border-black/[0.18] focus:border-[#8E9197] focus:ring-2 focus:ring-black/[0.04]"
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      type="date"
      label={label}
      value={value}
      onChange={onChange}
      required={false}
    />
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#45454A]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 py-3 text-sm text-[#171719] outline-none transition placeholder:text-[#A1A1A7] hover:border-black/[0.18] focus:border-[#8E9197] focus:ring-2 focus:ring-black/[0.04]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#45454A]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 text-sm text-[#171719] outline-none transition hover:border-black/[0.18] focus:border-[#8E9197] focus:ring-2 focus:ring-black/[0.04]"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#45454A]">
        {label}
      </label>

      <div className="flex h-12 items-center gap-3 rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-3 transition hover:border-black/[0.18] focus-within:border-[#8E9197] focus-within:ring-2 focus-within:ring-black/[0.04]">
        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0"
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="min-w-0 flex-1 bg-transparent text-sm text-[#171719] outline-none"
        />
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#171719]">
          {label}
        </p>

        <p className="mt-1 text-xs text-[#77777E]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#242426]" : "bg-[#C7C8CC]"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-[#8A8A91]">
        {label}
      </p>

      <p className="mt-1 font-medium text-[#45454A]">
        {value}
      </p>
    </div>
  );
}
