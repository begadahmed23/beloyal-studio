"use client";

import { useState } from "react";
import {
  AlertCircle,
  Plus,
  UserPlus,
  X,
} from "lucide-react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

export default function NewCustomerDialog() {
  const { theme, cafe } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const personLabel = isBarbershop ? "client" : "member";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setPhone("");
    setInstagram("");
    setBirthday("");
    setError("");
  }

  async function createMember() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanInstagram = instagram
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();

    setError("");

    if (!cleanName || !birthday) {
      setError("Please enter the name and birthday.");
      return;
    }

    if (!cleanPhone && !cleanInstagram) {
      setError(
        "Please enter a phone number or Instagram username."
      );
      return;
    }

    if (cleanPhone && !/^\d{11}$/.test(cleanPhone)) {
      setError(
        "Phone number must contain exactly 11 digits."
      );
      return;
    }

    if (
      cleanInstagram &&
      !/^[a-z0-9._]{1,30}$/.test(cleanInstagram)
    ) {
      setError(
        "Please enter a valid Instagram username."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          ...(cleanPhone ? { phone: cleanPhone } : {}),
          ...(cleanInstagram
            ? { instagram: cleanInstagram }
            : {}),
          birthday,
        }),
      });

      const responseText = await response.text();

      let data: { message?: string } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to create ${personLabel}.`
        );
      }

      resetForm();
      setOpen(false);

      window.dispatchEvent(
        new Event("members-updated")
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : `Something went wrong while creating the ${personLabel}.`
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    color: theme.textPrimary,
    borderRadius: theme.radiusMedium,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="flex h-11 w-full touch-manipulation items-center justify-center gap-2 px-5 text-sm font-semibold transition duration-150 active:scale-[0.98] hover:opacity-90 sm:w-auto"
        style={{
          backgroundColor: theme.accent,
          color: theme.buttonText,
          borderRadius: theme.radiusMedium,
        }}
      >
        <Plus size={18} />
        New {isBarbershop ? "Client" : "Member"}
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (loading) {
            return;
          }

          setOpen(nextOpen);

          if (!nextOpen) {
            resetForm();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="fixed bottom-2 left-2 top-auto z-50 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
          }}
        >
          <div
            className="shrink-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-5"
            style={{
              background: `linear-gradient(145deg, ${theme.accentSoft}, ${theme.surface} 72%)`,
            }}
          >
            <div
              className="mx-auto mb-3 h-1 w-9 rounded-full opacity-70 sm:hidden"
              style={{ backgroundColor: theme.textMuted }}
            />

            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.buttonText,
                      boxShadow: `0 10px 24px ${theme.accent}28`,
                    }}
                  >
                    <UserPlus size={18} />
                  </div>

                  <div className="min-w-0 text-left">
                    <DialogTitle
                      className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl"
                      style={{ color: theme.textPrimary }}
                    >
                      New {personLabel}
                    </DialogTitle>
                    <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                      Add them to {cafe.name}&apos;s loyalty program.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                  disabled={loading}
                  aria-label={`Close new ${personLabel} dialog`}
                  className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border transition duration-150 active:scale-95 hover:opacity-80 disabled:opacity-50"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.textSecondary,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            {error && (
              <div
                className="flex items-start gap-3 border px-4 py-3 text-sm"
                style={{
                  borderColor: `${theme.danger}45`,
                  backgroundColor: `${theme.danger}12`,
                  color: theme.danger,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p>{error}</p>
              </div>
            )}

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{
                  color: theme.textSecondary,
                }}
              >
                Full name
              </label>

              <Input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Ahmed Mohamed"
                autoComplete="name"
                disabled={loading}
                className="h-12 border text-base outline-none placeholder:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{
                  color: theme.textSecondary,
                }}
              >
                Phone number{" "}
                <span style={{ color: theme.textMuted }}>
                  (optional)
                </span>
              </label>

              <Input
                value={phone}
                onChange={(event) => {
                  const digits = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 11);

                  setPhone(digits);

                  if (error) {
                    setError("");
                  }
                }}
                inputMode="numeric"
                maxLength={11}
                placeholder="01012345678"
                autoComplete="tel"
                disabled={loading}
                className="h-12 border text-base outline-none placeholder:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={inputStyle}
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <p
                  className="text-xs"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  Use phone or Instagram. Phone must contain exactly 11 digits.
                </p>

                <p
                  className="text-xs tabular-nums"
                  style={{
                    color:
                      phone.length === 11
                        ? theme.success
                        : theme.textMuted,
                  }}
                >
                  {phone.length}/11
                </p>
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{
                  color: theme.textSecondary,
                }}
              >
                Instagram{" "}
                <span style={{ color: theme.textMuted }}>
                  (optional)
                </span>
              </label>

              <Input
                value={instagram}
                onChange={(event) => {
                  setInstagram(
                    event.target.value
                      .replace(/^@+/, "")
                      .slice(0, 30),
                  );

                  if (error) {
                    setError("");
                  }
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="@username"
                disabled={loading}
                className="h-12 border text-base outline-none placeholder:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={inputStyle}
              />

              <p
                className="mt-2 text-xs"
                style={{
                  color: theme.textMuted,
                }}
              >
                You only need one contact method: phone or Instagram.
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{
                  color: theme.textSecondary,
                }}
              >
                Birthday
              </label>

              <Input
                type="date"
                value={birthday}
                onChange={(event) => {
                  setBirthday(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                disabled={loading}
                className="h-12 border text-base outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                style={inputStyle}
              />
            </div>

          </div>

          <div
            className="shrink-0 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5"
            style={{
              backgroundColor: theme.surface,
              boxShadow: `0 -12px 28px ${theme.surface}F2`,
            }}
          >
            <button
              type="button"
              onClick={createMember}
              disabled={loading}
              className="flex h-12 w-full touch-manipulation items-center justify-center gap-2 text-sm font-semibold transition duration-150 active:scale-[0.98] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: theme.accent,
                color: theme.buttonText,
                borderRadius: theme.radiusMedium,
                boxShadow: `0 10px 24px ${theme.accent}24`,
              }}
            >
              <UserPlus size={17} />
              {loading
                ? "Creating..."
                : `Create ${isBarbershop ? "Client" : "Member"}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
