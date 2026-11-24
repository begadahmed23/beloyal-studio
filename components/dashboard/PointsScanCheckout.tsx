"use client";

import { useEffect, useRef, useState } from "react";
import PurchaseConfirmation from "./PurchaseConfirmation";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { fireyNashBrand } from "@/lib/business/points";
import { parseLoyaltyScan } from "@/lib/business/loyalty-scan";

type CheckoutData = {
  members: { id: string; name: string; pointsBalance: string }[];
  locations: { id: string; name: string }[];
  rewards: { id: string; name: string; cost: string; enabled: boolean; expiresAt: string | null; locations: { locationId: string }[] }[];
  rate: string;
};

export type PointsScanResult = { name: string; balance: string; redeemed: boolean };

export default function PointsScanCheckout({ value, memberId, onCancel, onComplete }: {
  value?: string;
  memberId?: string;
  onCancel: () => void;
  onComplete: (result: PointsScanResult) => void;
}) {
  const { cafe } = useCafeTheme();
  const { arabic } = useBeLoyalLanguage();
  const copy = (english: string, translated: string) => arabic ? translated : english;
  const unit = cafe.slug === fireyNashBrand.slug ? copy("flames", "لهب") : copy("points", "نقطة");
  const scan = value ? parseLoyaltyScan(value) : null;
  const [data, setData] = useState<CheckoutData | null>(null);
  const [branch, setBranch] = useState("");
  const [choice, setChoice] = useState(scan?.rewardId ?? "");
  const [receipt, setReceipt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitted = useRef<{ payload: string; id: string } | null>(null);
  const working = useRef(false);
  const token = scan?.token;
  useEffect(() => {
    if (!token && !memberId) return;
    const controller = new AbortController();
    fetch(`/api/loyalty/points?checkout=1&${memberId ? `customer=${encodeURIComponent(memberId)}` : `search=BL:${token}`}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        setData(body);
      }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [memberId, token]);

  const member = data?.members[0];
  const locationId = branch || data?.locations[0]?.id || "";
  const rewards = data?.rewards.filter(item =>
    item.enabled && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()) &&
    item.locations.some(itemLocation => itemLocation.locationId === locationId)) ?? [];
  const selected = rewards.find(item => item.id === choice);
  const redeem = Boolean(choice);
  const affordable = selected && !!member && Number(selected.cost) <= Number(member.pointsBalance);

  async function submit(amount: string) {
    if (working.current || !member || !locationId || (redeem && !affordable)) return;
    working.current = true;
    setBusy(true);
    setError("");
    const details = {
      customerId: member.id, locationId,
      ...(redeem ? { kind: "REDEMPTION", rewardId: choice }
        : { kind: "PURCHASE", amount, ...(receipt.trim() && { receipt: receipt.trim() }) }),
    };
    const payload = JSON.stringify(details);
    if (submitted.current?.payload !== payload) submitted.current = { payload, id: crypto.randomUUID() };
    try {
      const response = await fetch("/api/loyalty/points", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, requestId: submitted.current.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      onComplete({ name: member.name, balance: result.balance, redeemed: redeem });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy("Checkout failed.", "تعذّر إتمام العملية."));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  const unavailable = data && (!member ? copy("Member not found.", "العضو غير موجود.") :
    !locationId ? copy("No checkout branch is assigned.", "مفيش فرع متعيّن للكاشير.") :
    redeem && !selected ? copy("This reward is unavailable at this branch.", "المكافأة مش متاحة في الفرع ده.") :
    redeem && !affordable ? copy("The member’s balance is too low for this reward.", "رصيد العضو مش كفاية للمكافأة.") : "");
  return (
    <PurchaseConfirmation
      onCancel={onCancel} onConfirm={() => undefined} submitting={busy} error={error || unavailable || undefined}
      checkout={{
        title: redeem ? copy("Redeem reward", "استبدال المكافأة") : copy("Record purchase", "تسجيل الشراء"),
        description: member ? `${member.name} · ${member.pointsBalance} ${unit}` : copy("Checking membership…", "جارٍ التحقق من العضوية…"),
        action: redeem ? copy("Confirm redemption", "تأكيد الاستبدال") : copy("Confirm purchase", "تأكيد الشراء"),
        unit, requiresAmount: !redeem, allowed: !!member && !!locationId && (!redeem || !!affordable),
        rate: data?.rate, onConfirm: amount => void submit(amount),
        controls: member && <div className="mb-4 space-y-3">
          {data && data.locations.length > 1 && <label className="block text-sm">{copy("Branch", "الفرع")}
            <select className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3" value={locationId} onChange={event => setBranch(event.target.value)} disabled={busy}>
              {data.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>}
          {(rewards.length > 0 || redeem) && <label className="block text-sm">{copy("Checkout action", "نوع العملية")}
            <select className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3" value={choice} onChange={event => setChoice(event.target.value)} disabled={busy}>
              <option value="">{copy("Record a purchase", "تسجيل شراء")}</option>
              {redeem && !selected && <option value={choice}>{copy("Requested reward", "المكافأة المطلوبة")}</option>}
              {rewards.map(item => <option key={item.id} value={item.id}>{item.name} · {item.cost} {unit}</option>)}
            </select>
          </label>}
          {!redeem && <label className="block text-sm">{copy("Receipt reference (optional)", "رقم الإيصال (اختياري)")}
            <input className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3" value={receipt} onChange={event => setReceipt(event.target.value)} maxLength={80} disabled={busy} />
          </label>}
        </div>,
      }}
    />
  );
}
