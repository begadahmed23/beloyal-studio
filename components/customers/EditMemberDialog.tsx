"use client";

import { type FormEvent, useRef, useState } from "react";
import { LoaderCircle, Pencil, Save, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { phoneDigits } from "@/lib/business/phone-digits";
import { isLightColor } from "@/app/card/[token]/card-theme-utils";

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string | null;
  name: string;
  phone: string;
  instagram?: string | null;
  birthday: string;
  stamps: number;
};

type Props = {
  customer: Customer;
  onOpenChange: (open: boolean) => void;
  onUpdated: (customer: Customer) => void;
};

function birthdayToInputValue(birthday: string) {
  const date = new Date(birthday);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

export default function EditMemberDialog({
  customer,
  onOpenChange,
  onUpdated,
}: Props) {
  const { theme } = useCafeTheme();
  const { t, arabic } = useBeLoyalLanguage();
  const submitting = useRef(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [instagram, setInstagram] = useState(customer.instagram ?? "");
  const [birthday, setBirthday] = useState(
    birthdayToInputValue(customer.birthday)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanInstagram = instagram.trim().replace(/^@+/, "").toLowerCase();

    if (!cleanName || !birthday) {
      setError("Please enter the name and birthday.");
      return;
    }

    if (!cleanPhone && !cleanInstagram) {
      setError("Please enter a phone number or Instagram username.");
      return;
    }

    if (cleanPhone && !/^\d{11}$/.test(cleanPhone)) {
      setError("Phone number must contain exactly 11 digits.");
      return;
    }

    if (cleanInstagram && !/^[a-z0-9._]{1,30}$/.test(cleanInstagram)) {
      setError("Please enter a valid Instagram username.");
      return;
    }

    submitting.current = true;
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          instagram: cleanInstagram,
          birthday,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update member.");
      }

      onUpdated(data);
      onOpenChange(false);

      window.dispatchEvent(new Event("members-updated"));
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update member."
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  const fieldClass = "h-12 min-w-0 rounded-xl text-base focus-visible:ring-1";
  const fieldStyle = {
    backgroundColor: theme.inputBackground,
    borderColor: theme.inputBorder,
    color: theme.textPrimary,
    colorScheme: isLightColor(theme.inputBackground) ? "light" : "dark",
  };
  const actionClass = "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold transition-opacity active:opacity-75 disabled:opacity-60";

  return (
    <Dialog open onOpenChange={(nextOpen) => { if (!submitting.current) onOpenChange(nextOpen); }}>
      <DialogContent showCloseButton={false}
        className="fixed left-2 right-2 bottom-2 top-auto flex max-h-[calc(100dvh-1rem)] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-[24px] border p-0 sm:right-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2"
        style={{ boxShadow: theme.cardShadow }}>
        <DialogHeader className="shrink-0 border-b p-4 sm:p-6" style={{ borderColor: theme.border }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-3 inline-flex rounded-xl p-2.5" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>
                <Pencil size={18} aria-hidden />
              </div>
              <DialogTitle className="text-xl font-semibold">{t("Edit member")}</DialogTitle>
              <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>{t("Update the member's personal information.")}</p>
            </div>
            <button type="button" disabled={loading} aria-label={t("Close edit member dialog")}
              className="grid size-11 shrink-0 place-items-center rounded-xl border transition-opacity active:opacity-75 disabled:opacity-60"
              style={{ borderColor: theme.border, color: theme.textSecondary }} onClick={() => onOpenChange(false)}>
              <X size={18} aria-hidden />
            </button>
          </div>
        </DialogHeader>
        <form onSubmit={updateMember} aria-busy={loading} className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <label className="block space-y-2">
            <span className="font-medium">{t("Full name")}</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name"
              dir="auto" maxLength={80} disabled={loading} className={fieldClass} style={fieldStyle} />
          </label>
          <label className="block space-y-2">
            <span className="font-medium">{t("Phone number")} <span style={{ color: theme.textMuted }}>{t("(optional)")}</span></span>
            <Input value={phone} onChange={(event) => setPhone(phoneDigits(event.target.value).slice(0, 11))}
              type="tel" inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="01012345678"
              disabled={loading} className={fieldClass} style={fieldStyle} />
          </label>
          <label className="block space-y-2">
            <span className="font-medium">Instagram <span style={{ color: theme.textMuted }}>{t("(optional)")}</span></span>
            <Input value={instagram} onChange={(event) => setInstagram(event.target.value.replace(/^@+/, "").slice(0, 30))}
              placeholder="@username" autoCapitalize="none" autoCorrect="off" spellCheck={false} dir="ltr"
              disabled={loading} className={fieldClass} style={fieldStyle} />
          </label>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {arabic ? "استخدم رقم الموبايل أو Instagram. رقم الموبايل لازم يكون ١١ رقم." : "Use a phone number or Instagram. The phone number must have 11 digits."}
          </p>
          <label className="block space-y-2">
            <span className="font-medium">{t("Birthday")}</span>
            <Input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} autoComplete="bday"
              disabled={loading} className={fieldClass} style={fieldStyle} />
          </label>
          {error && <p role="alert" className="rounded-xl border px-3 py-2.5" style={{ borderColor: theme.border, color: theme.danger }}>{t(error)}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => onOpenChange(false)} disabled={loading} className={actionClass}
              style={{ borderColor: theme.border, color: theme.textSecondary }}>{t("Cancel")}</button>
            <button type="submit" disabled={loading} className={actionClass}
              style={{ backgroundColor: theme.accent, borderColor: theme.accent, color: theme.buttonText }}>
              {loading ? <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden /> : <Save size={17} aria-hidden />}
              <span aria-live="polite">{t(loading ? "Saving..." : "Save changes")}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
