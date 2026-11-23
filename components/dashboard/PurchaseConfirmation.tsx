"use client";
import { useId, useState } from "react";
import { Stamp } from "lucide-react";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { ActionButton } from "@/components/ui/action-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { onConfirm: (amount: number | null) => void; onCancel: () => void; submitting?: boolean; error?: string };

export default function PurchaseConfirmation({ onConfirm, onCancel, submitting = false, error }: Props) {
  const { t } = useBeLoyalLanguage();
  const { cafe } = useCafeTheme();
  const isBarber = cafe.businessType === "BARBERSHOP";
  const fieldId = useId();
  const [amount, setAmount] = useState("");
  const normalized = amount.trim()
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - "٠".charCodeAt(0)))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - "۰".charCodeAt(0)))
    .replace("٫", ".");
  const valid = normalized === "" || (/^\d+(?:\.\d{1,2})?$/.test(normalized) && Number(normalized) <= 9999999999.99);
  return (
    <Dialog open onOpenChange={open => { if (!open && !submitting) onCancel(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain border" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t(isBarber ? "Confirm client visit" : "Confirm customer stamp")}</DialogTitle>
          <DialogDescription>{t("Enter the purchase amount if you have it.")}</DialogDescription>
        </DialogHeader>
        <form className="min-w-0" onSubmit={event => {
          event.preventDefault();
          if (valid && !submitting) onConfirm(normalized === "" ? null : Number(normalized));
        }}>
          <label htmlFor={fieldId} className="block text-sm font-medium">{t("Purchase amount (EGP)")}</label>
          <input id={fieldId} inputMode="decimal" enterKeyHint="done" value={amount} onChange={event => setAmount(event.target.value)}
            disabled={submitting} aria-invalid={!valid} placeholder={t("Optional, e.g. 250")}
            className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" />
          {!valid && <p role="alert" className="mt-2 text-xs text-destructive">{t("Enter a valid amount with up to 2 decimal places.")}</p>}
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{t(error)}</p>}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={submitting} onClick={onCancel} className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium">{t("Cancel")}</button>
            <ActionButton type="submit" pending={submitting} disabled={!valid} icon={<Stamp size={16} />}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {t(isBarber ? (normalized ? "Confirm & record visit" : "Record visit without amount") : (normalized ? "Confirm & add stamp" : "Add stamp without amount"))}
            </ActionButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
