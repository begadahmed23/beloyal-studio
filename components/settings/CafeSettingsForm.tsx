"use client";

import MbVapeLogo from "@/components/brand/MbVapeLogo";
import { isMbVape } from "@/lib/business/mb-vape";
import { dashboardSettingsSections, type DashboardSettingsSection } from "@/lib/business/settings-sections";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

import {
  Check,
  Coffee,
  Gift,
  ImagePlus,
  Loader2,
  MessageCircle,
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

import {
  useCafeTheme,
} from "@/components/theme/CafeThemeProvider";
import {
  getBusinessTheme,
  getBusinessBrandColors,
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

  feedbackEnabled: boolean;
  feedbackRewardEnabled: boolean;
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
 const {
  theme,
  themeName,
  savedThemeName,
  cafe,
  setPreviewTheme,
  resetPreviewTheme,
  applySavedSettings,
} = useCafeTheme();
  const mbVape = isMbVape(cafe);
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const normalizedCafeName = cafe.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isKato =
    cafe.slug.toLowerCase().includes("kato") ||
    normalizedCafeName.includes("kato");
  const isKeka =
    cafe.slug.toLowerCase().includes("keka") ||
    normalizedCafeName.includes("keka");

  const themeOptions = getBusinessThemeOptions(
    cafe.businessType,
  );
  const PreviewIcon = isBarbershop ? Scissors : Coffee;

  const createInitialState = (): FormState => ({
    name: cafe.name,
    logoUrl: cafe.logoUrl ?? "",
    theme: savedThemeName,

    rewardTarget: String(Math.max(cafe.rewardTarget, 2)),
    rewardName: cafe.rewardName,
    rewardDescription:
      cafe.rewardDescription ?? "",
    eligiblePurchaseDescription:
      cafe.eligiblePurchaseDescription ?? "",
    minimumPurchaseAmount:
      cafe.minimumPurchaseAmount ?? "",

    feedbackEnabled: cafe.feedbackEnabled,
    feedbackRewardEnabled: cafe.feedbackRewardEnabled,
    googleReviewUrl: cafe.googleReviewUrl ?? "",
  });

  const [draft, setDraft] = useState<Partial<FormState>>({});
  const form = { ...createInitialState(), ...draft };
  const [saving, setSaving] = useState<DashboardSettingsSection | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const resetPreviewRef = useRef(resetPreviewTheme);

  const [message, setMessage] = useState<{
    section: DashboardSettingsSection;
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    resetPreviewRef.current = resetPreviewTheme;
  }, [resetPreviewTheme]);

  useEffect(() => () => resetPreviewRef.current(), []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function selectTheme(newTheme: CafeThemeName) {
    updateField("theme", newTheme);
    setPreviewTheme(newTheme);
  }

  function resetSection(section: DashboardSettingsSection) {
    setDraft((current) => {
      const next = { ...current };
      for (const field of dashboardSettingsSections[section]) delete next[field];
      return next;
    });
    if (section === "branding") resetPreviewTheme();
    if (section === "general") setLogoPreviewFailed(false);
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
        section: "general",
        type: "error",
        text: "Logo must be a PNG, JPG, or WebP image.",
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMessage({
        section: "general",
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
      uploadData.append("draft", "true");

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

      setDraft((current) => ({
        ...current,
        logoUrl: result.logoUrl,
      }));

      setMessage({
        section: "general",
        type: "success",
        text:
          "Logo ready. Select Save General to apply it.",
      });
    } catch (error) {
      setMessage({
        section: "general",
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
        section: "general",
      type: "success",
      text:
        "Logo removed from the form. Select Save General to apply the change.",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, section: DashboardSettingsSection) {
    event.preventDefault();
    if (saving || (section === "general" && uploadingLogo)) return;

    setSaving(section);
    setMessage(null);

    try {
      const fields = dashboardSettingsSections[section];
      const input = Object.fromEntries(fields.map((field) => [field, form[field]]));
      if (section === "branding" && !isKato && !isKeka) {
        const [primaryColor, secondaryColor, backgroundColor] = getBusinessBrandColors(
          form.theme, cafe.businessType, form.theme === savedThemeName ? cafe : undefined,
        );
        Object.assign(input, { primaryColor, secondaryColor, backgroundColor });
      }

      const response = await fetch("/api/cafe/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, ...input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save settings.");

      applySavedSettings(result.cafe, result.cafe.theme);
      setDraft((current) => {
        const next = { ...current };
        for (const field of fields) {
          if (current[field] === form[field]) delete next[field];
        }
        return next;
      });
      setMessage({ section, type: "success", text: "Saved." });
    } catch (error) {
      setMessage({ section, type: "error", text: error instanceof Error ? error.message : "Unable to save settings." });
    } finally {
      setSaving(null);
    }
  }

  function saveControls(section: DashboardSettingsSection, label: string) {
    const pending = saving === section;
    const disabled = Boolean(saving) || (section === "general" && uploadingLogo);
    const dirty = dashboardSettingsSections[section].some((field) => field in draft);
    return (
      <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: theme.border }}>
        <div className="flex flex-wrap justify-end gap-2 sm:ml-auto">
          {dirty && (
            <button type="button" disabled={disabled} onClick={() => resetSection(section)}
              className="flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: theme.border, color: theme.textSecondary }}>
              <RotateCcw size={16} aria-hidden="true" /> Reset
            </button>
          )}
          <button type="submit" disabled={disabled} aria-busy={pending}
            className="flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.accent, color: theme.accentText, borderRadius: theme.radiusMedium }}>
            {pending ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {label}
          </button>
        </div>
        <p role="status" className="min-h-5 text-sm sm:order-first" style={{ color: message?.type === "error" ? theme.danger : theme.textSecondary }}>
          {pending ? "Saving…" : message?.section === section ? message.text : ""}
        </p>
      </div>
    );
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
    <div>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{
              color: theme.textMuted,
            }}
          >
            {isKato
              ? "KATŌ configuration"
              : isBarbershop
                ? "Barbershop configuration"
                : cafe.businessType === "CAFE" ? "Café configuration" : "Business configuration"}
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
            {isKato
              ? "Manage KATŌ’s loyalty program, customer experience, and business controls."
              : "Customize your loyalty program. Each section saves independently."}
          </p>
        </div>

      </div>

      <div className="mt-8 grid gap-6">
        {!isKato && !isKeka && (
        <form onSubmit={(event) => handleSubmit(event, "general")}
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
           theme={theme}
            icon={Store}
            title="General"
            description={`Basic information displayed throughout your ${
              isBarbershop ? "barbershop" : cafe.businessType === "CAFE" ? "café" : "business"
            } dashboard and customer loyalty card.`}
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Field
             theme={theme}
              label={
                isBarbershop ? "Barbershop name" : "Business name"
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
                className="h-12 w-full border px-4 text-base sm:text-sm outline-none transition focus:ring-2 focus:ring-current/20"
                style={inputStyle}
              />
            </Field>

            <Field
              theme={theme}
              label={
                isBarbershop ? "Barbershop slug" : "Business slug"
              }
              description="The permanent identifier used by the platform."
            >
              <input
                type="text"
                value={cafe.slug}
                disabled
                className="h-12 w-full cursor-not-allowed border px-4 text-base opacity-60 sm:text-sm"
                style={inputStyle}
              />
            </Field>

            {mbVape ? (
              <div className="space-y-2 lg:col-span-2">
                <p className="text-sm font-medium">Business logo</p>
                <MbVapeLogo className="h-[78px] w-[114px] border border-black/10 p-1.5" />
                <p className="text-xs" style={{ color: theme.textMuted }}>Used on the dashboard and MB Vape cards.</p>
              </div>
            ) : (
            <div className="lg:col-span-2">
              <Field
              theme={theme}
                label={
                  isBarbershop ? "Barbershop logo" : "Business logo"
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
                    disabled={uploadingLogo || Boolean(saving)}
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
                    className="h-12 w-full border px-4 text-base sm:text-sm outline-none transition focus:ring-2 focus:ring-current/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                    disabled={uploadingLogo || Boolean(saving)}
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
            )}
          </div>
          {saveControls("general", "Save General")}
        </form>
        )}

        {!isKato && !isKeka && (
        <form onSubmit={(event) => handleSubmit(event, "branding")}
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
              theme={theme}
            icon={Palette}
            title="Branding"
            description={`Choose the visual identity used across the ${
              isBarbershop ? "barbershop" : cafe.businessType === "CAFE" ? "café" : "business"
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
                      : "Your business")
                  }
                  rewardTarget={getLoyaltyProgressTarget({
                    rewardTarget: Number(form.rewardTarget) || (isBarbershop ? 3 : 8),
                  })}
                  rewardName={
                    form.rewardName ||
                    (isBarbershop
                      ? "Free haircut"
                      : cafe.businessType === "CAFE" ? "Free drink" : "Member reward")
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
              Select Save Branding to keep it.
            </p>
          )}
          {saveControls("branding", "Save Branding")}
        </form>

        )}
        {isKeka && (
          <form onSubmit={(event) => handleSubmit(event, "branding")}
            className="border p-5 sm:p-7"
            style={cardStyle}
          >
            <SectionHeader
              theme={theme}
              icon={Palette}
              title="Customer card appearance"
              description="Choose the Keka loyalty card style customers see on their phones."
            />

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                {
                  value: "COFFEE_CLASSIC" as CafeThemeName,
                  label: "Burgundy",
                  description: "Keka’s deep burgundy with warm cream details.",
                  background: "#4A0D10",
                  card: "#741A1D",
                  accent: "#F4E5C6",
                },
                {
                  value: "MODERN_MINIMAL" as CafeThemeName,
                  label: "Cream",
                  description: "Warm cream with burgundy typography and details.",
                  background: "#F3E5D3",
                  card: "#FFF6E6",
                  accent: "#741A1D",
                },
              ].map((option) => {
                const selected = form.theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectTheme(option.value)}
                    className="overflow-hidden border p-3 text-left transition pointer-fine:motion-safe:hover:-translate-y-0.5"
                    style={{
                      borderColor: selected ? theme.accent : theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: theme.radiusLarge,
                    }}
                  >
                    <div
                      className="relative min-h-40 overflow-hidden p-5"
                      style={{
                        backgroundColor: option.background,
                        borderRadius: theme.radiusMedium,
                      }}
                    >
                      <div
                        className="rounded-[22px] border p-4"
                        style={{
                          backgroundColor: option.card,
                          borderColor: option.accent + "33",
                          color: option.accent,
                        }}
                      >
                        <p className="font-serif text-2xl font-semibold">Keka</p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.18em] opacity-65">
                          Little Rituals, Big Comfort
                        </p>
                        <div className="mt-7 flex gap-2">
                          {[0, 1, 2, 3].map((stamp) => (
                            <span
                              key={stamp}
                              className="h-6 w-6 rounded-[9px] border"
                              style={{
                                borderColor: option.accent + "55",
                                backgroundColor:
                                  stamp < 3 ? option.accent : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {selected ? (
                        <span
                          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: option.accent,
                            color: option.card,
                          }}
                        >
                          <Check size={14} />
                        </span>
                      ) : null}
                    </div>
                    <div className="px-2 pb-2 pt-4">
                      <p className="font-semibold" style={{ color: theme.textPrimary }}>
                        {option.label}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {saveControls("branding", "Save Card Appearance")}
          </form>
        )}

        {isKato && (
          <form onSubmit={(event) => handleSubmit(event, "branding")}
            className="border p-5 sm:p-7"
            style={cardStyle}
          >
            <SectionHeader
              theme={theme}
              icon={Palette}
              title="Customer card appearance"
              description="Choose the KATŌ loyalty card style customers see on their phones."
            />

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                {
                  value: "MODERN_MINIMAL" as CafeThemeName,
                  label: "Light",
                  description: "White, navy, and soft stone.",
                  background: "#F4F7FA",
                  card: "#FFFFFF",
                  accent: "#102B49",
                },
                {
                  value: "DARK_LUXURY" as CafeThemeName,
                  label: "Dark",
                  description: "Deep navy, cream, and soft white.",
                  background: "#071A33",
                  card: "#0D2744",
                  accent: "#E9E6D8",
                },
              ].map((option) => {
                const selected = form.theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectTheme(option.value)}
                    className="overflow-hidden border p-4 text-left transition pointer-fine:motion-safe:hover:-translate-y-0.5"
                    style={{
                      borderColor: selected
                        ? "#102B49"
                        : theme.border,
                      backgroundColor: theme.surface,
                      borderRadius: theme.radiusMedium,
                      boxShadow: selected
                        ? "0 0 0 1px #102B49"
                        : "none",
                    }}
                  >
                    <div
                      className="rounded-[18px] p-3"
                      style={{
                        backgroundColor: option.background,
                      }}
                    >
                      <div
                        className="h-20 rounded-[15px] p-3"
                        style={{
                          backgroundColor: option.card,
                        }}
                      >
                        <div
                          className="h-2 w-16 rounded-full"
                          style={{
                            backgroundColor: option.accent,
                          }}
                        />
                        <div
                          className="mt-3 h-8 rounded-lg"
                          style={{
                            backgroundColor:
                              option.value === "DARK_LUXURY"
                                ? "#102B49"
                                : "#EEF3F7",
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: theme.textPrimary }}
                        >
                          {option.label}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: theme.textMuted }}
                        >
                          {option.description}
                        </p>
                      </div>

                      {selected && (
                        <Check
                          size={18}
                          style={{ color: theme.accent }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {saveControls("branding", "Save Card Appearance")}
          </form>
        )}

        <form onSubmit={(event) => handleSubmit(event, "loyalty")}
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
              label="Reward visit"
              description="A target of 7 means 6 paid visits, then the reward on visit 7."
            >
              <input
                type="number"
                min={2}
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
                className="h-12 w-full border px-4 text-base sm:text-sm outline-none"
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
                className="h-12 w-full border px-4 text-base sm:text-sm outline-none"
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
                className="w-full resize-none border px-4 py-3 text-base sm:text-sm outline-none"
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
                className="w-full resize-none border px-4 py-3 text-base sm:text-sm outline-none"
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
                  className="h-12 w-full border px-4 pr-16 text-base sm:text-sm outline-none"
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
                    {isBarbershop
                      ? `Complete ${getLoyaltyProgressTarget({ rewardTarget: Number(form.rewardTarget) })} paid visits, then redeem on your next visit:`
                      : `Buy ${getLoyaltyProgressTarget({ rewardTarget: Number(form.rewardTarget) })} and get 1 free:`}
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

                  {form.eligiblePurchaseDescription.trim() && (
                    <p
                      className="mt-2 text-xs leading-5"
                      style={{ color: theme.textMuted }}
                    >
                      Eligible: {form.eligiblePurchaseDescription.trim()}
                    </p>
                  )}

                  {form.rewardDescription.trim() && (
                    <p
                      className="mt-1 text-xs leading-5"
                      style={{ color: theme.textMuted }}
                    >
                      Reward: {form.rewardDescription.trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {saveControls("loyalty", "Save Loyalty Program")}
        </form>

        <form onSubmit={(event) => handleSubmit(event, "feedback")}
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
            theme={theme}
            icon={MessageCircle}
            title="Customer feedback"
            description="Choose whether customers can privately share written feedback from their loyalty card."
          />

          <div
            className="mt-7 flex items-center justify-between gap-5 border p-5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              borderRadius: theme.radiusMedium,
            }}
          >
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: theme.textPrimary }}
              >
                Share your thoughts
              </p>

              <p
                className="mt-1 text-sm leading-6"
                style={{ color: theme.textMuted }}
              >
                When enabled, the customer card shows the feedback button.
                The first submitted note still earns one bonus{" "}
                {isBarbershop ? "visit" : "stamp"}.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.feedbackEnabled}
              aria-label="Enable Share your thoughts"
              onClick={() =>
                updateField(
                  "feedbackEnabled",
                  !form.feedbackEnabled,
                )
              }
              className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
              style={{
                backgroundColor: form.feedbackEnabled
                  ? theme.accent
                  : theme.inputBorder,
              }}
            >
              <span
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  left: "4px",
                  transform: form.feedbackEnabled
                    ? "translateX(20px)"
                    : "translateX(0)",
                }}
              />
            </button>
          </div>

          {form.feedbackEnabled && (
            <div
              className="mt-4 flex items-center justify-between gap-5 border p-5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  Give 1 bonus stamp for first feedback
                </p>

                <p
                  className="mt-1 text-sm leading-6"
                  style={{ color: theme.textMuted }}
                >
                  Turn this off if you want to collect feedback without giving a free{" "}
                  {isBarbershop ? "visit" : "stamp"}.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.feedbackRewardEnabled}
                aria-label="Give one bonus stamp for first feedback"
                onClick={() =>
                  updateField(
                    "feedbackRewardEnabled",
                    !form.feedbackRewardEnabled,
                  )
                }
                className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
                style={{
                  backgroundColor: form.feedbackRewardEnabled
                    ? theme.accent
                    : theme.inputBorder,
                }}
              >
                <span
                  className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    left: "4px",
                    transform: form.feedbackRewardEnabled
                      ? "translateX(20px)"
                      : "translateX(0)",
                  }}
                />
              </button>
            </div>
          )}
          {saveControls("feedback", "Save Feedback")}
        </form>

        <form onSubmit={(event) => handleSubmit(event, "reviews")}
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
                isBarbershop ? "barbershop" : cafe.businessType === "CAFE" ? "café" : "business"
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
                className="h-12 w-full border px-4 text-base sm:text-sm outline-none transition focus:ring-2 focus:ring-current/20"
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
          {saveControls("reviews", "Save Google Reviews")}
        </form>

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
    </div>
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
      className="group relative overflow-hidden border p-3 text-left transition duration-300 pointer-fine:motion-safe:hover:-translate-y-1"
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
        className="relative min-h-56 overflow-hidden border p-5 transition duration-300 pointer-fine:motion-safe:group-hover:scale-[1.01]"
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
