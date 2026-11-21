"use client";
import { useState } from "react";

type Props = { onConfirm: (amount: number | null) => void; onCancel: () => void; submitting?: boolean };
export default function PurchaseConfirmation({ onConfirm, onCancel, submitting = false }: Props) {
  const [amount, setAmount] = useState("");
  const valid = amount.trim() === "" || (/^\\d+(?:\\.\\d{1,2})?$/.test(amount) && Number(amount) <= 9999999999.99);
  return (
    <section role="dialog" aria-modal="true" aria-label="Confirm purchase" className="relative z-20 mx-auto mt-5 w-full max-w-md rounded-3xl border bg-white p-6 text-slate-900 shadow-2xl">
      <h3 className="text-xl font-semibold">Confirm customer stamp</h3>
      <p className="mt-2 text-sm text-slate-600">Enter the purchase amount, or skip if it was not recorded.</p>
      <label htmlFor="stamp-purchase-amount" className="mt-5 block text-sm font-medium">Purchase amount (EGP)</label>
      <input id="stamp-purchase-amount" inputMode="decimal" autoFocus value={amount} onChange={e => setAmount(e.target.value)} disabled={submitting} placeholder="Optional e.g. 250" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-3 text-lg focus:outline-none focus:ring-2 focus:ring-slate-500" />
      {!valid && <p role="alert" className="mt-2 text-xs text-red-600">Enter a valid amount with up to 2 decimal places.</p>}
      <button type="button" disabled={!valid || submitting} onClick={() => onConfirm(amount.trim() === "" ? null : Number(amount))} className="mt-5 h-12 w-full rounded-xl bg-slate-900 font-semibold text-white disabled:opacity-40">{submitting ? "Saving..." : amount.trim() === "" ? "Add stamp without amount" : "Confirm & add stamp"}</button>
      <button type="button" disabled={submitting} onClick={onCancel} className="mt-2 h-11 w-full rounded-xl border border-slate-300 text-sm">Cancel scan</button>
    </section>
  );
}
