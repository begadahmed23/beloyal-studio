"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getBusinessTheme,
  type CafeThemeName,
} from "@/lib/cafe-theme";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

type JoinFormProps = {
  cafeSlug: string;
  cafeName: string;
  businessType: "CAFE" | "BARBERSHOP";
  themeName: CafeThemeName;
  primaryColor: string;
  secondaryColor: string;
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
  rewardTarget,
  rewardName,
  isKato = false,
}: JoinFormProps) {
  const router = useRouter();
  const isBarbershop = businessType === "BARBERSHOP";
  const theme = getBusinessTheme(themeName, businessType);
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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(nextMode: FormMode) {
    setMode(nextMode);
    setError("");
  }

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, "").slice(0, 11));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanInstagram = instagram
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();

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

      requestBody.name = cleanName;
      requestBody.birthday = birthday;
    }

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
      setIsSubmitting(false);
    }
  }

  const inputClassName = `h-14 w-full rounded-2xl border px-4 text-base outline-none transition ${
    isKato
      ? isKatoDark
        ? "placeholder:text-white/30"
        : "placeholder:text-[#102B49]/30"
      : themeName === "MODERN_MINIMAL" && isBarbershop
        ? "placeholder:text-black/30"
        : "placeholder:text-white/30"
  }`;
  const inputStyle = {
    borderColor: isKato ? katoBorder : theme.inputBorder,
    backgroundColor: isKato ? katoSurface : theme.inputBackground,
    color: isKato ? katoTextPrimary : theme.textPrimary,
  };

  return (
    <div>
      <div
        className="grid grid-cols-2 rounded-2xl border p-1"
        style={{
          borderColor: isKato ? katoBorder : theme.border,
          backgroundColor: isKato ? katoSurface : theme.surfaceRaised,
        }}
      >
        <button
          type="button"
          onClick={() => changeMode("join")}
          className="min-h-12 rounded-xl px-3 text-sm font-semibold transition"
          style={{
            background:
              mode === "join"
                ? isKato
                  ? katoAccent
                  : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                : "transparent",
            color:
              mode === "join"
                ? isKato
                  ? katoAccentText
                  : theme.buttonText
                : isKato
                  ? katoTextMuted
                  : theme.textMuted,
          }}
        >
          Create a card
        </button>

        <button
          type="button"
          onClick={() => changeMode("recover")}
          className="min-h-12 rounded-xl px-3 text-sm font-semibold transition"
          style={{
            background:
              mode === "recover"
                ? isKato
                  ? katoAccent
                  : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                : "transparent",
            color:
              mode === "recover"
                ? isKato
                  ? katoAccentText
                  : theme.buttonText
                : isKato
                  ? katoTextMuted
                  : theme.textMuted,
          }}
        >
          I have a card
        </button>
      </div>

      <div className="mb-6 mt-5">
        <h2
          className="text-lg font-semibold"
          style={{ color: isKato ? katoTextPrimary : theme.textPrimary }}
        >
          {mode === "join"
            ? "Create your loyalty card"
            : "Open your existing card"}
        </h2>

        <p
          className="mt-1 text-sm leading-6"
          style={{ color: isKato ? katoTextMuted : theme.textMuted }}
        >
          {mode === "join"
            ? `Join ${cafeName} and start collecting ${
                isBarbershop ? "visits" : "stamps"
              }.`
            : "Enter the phone number or Instagram username used when you created your card."}
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
            Phone number <span style={{ color: isKato ? katoTextMuted : theme.textMuted }}>(optional)</span>
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
            enterKeyHint={mode === "recover" ? "go" : "next"}
            placeholder="@username"
            className={inputClassName}
            style={inputStyle}
          />

          <p
            className="mt-2 text-xs"
            style={{ color: isKato ? katoTextMuted : theme.textMuted }}
          >
            You only need one contact method: phone or Instagram.
          </p>
        </div>

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
              className={`${inputClassName} ${
                isKato
                  ? isKatoDark
                    ? "[color-scheme:dark]"
                    : "[color-scheme:light]"
                  : themeName === "MODERN_MINIMAL" && isBarbershop
                    ? "[color-scheme:light]"
                    : "[color-scheme:dark]"
              }`}
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

        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <p className="text-sm leading-5 text-red-200">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center rounded-2xl px-5 text-base font-semibold transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
          {isSubmitting
            ? mode === "join"
              ? "Creating your card..."
              : "Finding your card..."
            : mode === "join"
              ? "Create my loyalty card"
              : "Open my loyalty card"}
        </button>

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
                  ? `Complete ${loyaltyTarget} paid visits to receive `
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

            <p
              className="text-center text-xs leading-5"
              style={{ color: isKato ? katoTextMuted : theme.textMuted }}
            >
              By joining, you agree that {cafeName} may store
              your loyalty membership information.
            </p>
          </>
        ) : (
          <p
            className="text-center text-xs leading-5"
            style={{ color: isKato ? katoTextMuted : theme.textMuted }}
          >
            Your phone number or Instagram username is only used to locate your
            existing {` ${cafeName} `}loyalty card.
          </p>
        )}
      </form>
    </div>
  );
}
