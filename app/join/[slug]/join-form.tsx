"use client";
import type { BusinessType } from "@prisma/client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { SlidingSelection } from "@/components/ui/sliding-selection";
import { useRouter } from "next/navigation";
import { type CafeThemeName } from "@/lib/cafe-theme";
import { getJoinTheme } from "./join-theme";
import { isMbVape } from "@/lib/business/mb-vape";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

type JoinFormProps = {
  cafeSlug: string;
  cafeName: string;
  businessType: BusinessType;
  themeName: CafeThemeName;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string | null;
  rewardTarget: number;
  rewardName: string;
  isKato?: boolean;
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
  themeName,
  primaryColor,
  secondaryColor,
  backgroundColor,
  rewardTarget,
  rewardName,
  isKato = false,
}: JoinFormProps) {
  const router = useRouter();
  const mbVape = isMbVape({ slug: cafeSlug, businessType });
  const isBarbershop = businessType === "BARBERSHOP";
  const theme = getJoinTheme({
    name: cafeName,
    slug: cafeSlug,
    theme: themeName,
    businessType,
    primaryColor,
    secondaryColor,
    backgroundColor,
  });
  const loyaltyTarget = getLoyaltyProgressTarget({
    businessType,
    rewardTarget,
  });
  const isKatoDark = isKato && themeName === "DARK_LUXURY";
  const katoTextPrimary = isKatoDark ? "#F5F3EC" : "#0A223E";
  const katoTextSecondary = isKatoDark ? "#C1C8CF" : "#43536A";
  const katoTextMuted = isKatoDark ? "#8F9AA6" : "#7F8DA0";
  const katoBorder = isKatoDark
    ? "rgba(233,230,216,0.12)"
    : "rgba(16,43,73,0.12)";
  const katoSurface = isKatoDark ? "#0D2744" : "#F7F9FB";
  const katoAccent = isKatoDark ? "#E9E6D8" : "#102B49";
  const katoAccentText = isKatoDark ? "#0A223E" : "#FFFFFF";

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
        ? "Check both boxes to create your card."
        : !privacyAccepted
          ? "Check the membership box to create your card."
          : "Check the offers box to create your card."
      : "";

  useEffect(() => {
    if (consentError) consentAlert.current?.scrollIntoView({ block: "nearest" });
  }, [consentError]);

  function handleConsentInvalid(event: FormEvent<HTMLInputElement>) {
    event.preventDefault();
    setShowConsentError(true);
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestInFlight = useRef(false);

  function changeMode(nextMode: FormMode) {
    setMode(nextMode);
    setShowConsentError(false);
    setError("");
  }

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, "").slice(0, 11));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (requestInFlight.current) return;
    setError("");

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanInstagram = mode === "join" ? instagram.trim().replace(/^@+/, "").toLowerCase() : "";

    if (mode === "recover" && !cleanPhone) {
      setError("Enter the phone number you used to create your card.");
      return;
    }

    if (!cleanPhone && !cleanInstagram) {
      setError("Please enter your phone number or Instagram username.");
      return;
    }

    if (cleanPhone && cleanPhone.length !== 11) {
      setError("Please enter a valid 11-digit phone number.");
      return;
    }

    if (
      cleanInstagram &&
      !/^[a-z0-9._]{1,30}$/.test(cleanInstagram)
    ) {
      setError("Please enter a valid Instagram username.");
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
        setError("Please enter your full name.");
        return;
      }

      if (!birthday) {
        setError("Please select your birthday.");
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

    requestInFlight.current = true;
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
            "Something went wrong. Please try again.",
        );
        return;
      }

      const welcomeQuery =
        mode === "join" && !data.existingCustomer
          ? "?welcome=1"
          : "";

      router.push(`/card/${data.token}${welcomeQuery}`);
    } catch (requestError) {
      console.error(
        "Loyalty card request failed:",
        requestError,
      );

      setError(
        "We could not connect to the server. Please check your internet connection.",
      );
    } finally {
      requestInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const inputClassName = `h-14 w-full rounded-2xl border px-4 text-base outline-none transition ${
    theme.light ? "placeholder:text-black/40" : "placeholder:text-white/40"
  }`;
  const inputStyle = {
    borderColor: isKato ? katoBorder : theme.inputBorder,
    backgroundColor: isKato ? katoSurface : theme.inputBackground,
    color: isKato ? katoTextPrimary : theme.textPrimary,
  };

  return (
    <div>
      <SlidingSelection
        value={mode}
        role="group"
        aria-label="Loyalty card options"
        indicatorColor={isKato ? katoAccent : theme.accent}
        className="grid grid-cols-2 gap-1 rounded-2xl border p-1"
        style={{
          borderColor: isKato ? katoBorder : theme.border,
          backgroundColor: isKato ? katoSurface : theme.surfaceRaised,
        }}
      >
        {([
          { value: "join", label: "Create a card" },
          { value: "recover", label: "Find my card" },
        ] as const).map((option) => {
          const selected = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isSubmitting}
              aria-pressed={selected}
              data-selection={selected ? "active" : undefined}
              onClick={() => changeMode(option.value)}
              className="min-h-12 rounded-xl px-2 text-sm font-semibold motion-safe:transition-colors"
              style={{ color: selected ? (isKato ? katoAccentText : theme.buttonText) : (isKato ? katoTextMuted : theme.textSecondary) }}
            >
              {option.label}
            </button>
          );
        })}
      </SlidingSelection>

      <div className="mb-6 mt-5">
        <h1
          className="text-lg font-semibold"
          style={{ color: isKato ? katoTextPrimary : theme.textPrimary }}
        >
          {mode === "join"
            ? "Create your loyalty card"
            : "Open your existing card"}
        </h1>

        <p
          className="mt-1 text-sm leading-6"
          style={{ color: isKato ? katoTextMuted : theme.textMuted }}
        >
          {mode === "join"
            ? `Join ${cafeName} and start collecting ${
                isBarbershop ? "visits" : "stamps"
              }.`
            : "Enter the phone number you used to create your card."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-name"
              className="mb-2 block text-sm font-medium"
              style={{ color: isKato ? katoTextSecondary : theme.textSecondary }}
            >
              Full name
            </label>

            <input
              id="customer-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              enterKeyHint="next"
              placeholder="Your full name"
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
            style={{ color: isKato ? katoTextSecondary : theme.textSecondary }}
          >
            Phone number{mode === "join" && <span style={{ color: isKato ? katoTextMuted : theme.textMuted }}> (optional)</span>}
          </label>

          <input
            id="customer-phone"
            name="phone"
            type="tel"
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
            style={{ color: isKato ? katoTextMuted : theme.textMuted }}
          >
            Enter your 11-digit Egyptian phone number.
          </p>
        </div>

        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-instagram"
              className="mb-2 block text-sm font-medium"
              style={{ color: isKato ? katoTextSecondary : theme.textSecondary }}
            >
              Instagram <span style={{ color: isKato ? katoTextMuted : theme.textMuted }}>(optional)</span>
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
              className={inputClassName}
              style={inputStyle}
            />

            <p
              className="mt-2 text-xs"
              style={{ color: isKato ? katoTextMuted : theme.textMuted }}
            >
              Phone or Instagram can be used to sign up. Add your phone number to reopen your card later.
            </p>
          </div>
        )}

        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-birthday"
              className="mb-2 block text-sm font-medium"
              style={{ color: isKato ? katoTextSecondary : theme.textSecondary }}
            >
              Birthday
            </label>

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
              style={{ color: isKato ? katoTextMuted : theme.textMuted }}
            >
              Your birthday helps {cafeName} provide birthday
              rewards.
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
              <span>I agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a> and use of my data for loyalty membership.</span>
            </label>
            <label className="flex min-h-11 items-start gap-3 py-1.5">
              <input type="checkbox" required checked={marketingConsent} onChange={event => setMarketingConsent(event.target.checked)}
                onInvalid={handleConsentInvalid} aria-invalid={Boolean(consentError) && !marketingConsent}
                aria-describedby={consentError && !marketingConsent ? "join-consent-error" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0" />
              <span>I agree to receive offers from {cafeName}.</span>
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
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <p className={`text-sm leading-5 ${theme.light ? "text-red-800" : "text-red-200"}`}>
              {error}
            </p>
          </div>
        )}

        <ActionButton
          type="submit"
          pending={isSubmitting}
          icon={<ArrowRight size={17} />}
          className="flex h-14 w-full items-center justify-center rounded-2xl px-5 text-base font-semibold transition hover:brightness-110 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: isKato
              ? katoAccent
              : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: isKato
              ? isKatoDark
                ? "0 14px 35px rgba(0,0,0,0.24)"
                : "0 14px 35px rgba(16,43,73,0.18)"
              : `0 14px 35px ${primaryColor}30`,
            color: isKato ? katoAccentText : theme.buttonText,
          }}
        >
          {mode === "join" ? "Agree and create my card" : "Open my loyalty card"}
        </ActionButton>
        <p role="status" className="sr-only">
          {isSubmitting ? (mode === "join" ? "Creating your card…" : "Finding your card…") : ""}
        </p>

        {mode === "join" ? (
          <>
            <div
              className="rounded-2xl border px-4 py-4"
              style={{
                borderColor: isKato ? katoBorder : theme.border,
                backgroundColor: isKato ? katoSurface : theme.accentSoft,
              }}
            >
              <p
                className="text-center text-sm leading-6"
                style={{ color: isKato ? katoTextSecondary : theme.textSecondary }}
              >
                {isBarbershop
                  ? `Complete ${loyaltyTarget} paid visits, then redeem on your next visit: `
                  : mbVape ? `Collect ${loyaltyTarget} stamps, then redeem on your next visit: `
                    : `Buy ${loyaltyTarget} and get 1 free: `}
                <span
                  className="font-medium"
                  style={{ color: isKato ? katoTextPrimary : theme.textPrimary }}
                >
                  {rewardName}
                </span>
                .
              </p>
            </div>

          </>
        ) : (
          <p
            className="text-center text-xs leading-5"
            style={{ color: isKato ? katoTextMuted : theme.textMuted }}
          >
            Signed up without a phone number? Ask {cafeName} for your card link.
          </p>
        )}
      </form>
    </div>
  );
}
