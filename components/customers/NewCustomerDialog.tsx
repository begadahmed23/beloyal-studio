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
  const { theme } = useCafeTheme();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setPhone("");
    setBirthday("");
    setError("");
  }

  async function createMember() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    setError("");

    if (!cleanName || !cleanPhone || !birthday) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{11}$/.test(cleanPhone)) {
      setError(
        "Phone number must contain exactly 11 digits."
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
          phone: cleanPhone,
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
          data.message || "Failed to create member."
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
          : "Something went wrong while creating the member."
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
        className="flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition hover:opacity-90"
        style={{
          backgroundColor: theme.accent,
          color: theme.buttonText,
          borderRadius: theme.radiusMedium,
        }}
      >
        <Plus size={18} />
        New Member
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
          className="border p-0 shadow-2xl sm:max-w-md"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            borderRadius: theme.radiusLarge,
          }}
        >
          <div
            className="border-b px-6 py-5"
            style={{
              borderColor: theme.border,
            }}
          >
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
                New member
              </DialogTitle>

              <p
                className="mt-1 text-sm"
                style={{
                  color: theme.textMuted,
                }}
              >
                Create a loyalty account for a customer.
              </p>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 pb-6 pt-5">
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
                className="h-12 border outline-none placeholder:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                Phone number
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
                className="h-12 border outline-none placeholder:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={inputStyle}
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <p
                  className="text-xs"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  Must contain exactly 11 digits.
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
                className="h-12 border outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                style={inputStyle}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="h-12 flex-1 border text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="h-12 flex-1 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.buttonText,
                  borderRadius: theme.radiusMedium,
                }}
              >
                {loading
                  ? "Creating..."
                  : "Create Member"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}