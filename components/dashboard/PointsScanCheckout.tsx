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
  rewards: { id: string; name: string; cost: string; locations: { locationId: string }[] }[];
  rate: string;
  claim?: { rewardId: string; expiresAt: string; now: string };
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
  const [choice, setChoice] = useState("");
  const [claimExpired, setClaimExpired] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitted = useRef<{ payload: string; id: string } | null>(null);
  const working = useRef(false);
  const token = scan?.kind === "member" ? scan.token : undefined;
  const claimCode = scan?.kind === "reward" ? scan.code : undefined;
  const legacyCode = scan?.kind === "legacy-reward";
  useEffect(() => {
    if (!token && !memberId && !claimCode) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ checkout: "1" });
    if (memberId) params.set("customer", memberId);
    if (token) params.set("search", `BL:${token}`);
    let expiry: ReturnType<typeof setTimeout> | undefined;
    fetch(`/api/loyalty/points?${params}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: claimCode ? { "X-Reward-Code": claimCode } : undefined,
    })
      .then(async response => {
        const body: CheckoutData & { message?: string } = await response.json();
        if (!response.ok) throw new Error(body.message);
        if (controller.signal.aborted) return;
        if (body.claim) {
          expiry = setTimeout(() => setClaimExpired(true), Math.max(0,
            Date.parse(body.claim.expiresAt) - Date.parse(body.claim.now)));
        }
        setData(body);
      }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => { controller.abort(); clearTimeout(expiry); };
  }, [memberId, token, claimCode]);

  const member = data?.members[0];
  const locationId = branch || data?.locations[0]?.id || "";
  const rewards = data?.rewards.filter(item =>
    item.locations.some(itemLocation => itemLocation.locationId === locationId)) ?? [];
  const rewardId = data?.claim?.rewardId ?? choice;
  const selected = rewards.find(item => item.id === rewardId);
  const redeem = Boolean(claimCode) || Boolean(choice);
  const affordable = selected && !!member && Number(selected.cost) <= Number(member.pointsBalance);

  async function submit(amount: string) {
    if (working.current || claimExpired || !member || !locationId || (redeem && !affordable)) return;
    working.current = true;
    setBusy(true);
    setError("");
    const details = {
      customerId: member.id, locationId,
      ...(redeem ? { kind: "REDEMPTION", rewardId, ...(claimCode && { claimCode }) }
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
      onCancel={onCancel} onConfirm={() => undefined} submitting={busy} error={error || (legacyCode && copy("Ask the customer to reopen the reward for a fresh code.", "اطلب من العميل يفتح المكافأة مرة تانية عشان يطلع كود جديد."))
        || (claimExpired && copy("The reward code expired. Ask for a fresh code.", "انتهت صلاحية الكود. اطلب من العميل كود جديد."))
        || unavailable || undefined}
      checkout={{
        title: redeem ? copy("Redeem reward", "استبدال المكافأة") : copy("Record purchase", "تسجيل الشراء"),
        description: member ? `${member.name} · ${member.pointsBalance} ${unit}` : copy("Checking membership…", "جارٍ التحقق من العضوية…"),
        action: redeem ? copy("Confirm redemption", "تأكيد الاستبدال") : copy("Confirm purchase", "تأكيد الشراء"),
        unit, requiresAmount: !redeem, allowed: !claimExpired && !!member && !!locationId && (!redeem || !!affordable),
        rate: data?.rate, onConfirm: amount => void submit(amount),
        controls: member && <div className="mb-4 space-y-3">
          {data && data.locations.length > 1 && <label className="block text-sm">{copy("Branch", "الفرع")}
            <select className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base" value={locationId} onChange={event => setBranch(event.target.value)} disabled={busy}>
              {data.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>}
          {claimCode && selected && <p className="wrap-anywhere rounded-xl border border-border px-3 py-2 font-semibold">{selected.name} · {selected.cost} {unit}</p>}
          {!claimCode && (rewards.length > 0 || redeem) && <label className="block text-sm">{copy("Checkout action", "نوع العملية")}
            <select className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base" value={choice} onChange={event => setChoice(event.target.value)} disabled={busy}>
              <option value="">{copy("Record a purchase", "تسجيل شراء")}</option>
              {redeem && !selected && <option value={choice}>{copy("Requested reward", "المكافأة المطلوبة")}</option>}
              {rewards.map(item => <option key={item.id} value={item.id}>{item.name} · {item.cost} {unit}</option>)}
            </select>
          </label>}
          {!redeem && <label className="block text-sm">{copy("Receipt reference (optional)", "رقم الإيصال (اختياري)")}
            <input className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base" value={receipt} onChange={event => setReceipt(event.target.value)} maxLength={80} disabled={busy} />
          </label>}
        </div>,
      }}
    />
  );
}
