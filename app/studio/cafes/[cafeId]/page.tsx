"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  LoaderCircle,
  MessageCircle,
  Palette,
  Save,
  ShieldCheck,
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
  | "SOFT_PASTEL"
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

  whatsappBusinessNumber: string | null;
  whatsappEnabled: boolean;

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
    value: "SOFT_PASTEL",
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
    whatsappBusinessNumber,
    setWhatsappBusinessNumber,
  ] = useState("");

  const [whatsappEnabled, setWhatsappEnabled] =
    useState(false);

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

    setWhatsappBusinessNumber(
      nextCafe.whatsappBusinessNumber || ""
    );

    setWhatsappEnabled(nextCafe.whatsappEnabled);

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

      const data = await response.json();

     if (!response.ok) {
  throw new Error(
    data.message || "Failed to load café."
  );
}

const returnedCafe = data.cafe ?? data;

if (!returnedCafe?.id || !returnedCafe?.name) {
  console.error("Unexpected café API response:", data);

  throw new Error(
    "The café API returned an invalid response."
  );
}

fillForm(returnedCafe);

fillForm(data.cafe);
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

            whatsappBusinessNumber,
            whatsappEnabled,

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

      const data = await response.json();

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
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin text-[#F5F5F7]"
          />

          <p className="mt-4 text-sm text-[#8E8E93]">
            Loading café...
          </p>
        </div>
      </div>
    );
  }

  if (error && !cafe) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/[0.06] p-8 text-center">
        <TriangleAlert
          size={28}
          className="mx-auto text-red-300"
        />

        <p className="mt-4 font-medium text-red-200">
          Café could not load
        </p>

        <p className="mt-2 text-sm text-red-200/70">
          {error}
        </p>

        <button
          type="button"
          onClick={loadCafe}
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!cafe) return null;

  return (
    <form
      onSubmit={saveCafe}
      className="space-y-7 pb-12"
    >
      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm text-[#8E8E93] transition hover:text-white"
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
                <h1 className="text-3xl font-semibold tracking-tight text-[#F5F5F7]">
                  {cafe.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    cafe.isActive
                      ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                      : "border-red-500/20 bg-red-500/[0.08] text-red-300"
                  }`}
                >
                  {cafe.isActive
                    ? cafe.subscriptionStatus
                    : "INACTIVE"}
                </span>
              </div>

              <p className="mt-1 text-sm text-[#8E8E93]">
                /{cafe.slug}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F5F5F7] px-5 text-sm font-semibold text-[#09090A] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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
        icon={MessageCircle}
        title="WhatsApp"
        description="Manage the café WhatsApp configuration."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="WhatsApp business number"
            value={whatsappBusinessNumber}
            onChange={setWhatsappBusinessNumber}
            required={false}
            placeholder="+201..."
          />

          <ToggleField
            label="WhatsApp enabled"
            description="Allow this café to use WhatsApp features."
            checked={whatsappEnabled}
            onChange={setWhatsappEnabled}
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

      <section className="rounded-[28px] border border-white/[0.07] bg-[#141416] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#1C1C1E] text-[#F5F5F7]">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F7]">
              Current account state
            </h2>

            <p className="mt-1 text-sm text-[#8E8E93]">
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
    <article className="rounded-[24px] border border-white/[0.07] bg-[#141416] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#1C1C1E] text-[#F5F5F7]">
        <Icon size={18} />
      </div>

      <p className="mt-5 text-2xl font-semibold text-[#F5F5F7]">
        {value}
      </p>

      <p className="mt-1 text-sm text-[#8E8E93]">
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
    <section className="rounded-[28px] border border-white/[0.07] bg-[#141416]">
      <header className="flex items-start gap-4 border-b border-white/[0.07] p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#1C1C1E] text-[#F5F5F7]">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#F5F5F7]">
            {title}
          </h2>

          <p className="mt-1 text-sm text-[#8E8E93]">
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
      <label className="mb-2 block text-sm font-medium text-[#D1D1D6]">
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
        className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm text-[#F5F5F7] outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
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
      <label className="mb-2 block text-sm font-medium text-[#D1D1D6]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 py-3 text-sm text-[#F5F5F7] outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
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
      <label className="mb-2 block text-sm font-medium text-[#D1D1D6]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm text-[#F5F5F7] outline-none transition focus:border-[#2997FF]"
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
      <label className="mb-2 block text-sm font-medium text-[#D1D1D6]">
        {label}
      </label>

      <div className="flex h-12 items-center gap-3 rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-3">
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
          className="min-w-0 flex-1 bg-transparent text-sm text-[#F5F5F7] outline-none"
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
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#F5F5F7]">
          {label}
        </p>

        <p className="mt-1 text-xs text-[#8E8E93]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#2997FF]" : "bg-[#3A3A3C]"
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
      <p className="text-xs text-[#6E6E73]">
        {label}
      </p>

      <p className="mt-1 font-medium text-[#D1D1D6]">
        {value}
      </p>
    </div>
  );
}