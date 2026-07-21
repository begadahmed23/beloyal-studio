"use client";

import {
  Check,
  Coffee,
  Gift,
  Loader2,
  MessageCircle,
  Palette,
  RotateCcw,
  Save,
  Store,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useCafeTheme,
} from "@/components/theme/CafeThemeProvider";
import { getCafeTheme, type CafeThemeConfig, type CafeThemeName } from "@/lib/cafe-theme";

type Props = {
  accountEmail: string;
};

type FormState = {
  name: string;
  logoUrl: string;
  theme: CafeThemeName;

  rewardTarget: string;
  rewardName: string;
  rewardDescription: string;
  eligiblePurchaseDescription: string;
  minimumPurchaseAmount: string;

  whatsappBusinessNumber: string;
  whatsappEnabled: boolean;
};

const themeOptions: Array<{
  value: CafeThemeName;
  label: string;
  description: string;
}> = [
  {
    value: "COFFEE_CLASSIC",
    label: "Coffee Classic",
    description:
      "Warm cream and walnut tones for a timeless coffee-house atmosphere.",
  },
  {
    value: "MODERN_MINIMAL",
    label: "Modern Minimal",
    description:
      "Soft ivory, stone, and charcoal for bright contemporary cafés.",
  },
  {
    value: "DARK_LUXURY",
    label: "Dark Luxury",
    description:
      "Deep espresso and bronze for an intimate, high-end experience.",
  },
  {
    value: "SOFT_PASTEL",
    label: "Mediterranean Blue",
    description:
      "Calm coastal blues, warm ivory, and an airy Mediterranean feeling.",
  },
  {
    value: "ORGANIC",
    label: "Organic",
    description:
      "Sage, oat, and natural tones for calm wellness-focused cafés.",
  },
];

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

export default function CafeSettingsForm({
  accountEmail,
}: Props) {
  const router = useRouter();

 const {
  theme,
  themeName,
  savedThemeName,
  cafe,
  setPreviewTheme,
  resetPreviewTheme,
  applySavedSettings,
} = useCafeTheme();

  const createInitialState = (): FormState => ({
    name: cafe.name,
    logoUrl: cafe.logoUrl ?? "",
    theme: savedThemeName,

    rewardTarget: String(cafe.rewardTarget),
    rewardName: cafe.rewardName,
    rewardDescription:
      cafe.rewardDescription ?? "",
    eligiblePurchaseDescription:
      cafe.eligiblePurchaseDescription ?? "",
    minimumPurchaseAmount:
      cafe.minimumPurchaseAmount ?? "",

    whatsappBusinessNumber:
      cafe.whatsappBusinessNumber ?? "",
    whatsappEnabled: cafe.whatsappEnabled,
  });

  const [form, setForm] =
    useState<FormState>(createInitialState);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setForm(createInitialState());
  }, [
    cafe.name,
    cafe.logoUrl,
    cafe.rewardTarget,
    cafe.rewardName,
    cafe.rewardDescription,
    cafe.eligiblePurchaseDescription,
    cafe.minimumPurchaseAmount,
    cafe.whatsappBusinessNumber,
    cafe.whatsappEnabled,
    savedThemeName,
  ]);

  useEffect(() => {
    return () => {
      resetPreviewTheme();
    };
  }, [resetPreviewTheme]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage(null);
  }

  function selectTheme(newTheme: CafeThemeName) {
    updateField("theme", newTheme);
    setPreviewTheme(newTheme);
  }

  function resetForm() {
    const originalState = createInitialState();

    setForm(originalState);
    resetPreviewTheme();
    setMessage(null);
  }
function getThemeColors(theme: CafeThemeName) {
  const [primaryColor, secondaryColor, backgroundColor] =
    getPreviewColors(theme);

  return {
    primaryColor,
    secondaryColor,
    backgroundColor,
  };
}
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
        const colors = getThemeColors(form.theme);
      const response = await fetch(
        "/api/cafe/settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            logoUrl: form.logoUrl,
            theme: form.theme,
            primaryColor: colors.primaryColor,
secondaryColor: colors.secondaryColor,
backgroundColor: colors.backgroundColor,
            rewardTarget: Number(
              form.rewardTarget
            ),
            rewardName: form.rewardName,
            rewardDescription:
              form.rewardDescription,
            eligiblePurchaseDescription:
              form.eligiblePurchaseDescription,
            minimumPurchaseAmount:
              form.minimumPurchaseAmount,

            whatsappBusinessNumber:
              form.whatsappBusinessNumber,
            whatsappEnabled:
              form.whatsappEnabled,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to save café settings."
        );
      }

    applySavedSettings(
  result.cafe,
  result.cafe.theme,
);

setMessage({
  type: "success",
  text:
    result.message ??
    "Settings saved successfully.",
});

router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save café settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  const cardStyle = {
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLarge,
    boxShadow: theme.cardShadow,
  };

  const inputStyle = {
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    color: theme.textPrimary,
    borderRadius: theme.radiusMedium,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{
              color: theme.textMuted,
            }}
          >
            Café configuration
          </p>

          <h2
            className="mt-2 text-3xl font-semibold tracking-tight"
            style={{
              color: theme.textPrimary,
            }}
          >
            Settings
          </h2>

          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{
              color: theme.textMuted,
            }}
          >
            Customize the loyalty experience for your
            business. Theme changes are previewed
            immediately and saved only when you press
            Save Changes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="flex h-11 items-center justify-center gap-2 border px-4 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.textSecondary,
              borderRadius: theme.radiusMedium,
            }}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: theme.accent,
              color: theme.buttonText,
              borderRadius: theme.radiusMedium,
            }}
          >
            {saving ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className="mt-6 flex items-start gap-3 border px-4 py-3 text-sm"
          style={{
            borderColor:
              message.type === "success"
                ? theme.accent
                : theme.danger,
            color:
              message.type === "success"
                ? theme.textPrimary
                : theme.danger,
            backgroundColor: theme.surface,
            borderRadius: theme.radiusMedium,
          }}
        >
          {message.type === "success" && (
            <Check
              size={18}
              className="mt-0.5 shrink-0"
              style={{
                color: theme.accent,
              }}
            />
          )}

          <p>{message.text}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6">
        <section
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
           theme={theme}
            icon={Store}
            title="General"
            description="Basic information displayed throughout your café dashboard and customer loyalty card."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Field
             theme={theme}
              label="Café name"
              description="The business name shown to staff and customers."
            >
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                maxLength={80}
                required
                className="h-12 w-full border px-4 text-sm outline-none transition focus:ring-2 focus:ring-current/20"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label="Café slug"
              description="The permanent identifier used by the platform."
            >
              <input
                type="text"
                value={cafe.slug}
                disabled
                className="h-12 w-full cursor-not-allowed border px-4 text-sm opacity-60"
                style={inputStyle}
              />
            </Field>

            <div className="lg:col-span-2">
              <Field
              theme={theme}
                label="Logo URL"
                description="Paste a direct image URL. File uploading will be added later."
              >
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(event) =>
                    updateField(
                      "logoUrl",
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/logo.png"
                  maxLength={500}
                  className="h-12 w-full border px-4 text-sm outline-none transition focus:ring-2 focus:ring-current/20"
                  style={inputStyle}
                />
              </Field>

              {form.logoUrl && (
                <div
                  className="mt-4 flex min-h-24 items-center justify-center border p-4"
                  style={{
                    borderColor: theme.border,
                    backgroundColor:
                      theme.surfaceRaised,
                    borderRadius: theme.radiusMedium,
                  }}
                >
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="max-h-16 max-w-[240px] object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
              theme={theme}
            icon={Palette}
            title="Branding"
            description="Choose the visual identity used across the café dashboard."
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {themeOptions.map((option) => {
              const selected = form.theme === option.value;
              const previewTheme = getCafeTheme(option.value);

              return (
                <ThemePreviewOption
                  key={option.value}
                  option={option}
                  selected={selected}
                  previewTheme={previewTheme}
                  cafeName={form.name || cafe.name || "Your café"}
                  rewardTarget={Math.max(Number(form.rewardTarget) || 8, 1)}
                  rewardName={form.rewardName || "Free drink"}
                  onSelect={() => selectTheme(option.value)}
                />
              );
            })}
          </div>

          {themeName !== savedThemeName && (
            <p
              className="mt-5 text-sm"
              style={{
                color: theme.accent,
              }}
            >
              You are previewing an unsaved theme.
              Press Save Changes to keep it.
            </p>
          )}
        </section>

        <section
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
              theme={theme}
            icon={Gift}
            title="Loyalty program"
            description="Control how customers earn stamps and what they receive after completing their card."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Field
              theme={theme}
              label="Reward target"
              description="The number of stamps required to complete a loyalty card."
            >
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={form.rewardTarget}
                onChange={(event) =>
                  updateField(
                    "rewardTarget",
                    event.target.value
                  )
                }
                required
                className="h-12 w-full border px-4 text-sm outline-none"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label="Reward name"
              description="The short reward title shown to customers."
            >
              <input
                type="text"
                value={form.rewardName}
                onChange={(event) =>
                  updateField(
                    "rewardName",
                    event.target.value
                  )
                }
                placeholder="Free Drink"
                maxLength={80}
                required
                className="h-12 w-full border px-4 text-sm outline-none"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label="Reward description"
              description="Additional details about the completed reward."
            >
              <textarea
                value={form.rewardDescription}
                onChange={(event) =>
                  updateField(
                    "rewardDescription",
                    event.target.value
                  )
                }
                placeholder="Any regular-sized drink from the menu."
                maxLength={300}
                rows={4}
                className="w-full resize-none border px-4 py-3 text-sm outline-none"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label="Eligible purchase"
              description="Explain which purchases receive a stamp."
            >
              <textarea
                value={
                  form.eligiblePurchaseDescription
                }
                onChange={(event) =>
                  updateField(
                    "eligiblePurchaseDescription",
                    event.target.value
                  )
                }
                placeholder="One stamp for every coffee purchase."
                maxLength={300}
                rows={4}
                className="w-full resize-none border px-4 py-3 text-sm outline-none"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label="Minimum purchase amount"
              description="Optional minimum order amount needed to earn a stamp."
            >
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={
                    form.minimumPurchaseAmount
                  }
                  onChange={(event) =>
                    updateField(
                      "minimumPurchaseAmount",
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  className="h-12 w-full border px-4 pr-16 text-sm outline-none"
                  style={inputStyle}
                />

                <span
                  className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  EGP
                </span>
              </div>
            </Field>

            <div
              className="border p-5"
              style={{
                borderColor: theme.border,
                backgroundColor:
                  theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{
                    backgroundColor:
                      theme.accentSoft,
                    color: theme.accent,
                    borderRadius:
                      theme.radiusMedium,
                  }}
                >
                  <Coffee size={19} />
                </div>

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: theme.textPrimary,
                    }}
                  >
                    Customer preview
                  </p>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    Collect{" "}
                    {form.rewardTarget || "0"} stamps
                    and receive:
                  </p>

                  <p
                    className="mt-1 font-semibold"
                    style={{
                      color: theme.accent,
                    }}
                  >
                    {form.rewardName ||
                      "Your reward"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
              theme={theme}
            icon={MessageCircle}
            title="WhatsApp"
            description="Prepare the café account for future automated customer messages."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Field
              theme={theme}
              label="WhatsApp business number"
              description="Use the international format, including the country code."
            >
              <input
                type="tel"
                value={
                  form.whatsappBusinessNumber
                }
                onChange={(event) =>
                  updateField(
                    "whatsappBusinessNumber",
                    event.target.value
                  )
                }
                placeholder="+201001234567"
                className="h-12 w-full border px-4 text-sm outline-none"
                style={inputStyle}
              />
            </Field>

            <div
              className="flex items-center justify-between gap-5 border p-5"
              style={{
                borderColor: theme.border,
                backgroundColor:
                  theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: theme.textPrimary,
                  }}
                >
                  Enable WhatsApp
                </p>

                <p
                  className="mt-1 text-xs leading-5"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  This saves the preference. Automated
                  messaging will be connected later.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  form.whatsappEnabled
                }
                onClick={() =>
                  updateField(
                    "whatsappEnabled",
                    !form.whatsappEnabled
                  )
                }
                className="relative h-7 w-12 shrink-0 rounded-full transition"
                style={{
                  backgroundColor:
                    form.whatsappEnabled
                      ? theme.accent
                      : theme.border,
                }}
              >
                <span
                  className="absolute top-1 h-5 w-5 rounded-full transition"
                  style={{
                    left: form.whatsappEnabled
                      ? "24px"
                      : "4px",
                    backgroundColor:
                      theme.buttonText,
                  }}
                />
              </button>
            </div>
          </div>
        </section>

        <section
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
              theme={theme}
            icon={UserRound}
            title="Account and subscription"
            description="These details are managed by the platform administrator and cannot be changed here."
          />

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ReadOnlyItem
              theme={theme}
              label="Account email"
              value={accountEmail}
            />

            <ReadOnlyItem
            theme={theme}
              label="Subscription status"
              value={formatStatus(
                cafe.subscriptionStatus
              )}
            />

            <ReadOnlyItem
              theme={theme}
              label="Monthly price"
              value={
                cafe.monthlyPrice
                  ? `${cafe.monthlyPrice} EGP`
                  : "Not set"
              }
            />

            <ReadOnlyItem
              theme={theme}
              label="Trial started"
              value={formatDate(
                cafe.trialStartedAt
              )}
            />

            <ReadOnlyItem
              theme={theme}
              label="Trial ends"
              value={formatDate(cafe.trialEndsAt)}
            />

            <ReadOnlyItem
              theme={theme}
              label="Subscription ends"
              value={formatDate(
                cafe.subscriptionEndsAt
              )}
            />
          </div>
        </section>
      </div>
    </form>
  );


}

type ThemeOption = (typeof themeOptions)[number];

type ThemedComponentProps = {
  theme: CafeThemeConfig;
};

function ThemePreviewOption({
  option,
  selected,
  previewTheme,
  cafeName,
  rewardTarget,
  rewardName,
  onSelect,
}: {
  option: ThemeOption;
  selected: boolean;
  previewTheme: CafeThemeConfig;
  cafeName: string;
  rewardTarget: number;
  rewardName: string;
  onSelect: () => void;
}) {
  const previewStampCount = Math.min(5, rewardTarget);
  const visibleStampTotal = Math.min(Math.max(rewardTarget, 6), 8);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group relative overflow-hidden border p-3 text-left transition duration-300 hover:-translate-y-1"
      style={{
        borderColor: selected ? previewTheme.accent : previewTheme.border,
        backgroundColor: previewTheme.surface,
        borderRadius: previewTheme.radiusLarge,
        boxShadow: selected
          ? `0 22px 55px ${withAlpha(previewTheme.accent, "24")}`
          : previewTheme.cardShadow,
      }}
    >
      {selected && (
        <span
          className="absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full border"
          style={{
            backgroundColor: previewTheme.accent,
            borderColor: withAlpha(previewTheme.buttonText, "33"),
            color: previewTheme.buttonText,
          }}
        >
          <Check size={16} strokeWidth={2.5} />
        </span>
      )}

      <div
        className="relative min-h-56 overflow-hidden border p-5 transition duration-300 group-hover:scale-[1.01]"
        style={{
          borderColor: previewTheme.border,
          borderRadius: previewTheme.radiusMedium,
          background: `radial-gradient(circle at top right, ${withAlpha(
            previewTheme.accent,
            "24"
          )} 0%, ${previewTheme.surfaceRaised} 42%, ${previewTheme.pageBackground} 100%)`,
        }}
      >
        <div
          className="absolute -right-10 -top-12 h-32 w-32 rounded-full blur-3xl"
          style={{ backgroundColor: withAlpha(previewTheme.accent, "2b") }}
        />

        <div className="relative flex min-h-46 flex-col">
          <div className="pr-10">
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: previewTheme.textMuted }}
            >
              Digital loyalty card
            </p>

            <p
              className="mt-2 truncate text-xl font-semibold tracking-tight"
              style={{ color: previewTheme.textPrimary }}
            >
              {cafeName}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-4 gap-2">
            {Array.from({ length: visibleStampTotal }).map((_, index) => {
              const filled = index < previewStampCount;

              return (
                <span
                  key={index}
                  className="flex aspect-square items-center justify-center border"
                  style={{
                    borderColor: filled
                      ? withAlpha(previewTheme.accent, "66")
                      : previewTheme.border,
                    backgroundColor: filled
                      ? previewTheme.accentSoft
                      : previewTheme.surface,
                    borderRadius: previewTheme.radiusMedium,
                  }}
                >
                  <Coffee
                    size={15}
                    style={{
                      color: filled
                        ? previewTheme.accent
                        : previewTheme.textMuted,
                      fill: filled ? previewTheme.accent : "transparent",
                    }}
                  />
                </span>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: previewTheme.textMuted }}
                >
                  Your reward
                </p>
                <p
                  className="mt-1 truncate text-sm font-semibold"
                  style={{ color: previewTheme.accent }}
                >
                  {rewardName}
                </p>
              </div>

              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  backgroundColor: previewTheme.accent,
                  color: previewTheme.buttonText,
                }}
              >
                {previewStampCount}/{rewardTarget}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 pb-2 pt-5">
        <p
          className="font-semibold"
          style={{ color: previewTheme.textPrimary }}
        >
          {option.label}
        </p>
        <p
          className="mt-2 text-sm leading-5"
          style={{ color: previewTheme.textMuted }}
        >
          {option.description}
        </p>
      </div>
    </button>
  );
}

function SectionHeader({
  theme,
  icon: Icon,
  title,
  description,
}: ThemedComponentProps & {
  icon: typeof Store;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        style={{
          backgroundColor: theme.accentSoft,
          color: theme.accent,
          borderRadius: theme.radiusMedium,
        }}
      >
        <Icon size={20} />
      </div>

      <div>
        <h3
          className="text-lg font-semibold"
          style={{ color: theme.textPrimary }}
        >
          {title}
        </h3>
        <p
          className="mt-1 text-sm leading-6"
          style={{ color: theme.textMuted }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  theme,
  label,
  description,
  children,
}: ThemedComponentProps & {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="text-sm font-semibold"
        style={{ color: theme.textPrimary }}
      >
        {label}
      </span>
      <span
        className="mt-1 block text-xs leading-5"
        style={{ color: theme.textMuted }}
      >
        {description}
      </span>
      <span className="mt-3 block">{children}</span>
    </label>
  );
}

function ReadOnlyItem({
  theme,
  label,
  value,
}: ThemedComponentProps & {
  label: string;
  value: string;
}) {
  return (
    <div
      className="border p-4"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surfaceRaised,
        borderRadius: theme.radiusMedium,
      }}
    >
      <p
        className="text-xs font-medium"
        style={{ color: theme.textMuted }}
      >
        {label}
      </p>
      <p
        className="mt-2 break-words text-sm font-semibold"
        style={{ color: theme.textPrimary }}
      >
        {value}
      </p>
    </div>
  );
}

function withAlpha(color: string, alpha: string) {
  const cleanColor = color.replace("#", "");
  return /^[0-9a-fA-F]{6}$/.test(cleanColor)
    ? `#${cleanColor}${alpha}`
    : color;
}

function getPreviewColors(
  themeName: CafeThemeName
): [string, string, string] {
  const colors: Record<
    CafeThemeName,
    [string, string, string]
  > = {
    COFFEE_CLASSIC: [
      "#7b4f35",
      "#6f4a35",
      "#f3ede5",
    ],
    MODERN_MINIMAL: [
      "#20201e",
      "#77756e",
      "#fffefa",
    ],
    DARK_LUXURY: [
      "#b98552",
      "#cba477",
      "#0b0908",
    ],
    SOFT_PASTEL: [
      "#5f8994",
      "#426c77",
      "#eaf3f5",
    ],
    ORGANIC: [
      "#758b64",
      "#556849",
      "#edf0e5",
    ],
  };

  return colors[themeName];
}