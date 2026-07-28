"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type JoinFormProps = {
  cafeSlug: string;
  cafeName: string;
  primaryColor: string;
  secondaryColor: string;
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
  primaryColor,
  secondaryColor,
  rewardTarget,
  rewardName,
}: JoinFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<FormMode>("join");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 11) {
      setError("Please enter a valid 11-digit phone number.");
      return;
    }

    const requestBody: {
      action: FormMode;
      phone: string;
      name?: string;
      birthday?: string;
    } = {
      action: mode,
      phone: cleanPhone,
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
          data.error || "Something went wrong. Please try again.",
        );
        return;
      }

      const welcomeQuery =
        mode === "join" && !data.existingCustomer
          ? "?welcome=1"
          : "";

      router.push(`/card/${data.token}${welcomeQuery}`);
    } catch (requestError) {
      console.error("Loyalty card request failed:", requestError);

      setError(
        "We could not connect to the server. Please check your internet connection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "h-14 w-full rounded-2xl border bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:bg-white/[0.09]";

  return (
    <div>
      <div
        className="grid grid-cols-2 rounded-2xl border p-1"
        style={{
          borderColor: `${secondaryColor}25`,
          backgroundColor: `${primaryColor}0D`,
        }}
      >
        <button
          type="button"
          onClick={() => changeMode("join")}
          className="min-h-12 rounded-xl px-3 text-sm font-semibold transition"
          style={{
            background:
              mode === "join"
                ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                : "transparent",
            color:
              mode === "join"
                ? "#ffffff"
                : "rgba(255,255,255,0.55)",
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
                ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                : "transparent",
            color:
              mode === "recover"
                ? "#ffffff"
                : "rgba(255,255,255,0.55)",
          }}
        >
          I have a card
        </button>
      </div>

      <div className="mb-6 mt-5">
        <h2 className="text-lg font-semibold text-white">
          {mode === "join"
            ? "Create your loyalty card"
            : "Open your existing card"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-white/45">
          {mode === "join"
            ? `Join ${cafeName} and start collecting stamps.`
            : "Enter the phone number used when you created your card."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-name"
              className="mb-2 block text-sm font-medium text-white/75"
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
              style={{
                borderColor: `${secondaryColor}35`,
              }}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="customer-phone"
            className="mb-2 block text-sm font-medium text-white/75"
          >
            Phone number
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
            enterKeyHint={mode === "recover" ? "go" : "next"}
            placeholder="01XXXXXXXXX"
            minLength={11}
            maxLength={11}
            required
            className={inputClassName}
            style={{
              borderColor: `${secondaryColor}35`,
            }}
          />

          <p className="mt-2 text-xs text-white/40">
            Enter your 11-digit Egyptian phone number.
          </p>
        </div>

        {mode === "join" && (
          <div>
            <label
              htmlFor="customer-birthday"
              className="mb-2 block text-sm font-medium text-white/75"
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
              className={`${inputClassName} [color-scheme:dark]`}
              style={{
                borderColor: `${secondaryColor}35`,
              }}
            />

            <p className="mt-2 text-xs text-white/40">
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
          className="flex h-14 w-full items-center justify-center rounded-2xl px-5 text-base font-semibold text-white transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 14px 35px ${primaryColor}30`,
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
                borderColor: `${secondaryColor}20`,
                backgroundColor: `${primaryColor}0D`,
              }}
            >
              <p className="text-center text-sm leading-6 text-white/55">
                Collect {rewardTarget} stamps to receive{" "}
                <span className="font-medium text-white">
                  {rewardName}
                </span>
                .
              </p>
            </div>

            <p className="text-center text-xs leading-5 text-white/35">
              By joining, you agree that {cafeName} may store your
              loyalty membership information.
            </p>
          </>
        ) : (
          <p className="text-center text-xs leading-5 text-white/35">
            Your phone number is only used to locate your existing
            {` ${cafeName} `}loyalty card.
          </p>
        )}
      </form>
    </div>
  );
}