"use client";

import { useState } from "react";
import {
  AlertCircle,
  Plus,
  UserPlus,
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
          className="fixed bottom-0 left-0 top-auto z-50 flex max-h-[calc(100dvh-0.5rem)] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-[28px] border p-0 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
          }}
        >
          <div
            className="shrink-0 border-b px-4 pb-4 pt-3 sm:px-6 sm:py-5"
            style={{
              borderColor: theme.border,
            }}
          >
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full sm:hidden"
              style={{
                backgroundColor:
                  theme.border,
              }}
            />

            <DialogHeader>
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accent,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <UserPlus size={19} />
              </div>

              <DialogTitle
                className="text-2xl font-semibold tracking-tight"
                style={{
                  color: theme.textPrimary,
                }}
              >
                New {personLabel}
              </DialogTitle>

              <p
                className="mt-1 text-sm"
                style={{
                  color: theme.textMuted,
                }}
              >
                Create a loyalty account for a {personLabel}.
              </p>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-6">
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

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="h-12 flex-1 touch-manipulation border text-sm font-medium transition duration-150 active:scale-[0.98] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceRaised,
                  color: theme.textSecondary,
                  borderRadius: theme.radiusMedium,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createMember}
                disabled={loading}
                className="h-12 flex-1 touch-manipulation text-sm font-semibold transition duration-150 active:scale-[0.98] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.buttonText,
                  borderRadius: theme.radiusMedium,
                }}
              >
                {loading
                  ? "Creating..."
                  : `Create ${isBarbershop ? "Client" : "Member"}`}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
