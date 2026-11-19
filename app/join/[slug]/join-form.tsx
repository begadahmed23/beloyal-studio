"use client";
import { phoneDigits } from "@/lib/business/phone-digits";
import LanguageToggle, { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import type { BusinessType } from "@prisma/client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JoinTheme } from "./join-theme";
import { Check, LoaderCircle } from "lucide-react";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

type JoinFormProps = {
  cafeSlug: string;
  cafeName: string;
  businessType: BusinessType;
  theme: JoinTheme;
  rewardTarget: number;
  rewardName: string;
};

type FormMode = "join" | "recover";

type JoinResponse = {
  success?: boolean;
  token?: string;
  existingCustomer?: boolean;
  error?: string;
};

export default function JoinForm({
  cafeSlug,
  cafeName,
  businessType,
  theme,
  rewardTarget,
  rewardName,
}: JoinFormProps) {
  const { t, dir, lang, arabic } = useBeLoyalLanguage();
  const router = useRouter();
  const vapeShop = businessType === "VAPE";
  const isBarbershop = businessType === "BARBERSHOP";
  const loyaltyTarget = getLoyaltyProgressTarget({
    businessType,
    rewardTarget,
  });
  const [mode, setMode] = useState<FormMode>("join");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [birthday, setBirthday] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState("");
  const [showConsentError, setShowConsentError] = useState(false);
  const consentAlert = useRef<HTMLDivElement>(null);
  const consentError =
    mode === "join" && showConsentError && (!privacyAccepted || !marketingConsent)
      ? !privacyAccepted && !marketingConsent
        ? t("Check both boxes to create your card.")
        : !privacyAccepted
          ? t("Check the membership box to create your card.")
          : t("Check the offers box to create your card.")
      : "";

  useEffect(() => {
    if (consentError) consentAlert.current?.scrollIntoView({ block: "nearest" });
  }, [consentError]);

  function handleConsentInvalid(event: FormEvent<HTMLInputElement>) {
    event.preventDefault();
    setShowConsentError(true);
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const formBusy = isSubmitting || cardReady;
  const submitting = useRef(false);

  function changeMode(nextMode: FormMode) {
    setMode(nextMode);
    setShowConsentError(false);
    setError("");
  }

  function handlePhoneChange(value: string) {
    setPhone(phoneDigits(value).slice(0, 11));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (submitting.current || cardReady) return;
    setError("");

    const cleanPhone = phoneDigits(phone);
    const cleanInstagram = mode === "join" ? instagram.trim().replace(/^@+/, "").toLowerCase() : "";

    if (mode === "recover" && !cleanPhone) {
      setError(t("Enter the phone number you used to create your card."));
      return;
    }

    if (!cleanPhone && !cleanInstagram) {
      setError(t("Please enter your phone number or Instagram username."));
      return;
    }

    if (cleanPhone && cleanPhone.length !== 11) {
      setError(t("Please enter a valid 11-digit phone number."));
      return;
    }

    if (
      cleanInstagram &&
      !/^[a-z0-9._]{1,30}$/.test(cleanInstagram)
    ) {
      setError(t("Please enter a valid Instagram username."));
      return;
    }

    const requestBody: {
      action: FormMode;
      phone?: string;
      instagram?: string;
      name?: string;
      birthday?: string;
      privacyAccepted?: boolean;
      marketingConsent?: boolean;
    } = {
      action: mode,
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      ...(cleanInstagram ? { instagram: cleanInstagram } : {}),
    };

    if (mode === "join") {
      const cleanName = name.trim();

      if (cleanName.length < 2) {
        setError(t("Please enter your full name."));
        return;
      }

      if (!birthday) {
        setError(t("Please select your birthday."));
        return;
      }

      if (!privacyAccepted || !marketingConsent) {
        setShowConsentError(true);
        return;
      }
      requestBody.privacyAccepted = privacyAccepted;
      requestBody.marketingConsent = marketingConsent;
      requestBody.name = cleanName;
      requestBody.birthday = birthday;
    }

    submitting.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/join/${cafeSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as JoinResponse;

      if (!response.ok || !data.token) {
        setError(
          data.error ||
            t("Something went wrong. Please try again."),
        );
        return;
      }

      const welcomeQuery =
        mode === "join" && !data.existingCustomer
          ? "?welcome=1"
          : "";

      setCardReady(true);
      router.push(`/card/${data.token}${welcomeQuery}`);
    } catch (requestError) {
      console.error(
        "Loyalty card request failed:",
        requestError,
      );

      setError(
        t("We could not connect to the server. Please check your internet connection."),
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  const inputClassName = `h-14 w-full rounded-2xl border px-4 text-base outline-none transition ${
    theme.light ? "placeholder:text-black/40" : "placeholder:text-white/40"
  }`;
  const inputStyle = {
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    color: theme.textPrimary,
  };

  return (
    <div lang={lang} dir={dir}>
      <div className="mb-3 flex justify-end"><LanguageToggle /></div>
      <div
        className="grid grid-cols-2 rounded-2xl border p-1"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surfaceRaised,
        }}
      >
        <button
          type="button"
          disabled={formBusy}
          aria-pressed={mode === "join"}
          onClick={() => changeMode("join")}
          className="min-h-12 rounded-xl px-3 text-sm font-semibold transition"
          style={{
            background:
              mode === "join"
                ? theme.primary
                : "transparent",
            color:
              mode === "join"
                ? theme.buttonText : theme.textMuted,
          }}
        >{t("Create a card")}</button>

        <button
          type="button"
          disabled={formBusy}
          aria-pressed={mode === "recover"}
          onClick={() => changeMode("recover")}
          className="min-h-12 rounded-xl px-3 text-sm font-semibold transition"
          style={{
            background:
              mode === "recover"
                ? theme.primary
                : "transparent",
            color:
              mode === "recover"
                ? theme.buttonText : theme.textMuted,
          }}
        >{t("I have a card")}</button>
      </div>

      <div className="mb-6 mt-5">
        <h1
          className="text-lg font-semibold"
          style={{ color: theme.textPrimary }}
        >
          {mode === "join"
            ? t("Create your loyalty card")
            : t("Open your existing card")}
        </h1>

        <p
          className="mt-1 text-sm leading-6"
          style={{ color: theme.textMuted }}
        >
          {mode === "join"
            ? arabic
              ? <>انضم لـ <bdi>{cafeName}</bdi> وابدأ {isBarbershop ? "تسجيل زياراتك" : "تجميع الأختام"}.</>
              : `Join ${cafeName} and start collecting ${isBarbershop ? "visits" : "stamps"}.`
            : t("Enter the phone number you used to create your card.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-name"
              className="mb-2 block text-sm font-medium"
              style={{ color: theme.textSecondary }}
            >{t("Full name")}</label>

            <input
              id="customer-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              enterKeyHint="next"
              placeholder={t("Your full name")}
              maxLength={80}
              required
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="customer-phone"
            className="mb-2 block text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >{t("Phone number")}{mode === "join" && <span style={{ color: theme.textMuted }}>{" " + t("(optional)")}</span>}
          </label>

          <input
            id="customer-phone"
            name="phone"
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(event) =>
              handlePhoneChange(event.target.value)
            }
            autoComplete="tel"
            inputMode="numeric"
            enterKeyHint={
              mode === "recover" ? "go" : "next"
            }
            placeholder="01XXXXXXXXX"
            required={mode === "recover"}
            minLength={11}
            maxLength={11}
            className={inputClassName}
            style={inputStyle}
          />

          <p
            className="mt-2 text-xs"
            style={{ color: theme.textMuted }}
          >{t("Enter your 11-digit Egyptian phone number.")}</p>
        </div>

        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-instagram"
              className="mb-2 block text-sm font-medium"
              style={{ color: theme.textSecondary }}
            >
              Instagram <span style={{ color: theme.textMuted }}>{t("(optional)")}</span>
            </label>

            <input
              id="customer-instagram"
              name="instagram"
              type="text"
              value={instagram}
              onChange={(event) =>
                setInstagram(event.target.value.slice(0, 31))
              }
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="@username"
              dir="ltr"
              className={inputClassName}
              style={inputStyle}
            />

            <p
              className="mt-2 text-xs"
              style={{ color: theme.textMuted }}
            >{t("Phone or Instagram can be used to sign up. Add your phone number to reopen your card later.")}</p>
          </div>
        )}

        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-birthday"
              className="mb-2 block text-sm font-medium"
              style={{ color: theme.textSecondary }}
            >{t("Birthday")}</label>

            <input
              id="customer-birthday"
              name="birthday"
              type="date"
              value={birthday}
              onChange={(event) =>
                setBirthday(event.target.value)
              }
              autoComplete="bday"
              required
              className={`${inputClassName} ${theme.light ? "[color-scheme:light]" : "[color-scheme:dark]"}`}
              style={inputStyle}
            />

            <p
              className="mt-2 text-xs"
              style={{ color: theme.textMuted }}
            >
              {arabic ? <>تاريخ ميلادك بيساعد <bdi>{cafeName}</bdi> يقدّم لك مكافأة عيد الميلاد.</> : <>Your birthday helps {cafeName} provide birthday rewards.</>}
            </p>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-2 text-sm leading-5" style={{ color: theme.textSecondary }}>
            <label className="flex min-h-11 items-start gap-3 py-1.5">
              <input type="checkbox" required checked={privacyAccepted} onChange={event => setPrivacyAccepted(event.target.checked)}
                onInvalid={handleConsentInvalid} aria-invalid={Boolean(consentError) && !privacyAccepted}
                aria-describedby={consentError && !privacyAccepted ? "join-consent-error" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{t("I agree to the") + " "}<a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">{t("Privacy Policy")}</a>{" " + t("and use of my data for loyalty membership.")}</span>
            </label>
            <label className="flex min-h-11 items-start gap-3 py-1.5">
              <input type="checkbox" required checked={marketingConsent} onChange={event => setMarketingConsent(event.target.checked)}
                onInvalid={handleConsentInvalid} aria-invalid={Boolean(consentError) && !marketingConsent}
                aria-describedby={consentError && !marketingConsent ? "join-consent-error" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{arabic ? <>أنا موافق على استلام عروض من <bdi>{cafeName}</bdi>.</> : <>I agree to receive offers from {cafeName}.</>}</span>
            </label>
            {consentError && (
              <div id="join-consent-error" ref={consentAlert} role="alert"
                className={`scroll-m-4 rounded-xl border px-3 py-2.5 text-sm font-medium leading-5 ${theme.light ? "border-rose-200 bg-rose-50 text-rose-900" : "border-rose-300/35 bg-rose-950 text-rose-100"}`}>
                {consentError}
              </div>
            )}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <p className={`text-sm leading-5 ${theme.light ? "text-red-800" : "text-red-200"}`}>
              {t(error)}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={formBusy}
          aria-busy={isSubmitting}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition hover:brightness-110 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: theme.primary,
            color: theme.buttonText,
          }}
        >
          {cardReady ? <Check size={18} aria-hidden /> : isSubmitting ? <LoaderCircle size={18} aria-hidden className="motion-safe:animate-spin" /> : null}
          <span role="status">{cardReady
            ? arabic ? "الكارت جاهز" : "Card ready"
            : isSubmitting
            ? mode === "join"
              ? t("Creating your card...")
              : t("Finding your card...")
            : mode === "join"
              ? t("Agree and create my card")
              : t("Open my loyalty card")}</span>
        </button>

        {mode === "join" ? (
            <div
              className="rounded-2xl border px-4 py-4"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.accentSoft,
              }}
            >
              <p
                className="text-center text-sm leading-6"
                style={{ color: theme.textSecondary }}
              >
                {arabic
                  ? `${isBarbershop ? "سجّل" : "اجمع"} ${loyaltyTarget} ${isBarbershop ? "زيارات مدفوعة" : "أختام"} واستلم المكافأة في زيارتك الجاية `
                  : isBarbershop
                  ? `Complete ${loyaltyTarget} paid visits, then redeem on your next visit: `
                  : vapeShop ? `Collect ${loyaltyTarget} stamps, then redeem on your next visit: `
                    : `Buy ${loyaltyTarget} and get 1 free: `}
                <span
                  className="font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  <bdi>{rewardName}</bdi>
                </span>
                .
              </p>
            </div>

        ) : (
          <p
            className="text-center text-xs leading-5"
            style={{ color: theme.textMuted }}
          >
            {arabic ? <>سجّلت من غير رقم موبايل؟ اطلب رابط الكارت من <bdi>{cafeName}</bdi>.</> : <>Signed up without a phone number? Ask {cafeName} for your card link.</>}
          </p>
        )}
      </form>
    </div>
  );
}
