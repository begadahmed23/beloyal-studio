"use client";

import {
  Check,
  Coffee,
  Gift,
  ImagePlus,
  Loader2,
  Star,
  Palette,
  RotateCcw,
  Save,
  Scissors,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  useCafeTheme,
} from "@/components/theme/CafeThemeProvider";
import {
  getBusinessTheme,
  getBusinessThemeColors,
  getBusinessThemeOptions,
  type BusinessThemeOption,
  type CafeThemeConfig,
  type CafeThemeName,
} from "@/lib/cafe-theme";

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

  googleReviewUrl: string;
};

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
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const themeOptions = getBusinessThemeOptions(
    cafe.businessType,
  );
  const PreviewIcon = isBarbershop ? Scissors : Coffee;

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

    googleReviewUrl: cafe.googleReviewUrl ?? "",
  });

  const [form, setForm] =
    useState<FormState>(createInitialState);

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] =
    useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] =
    useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    cafe.googleReviewUrl,
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
    setLogoPreviewFailed(false);
    resetPreviewTheme();
    setMessage(null);
  }

  async function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Logo must be a PNG, JPG, or WebP image.",
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Logo must be smaller than 4 MB.",
      });
      return;
    }

    setUploadingLogo(true);
    setLogoPreviewFailed(false);
    setMessage(null);

    try {
      const uploadData = new FormData();
      uploadData.append("logo", file);

      const response = await fetch("/api/cafe/logo", {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to upload the café logo."
        );
      }

      setForm((current) => ({
        ...current,
        logoUrl: result.logoUrl,
      }));

      setMessage({
        type: "success",
        text:
          result.message ?? "Logo uploaded successfully.",
      });

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to upload the café logo.",
      });
    } finally {
      setUploadingLogo(false);
    }
  }

  function removeLogo() {
    updateField("logoUrl", "");
    setLogoPreviewFailed(false);
    setMessage({
      type: "success",
      text:
        "Logo removed from the form. Press Save Changes to confirm.",
    });
  }

function getThemeColors(theme: CafeThemeName) {
  const [primaryColor, secondaryColor, backgroundColor] =
    getBusinessThemeColors(theme, cafe.businessType);

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

            googleReviewUrl: form.googleReviewUrl,
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
            {isBarbershop
              ? "Barbershop configuration"
              : "Café configuration"}
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
            disabled={saving || uploadingLogo}
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
            disabled={saving || uploadingLogo}
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
            description={`Basic information displayed throughout your ${
              isBarbershop ? "barbershop" : "café"
            } dashboard and customer loyalty card.`}
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Field
             theme={theme}
              label={
                isBarbershop ? "Barbershop name" : "Café name"
              }
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
              label={
                isBarbershop ? "Barbershop slug" : "Café slug"
              }
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
                label={
                  isBarbershop ? "Barbershop logo" : "Café logo"
                }
                description="Upload a permanent PNG, JPG, or WebP logo up to 4 MB. You can also paste a direct image URL."
              >
                <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      logoInputRef.current?.click()
                    }
                    disabled={uploadingLogo || saving}
                    className="flex h-12 items-center justify-center gap-2 border px-5 text-sm font-semibold transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: theme.accent,
                      backgroundColor: theme.accentSoft,
                      color: theme.accent,
                      borderRadius: theme.radiusMedium,
                    }}
                  >
                    {uploadingLogo ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <ImagePlus size={17} />
                    )}

                    {uploadingLogo
                      ? "Uploading..."
                      : form.logoUrl
                        ? "Replace logo"
                        : "Upload logo"}
                  </button>

                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(event) => {
                      updateField(
                        "logoUrl",
                        event.target.value
                      );
                      setLogoPreviewFailed(false);
                    }}
                    placeholder="Or paste a direct image URL"
                    maxLength={1000}
                    disabled={uploadingLogo}
                    className="h-12 w-full border px-4 text-sm outline-none transition focus:ring-2 focus:ring-current/20 disabled:cursor-not-allowed disabled:opacity-60"
                    style={inputStyle}
                  />
                </div>
              </Field>

              {form.logoUrl && (
                <div
                  className="mt-4 flex min-h-28 flex-col items-center justify-center gap-4 border p-4 sm:flex-row sm:justify-between"
                  style={{
                    borderColor: theme.border,
                    backgroundColor:
                      theme.surfaceRaised,
                    borderRadius: theme.radiusMedium,
                  }}
                >
                  <div className="flex min-h-20 flex-1 items-center justify-center">
                    {logoPreviewFailed ? (
                      <p
                        className="text-center text-sm"
                        style={{ color: theme.danger }}
                      >
                        This image could not be loaded. Upload
                        the logo instead or check the URL.
                      </p>
                    ) : (
                      <img
                        src={form.logoUrl}
                        alt="Logo preview"
                        onLoad={() =>
                          setLogoPreviewFailed(false)
                        }
                        onError={() =>
                          setLogoPreviewFailed(true)
                        }
                        className="max-h-20 max-w-[240px] object-contain"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={uploadingLogo || saving}
                    className="flex h-10 shrink-0 items-center justify-center gap-2 border px-4 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor: theme.danger,
                      color: theme.danger,
                      backgroundColor: theme.surface,
                      borderRadius: theme.radiusMedium,
                    }}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
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
            description={`Choose the visual identity used across the ${
              isBarbershop ? "barbershop" : "café"
            } dashboard and customer card.`}
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {themeOptions.map((option) => {
              const selected = form.theme === option.value;
              const previewTheme = getBusinessTheme(
                option.value,
                cafe.businessType,
              );

              return (
                <ThemePreviewOption
                  key={option.value}
                  option={option}
                  selected={selected}
                  previewTheme={previewTheme}
                  cafeName={
                    form.name ||
                    cafe.name ||
                    (isBarbershop
                      ? "Your barbershop"
                      : "Your café")
                  }
                  rewardTarget={Math.max(
                    Number(form.rewardTarget) ||
                      (isBarbershop ? 3 : 8),
                    1,
                  )}
                  rewardName={
                    form.rewardName ||
                    (isBarbershop
                      ? "Free haircut"
                      : "Free drink")
                  }
                  isBarbershop={isBarbershop}
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
            description={
              isBarbershop
                ? "Control how clients earn visits and what they receive after completing their card."
                : "Control how customers earn stamps and what they receive after completing their card."
            }
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Field
              theme={theme}
              label="Reward target"
              description={
                isBarbershop
                  ? "The number of paid visits required to earn the free haircut."
                  : "The number of stamps required to complete a loyalty card."
              }
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
                placeholder={
                  isBarbershop ? "Free Haircut" : "Free Drink"
                }
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
              label={
                isBarbershop
                  ? "Eligible service"
                  : "Eligible purchase"
              }
              description={
                isBarbershop
                  ? "Explain which services count as a loyalty visit."
                  : "Explain which purchases receive a stamp."
              }
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
                placeholder={
                  isBarbershop
                    ? "One visit for every paid haircut."
                    : "One stamp for every coffee purchase."
                }
                maxLength={300}
                rows={4}
                className="w-full resize-none border px-4 py-3 text-sm outline-none"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label={
                isBarbershop
                  ? "Minimum service amount"
                  : "Minimum purchase amount"
              }
              description={
                isBarbershop
                  ? "Optional minimum service amount needed to record a visit."
                  : "Optional minimum order amount needed to earn a stamp."
              }
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
                  <PreviewIcon size={19} />
                </div>

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: theme.textPrimary,
                    }}
                  >
                    {isBarbershop
                      ? "Client preview"
                      : "Customer preview"}
                  </p>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color: theme.textSecondary,
                    }}
                  >
                    Collect{" "}
                    {form.rewardTarget || "0"}{" "}
                    {isBarbershop ? "visits" : "stamps"}{" "}
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
            icon={Star}
            title="Google Reviews"
            description={`Add your ${
              isBarbershop ? "barbershop’s" : "café’s"
            } Google review link. Customers can choose to open it after joining.`}
          />

          <div className="mt-7">
            <Field
              theme={theme}
              label="Google review URL"
              description={`Paste the direct Google review link for this ${
                isBarbershop ? "barbershop" : "café"
              }. Leave it empty to disable the review prompt.`}
            >
              <input
                type="url"
                value={form.googleReviewUrl}
                onChange={(event) =>
                  updateField("googleReviewUrl", event.target.value)
                }
                placeholder="https://g.page/r/your-review-link/review"
                maxLength={1000}
                className="h-12 w-full border px-4 text-sm outline-none transition focus:ring-2 focus:ring-current/20"
                style={inputStyle}
              />
            </Field>

            <div
              className="mt-5 border p-5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: theme.textPrimary }}
              >
                Customer experience
              </p>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: theme.textMuted }}
              >
                After a new customer creates their loyalty card, BeLoyal shows
                a quick star popup. They can then choose “Not now” or open your
                Google review page.
              </p>
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

type ThemeOption = BusinessThemeOption;

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
  isBarbershop,
  onSelect,
}: {
  option: ThemeOption;
  selected: boolean;
  previewTheme: CafeThemeConfig;
  cafeName: string;
  rewardTarget: number;
  rewardName: string;
  isBarbershop: boolean;
  onSelect: () => void;
}) {
  const previewStampCount = Math.min(
    isBarbershop ? 2 : 5,
    rewardTarget,
  );
  const visibleStampTotal = isBarbershop
    ? Math.min(Math.max(rewardTarget, 1), 6)
    : Math.min(Math.max(rewardTarget, 6), 8);
  const LoyaltyIcon = isBarbershop ? Scissors : Coffee;

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
              {isBarbershop
                ? "Barber loyalty card"
                : "Digital loyalty card"}
            </p>

            <p
              className="mt-2 truncate text-xl font-semibold tracking-tight"
              style={{ color: previewTheme.textPrimary }}
            >
              {cafeName}
            </p>
          </div>

          <div
            className={`mt-7 grid gap-2 ${
              isBarbershop ? "grid-cols-3" : "grid-cols-4"
            }`}
          >
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
                  <LoyaltyIcon
                    size={15}
                    style={{
                      color: filled
                        ? previewTheme.accent
                        : previewTheme.textMuted,
                      fill:
                        isBarbershop || !filled
                          ? "transparent"
                          : previewTheme.accent,
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
