"use client";
import MbVapeStamp from "@/components/brand/MbVapeStamp";
import { getBusinessTerminology } from "@/lib/business/terminology";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import MbVapeLogo from "@/components/brand/MbVapeLogo";
import { isMbVape } from "@/lib/business/mb-vape";
import { dashboardSettingsSections, type DashboardSettingsSection } from "@/lib/business/settings-sections";
import ThemeGallery from "@/components/theme/ThemeGallery";
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
  getDashboardThemeColors,
  type CafeThemeConfig,
  type DashboardThemeName,
} from "@/lib/cafe-theme";

type FormState = {
  name: string;
  logoUrl: string;
  theme: DashboardThemeName;

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

export default function CafeSettingsForm() {
  const { t } = useBeLoyalLanguage();
 const {
  theme,
  savedThemeName,
  cafe,
  setPreviewTheme,
  resetPreviewTheme,
  applySavedSettings,
} = useCafeTheme();
  const mbVape = isMbVape(cafe);
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const isCafe = cafe.businessType === "CAFE";
  const terminology = getBusinessTerminology(cafe.businessType);
  const normalizedCafeName = cafe.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isKato = isCafe && (cafe.slug.toLowerCase().includes("kato") || normalizedCafeName.includes("kato"));
  const isKeka = isCafe && (cafe.slug.toLowerCase().includes("keka") || normalizedCafeName.includes("keka"));

  const PreviewIcon = { CAFE: Coffee, BARBERSHOP: Scissors, VAPE: MbVapeStamp, OTHER: Store }[cafe.businessType];

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
  const saveRequest = useRef(false);
  const [saving, setSaving] = useState<DashboardSettingsSection | null>(null);
  const [refreshingWallet, setRefreshingWallet] = useState(false);
  const [walletRefreshMessage, setWalletRefreshMessage] = useState("");
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

  function selectTheme(newTheme: DashboardThemeName) {
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
          result.error ?? "Unable to upload the business logo."
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
            : "Unable to upload the business logo.",
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
    if (saveRequest.current || (section === "general" && uploadingLogo)) return;

    saveRequest.current = true;

    setSaving(section);
    setMessage(null);

    try {
      const fields = dashboardSettingsSections[section];
      const input = Object.fromEntries(fields.map((field) => [field, form[field]]));
      if (section === "branding") {
        const [primaryColor, secondaryColor, backgroundColor] = getDashboardThemeColors(form.theme);
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
      if (section === "branding") resetPreviewTheme();
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
      saveRequest.current = false;
      setSaving(null);
    }
  }

  async function refreshSavedWalletCards() {
    if (refreshingWallet || saving) return;
    setRefreshingWallet(true);
    setWalletRefreshMessage("");
    try {
      const response = await fetch("/api/cafe/wallet/refresh", { method: "POST" });
      const result: { message?: string; rewardName?: string } = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to refresh Wallet cards.");
      setWalletRefreshMessage(`Sending saved cards the current reward: ${result.rewardName || "your saved reward"}. Wallet updates can take a few minutes.`);
    } catch (error) {
      setWalletRefreshMessage(error instanceof Error ? error.message : "Unable to refresh Wallet cards.");
    } finally {
      setRefreshingWallet(false);
    }
  }

  function saveControls(section: DashboardSettingsSection, label: string) {
    const pending = saving === section;
    const disabled = Boolean(saving) || (section === "general" && uploadingLogo);
    const dirty = dashboardSettingsSections[section].some((field) => field in draft);
    const saved = !pending && !dirty && message?.section === section && message.type === "success";
    return (
      <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: theme.border }}>
        <div className="flex flex-wrap justify-end gap-2 sm:ms-auto">
          {dirty && (
            <button type="button" disabled={disabled} onClick={() => resetSection(section)}
              className="flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: theme.border, color: theme.textSecondary }}>
              <RotateCcw size={16} aria-hidden="true" /> {t("Reset")}
            </button>
          )}
          <button type="submit" disabled={disabled} aria-busy={pending}
            className="flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: theme.accent, color: theme.accentText, borderRadius: theme.radiusMedium }}>
            {pending ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : saved ? <Check size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {saved ? t("Saved.").replace(/\.$/, "") : t(label)}
          </button>
        </div>
        <p role="status" className="min-h-5 text-sm sm:order-first" style={{ color: message?.section !== section ? theme.textSecondary : message.type === "error" ? theme.danger : theme.success }}>
          {t(pending ? "Saving…" : message?.section === section ? message.text : "")}
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

  const previewTarget = getLoyaltyProgressTarget({ rewardTarget: Number(form.rewardTarget) });
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
                ? t("Barbershop configuration")
                : cafe.businessType === "CAFE" ? t("Café configuration") : t("Business configuration")}
          </p>

          <h2
            className="mt-2 text-3xl font-semibold tracking-tight"
            style={{
              color: theme.textPrimary,
            }}
          >{t("Settings")}</h2>

          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{
              color: theme.textMuted,
            }}
          >
            {isKato
              ? "Manage KATŌ’s loyalty program, customer experience, and business controls."
              : t("Customize your loyalty program. Each section saves independently.")}
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
            title={t("General")}
            description={`Basic information displayed throughout your ${
              terminology.businessSingular
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

        <form onSubmit={(event) => handleSubmit(event, "branding")} className="border p-5 sm:p-7" style={cardStyle}>
          <SectionHeader theme={theme} icon={Palette} title={t("Dashboard appearance")}
            description={t("Choose a palette for the owner and cashier dashboards.")} />
          <div className="mt-5">
            <ThemeGallery value={form.theme} onChange={selectTheme} disabled={saving !== null} />
          </div>
          {"theme" in draft && (
            <p className="mt-4 text-sm" style={{ color: theme.accent }}>{t("Previewing an unsaved theme.")}</p>
          )}
          {saveControls("branding", "Save appearance")}
        </form>

        <form onSubmit={(event) => handleSubmit(event, "loyalty")}
          className="border p-5 sm:p-7"
          style={cardStyle}
        >
          <SectionHeader
              theme={theme}
            icon={Gift}
            title={t("Loyalty program")}
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
              label={t("Reward name")}
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
                placeholder={terminology.defaultRewardName}
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
                placeholder="Describe what members can redeem and any restrictions."
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
                placeholder={`One ${terminology.loyaltyUnitSingular} per ${terminology.qualifyingAction}.`}
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
                    {previewTarget} {previewTarget === 1 ? terminology.loyaltyUnitSingular : terminology.loyaltyUnitPlural} to earn:
                  </p>

                  <p
                    className="mt-1 font-semibold"
                    style={{
                      color: theme.accent,
                    }}
                  >
                    {form.rewardName ||
                      t("Your reward")}
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 sm:p-4"
            style={{ borderColor: theme.border, backgroundColor: theme.surfaceRaised }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Saved Wallet cards</p>
              <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                Use this if Apple or Google Wallet still shows an old reward.
              </p>
            </div>
            <button type="button" onClick={() => void refreshSavedWalletCards()}
              disabled={refreshingWallet || Boolean(saving)}
              className="flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50"
              style={{ borderColor: theme.border, color: theme.textPrimary }}>
              {refreshingWallet ? <Loader2 size={16} className="motion-safe:animate-spin" /> : <RotateCcw size={16} />}
              {refreshingWallet ? "Refreshing…" : "Refresh Wallet cards"}
            </button>
            {walletRefreshMessage && <p className="w-full text-xs" role="status"
              style={{ color: theme.textSecondary }}>{walletRefreshMessage}</p>}
          </div>
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
            description="Customers can choose to open your Google review link after joining."
          />

          <div className="mt-7">
            <Field
              theme={theme}
              label="Google review URL"
              description={`Paste the direct Google review link for this ${
                terminology.businessSingular
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
      </div>
    </div>
  );
}

export function AccountSubscriptionSettings() {
  const { cafe, theme, accountEmail } = useCafeTheme();
  return (
    <section
      className="border p-5 sm:p-7"
      style={{ borderColor: theme.border, backgroundColor: theme.surface, borderRadius: theme.radiusLarge }}
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
  );
}

type ThemedComponentProps = {
  theme: CafeThemeConfig;
};

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
