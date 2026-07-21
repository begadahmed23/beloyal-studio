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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handlePhoneChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
    setPhone(digitsOnly);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (cleanPhone.length !== 11) {
      setError("Please enter a valid 11-digit phone number.");
      return;
    }

    if (!birthday) {
      setError("Please select your birthday.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/join/${cafeSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          birthday,
        }),
      });

      const data = (await response.json()) as JoinResponse;

      if (!response.ok || !data.token) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.push(`/card/${data.token}`);
    } catch (requestError) {
      console.error("Join request failed:", requestError);
      setError(
        "We could not connect to the server. Please check your internet connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "h-14 w-full rounded-2xl border bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:bg-white/[0.09]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          onChange={(event) => handlePhoneChange(event.target.value)}
          autoComplete="tel"
          inputMode="numeric"
          enterKeyHint="next"
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
          onChange={(event) => setBirthday(event.target.value)}
          autoComplete="bday"
          required
          className={`${inputClassName} [color-scheme:dark]`}
          style={{
            borderColor: `${secondaryColor}35`,
          }}
        />

        <p className="mt-2 text-xs text-white/40">
          Your birthday helps {cafeName} send you birthday rewards.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
          <p className="text-sm leading-5 text-red-200">{error}</p>
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
        {isSubmitting ? "Creating your card..." : "Create my loyalty card"}
      </button>

      <div
        className="rounded-2xl border px-4 py-4"
        style={{
          borderColor: `${secondaryColor}20`,
          backgroundColor: `${primaryColor}0D`,
        }}
      >
        <p className="text-center text-sm leading-6 text-white/55">
          Collect {rewardTarget} stamps to receive{" "}
          <span className="font-medium text-white">{rewardName}</span>.
        </p>
      </div>

      <p className="text-center text-xs leading-5 text-white/35">
        By joining, you agree that {cafeName} may store your loyalty membership
        information.
      </p>
    </form>
  );
}