"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
} from "lucide-react";

type PasswordSectionProps = {
  cafeId: string;
  ownerEmail: string | null;
};

const passwordRules = [
  "At least 8 characters",
  "One uppercase letter",
  "One lowercase letter",
  "One number",
];

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
}

export default function PasswordSection({
  cafeId,
  ownerEmail,
}: PasswordSectionProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function changePassword() {
    if (!isStrongPassword(newPassword)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/studio/cafes/${cafeId}/password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword, confirmPassword }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to change password.");
      }

      setNewPassword("");
      setConfirmPassword("");
      setSuccess(
        "Password changed. The café owner has been signed out everywhere."
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-black/[0.07] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-gradient-to-br from-white to-[#E4E6EA] text-[#4E5055] shadow-sm">
          <KeyRound size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[#171719]">
            Change owner password
          </h2>
          <p className="mt-1 text-sm text-[#77777E]">
            Set a temporary password for {ownerEmail ?? "this café owner"}.
            Existing sessions will be signed out.
          </p>

          {ownerEmail ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                disabled={saving}
              />
              <PasswordInput
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                disabled={saving}
              />

              <div className="sm:col-span-2">
                <div className="grid gap-1 text-xs text-[#77777E] sm:grid-cols-2">
                  {passwordRules.map((rule) => (
                    <span key={rule}>• {rule}</span>
                  ))}
                </div>

                {error && (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 size={17} />
                    {success}
                  </p>
                )}

                <button
                  type="button"
                  onClick={changePassword}
                  disabled={saving || !newPassword || !confirmPassword}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] px-5 text-sm font-semibold text-white transition hover:bg-[#343438] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <KeyRound size={17} />
                  )}
                  {saving ? "Changing..." : "Change password"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This café does not have an owner login account.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#45454A]">
        {label}
      </span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          disabled={disabled}
          className="h-12 w-full rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 pr-12 text-sm text-[#171719] outline-none transition focus:border-black/25 focus:ring-4 focus:ring-black/[0.04] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#77777E] transition hover:text-[#171719]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
