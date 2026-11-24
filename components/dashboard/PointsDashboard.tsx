"use client";

import { useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import StoreJoinQRCodes from "./StoreJoinQRCodes";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";
import { earnedPoints, earningRateSchema, normalizePointsInput, purchaseAmountSchema } from "@/lib/business/points";

const CameraScanner = dynamic(() => import("@yudiel/react-qr-scanner").then(module => module.Scanner), { ssr: false });
type Location = { id: string; name: string };
type Member = { id: string; memberNumber: string; name: string; pointsBalance: string; birthday?: string; joinLocation?: { name: string } | null; wallet?: { apple: boolean | null; google: boolean | null } };
type Reward = {
  id: string; name: string; description: string | null; conditions: string | null; cost: string;
  enabled: boolean; expiresAt: string | null; photoUrl: string | null; locations: { locationId: string }[];
};
type LedgerRow = {
  id: string; customerId: string; kind: "PURCHASE" | "REDEMPTION" | "REFUND"; amount: string | null;
  delta: string; createdAt: string; receipt: string | null; rewardName: string | null;
  actorName: string; location: { name: string }; customer: { name: string };
};
type Group = { kind: LedgerRow["kind"]; _count: { _all: number }; _sum: { amount: string | null; delta: string | null } };
type Data = {
  rate: string; locations: Location[]; rewards: Reward[]; members: Member[]; history: LedgerRow[]; totals: Group[];
  analytics?: { members: number; newMembers: number; returning: number; outstanding: string };
  breakdown?: { daily: { name: string; amount: string }[]; branches: { name: string; count: number; amount: string }[]; popular: { name: string; count: number }[] };
};
type Pending = { payload: object; title: string; summary: string };

const endpoint = "/api/loyalty/points";
const panel = "space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6";
const control = "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground";
const button = "min-h-11 rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted active:scale-[.98] disabled:opacity-50";
const primary = `${button} bg-primary text-primary-foreground hover:bg-primary/90`;
const empty: Data = { rate: "10", locations: [], rewards: [], members: [], history: [], totals: [] };

async function readPoints(query = ""): Promise<Data> {
  const response = await fetch(endpoint + query, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Unable to load points loyalty.");
  return body;
}

async function sendPoints(data: FormData | object) {
  const response = await fetch(endpoint, {
    method: "POST", ...(data instanceof FormData ? { body: data } : {
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Unable to save.");
  return body;
}

export default function PointsDashboard({ view = "counter", camera = false }: { view?: "counter" | "rewards" | "overview" | "customers"; camera?: boolean }) {
  const { cafe, userRole } = useCafeTheme();
  const { lang, dir } = useBeLoyalLanguage();
  const copy = (en: string, ar: string) => lang === "ar" ? ar : en;
  const admin = userRole === "CAFE_ADMIN";
  const [data, setData] = useState(empty);
  const [query, setQuery] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [selectedLocation, setLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [rateDraft, setRateDraft] = useState<string | null>(null);
  const [reward, setReward] = useState<Reward | "new" | null>(null);
  const [scanning, setScanning] = useState(camera);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const location = selectedLocation || data.locations[0]?.id || "";
  const purchaseAmount = normalizePointsInput(amount);
  const preview = purchaseAmountSchema.safeParse(purchaseAmount).success && earningRateSchema.safeParse(data.rate).success
    ? earnedPoints(purchaseAmount, data.rate) : null;

  useEffect(() => {
    let current = true;
    readPoints().then(value => { if (current) setData(value); }).catch(error => { if (current) setError(error.message); });
    return () => { current = false; };
  }, []);

  async function search(value: string) {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const results = await readPoints(`?search=${encodeURIComponent(value)}`);
      setData(current => ({ ...current, members: results.members }));
      setMember(results.members.length === 1 ? results.members[0] : null);
      if (view === "customers" && results.members.length === 1) await showCustomer(results.members[0]);
      if (!results.members.length) setMessage(copy("No matching members.", "مفيش أعضاء مطابقين للبحث."));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function showCustomer(customer: Member) {
    setMember(customer);
    if (view === "customers") {
      try {
        const profile = await readPoints(`?customer=${encodeURIComponent(customer.id)}`);
        setData(current => ({ ...current, totals: profile.totals, history: profile.history }));
        setMember(profile.members[0] ?? customer);
      } catch (error) { setError((error as Error).message); }
    }
  }

  function confirmTransaction(details: object, title: string, summary: string) {
    if (!member || !location) return;
    setError("");
    setPending({ title, summary, payload: { ...details, customerId: member.id, locationId: location, requestId: crypto.randomUUID() } });
  }

  async function save(details: FormData | object, done?: () => void) {
    if (busy) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await sendPoints(details);
      if (member && result.balance !== undefined) {
        const next = { ...member, pointsBalance: result.balance };
        setMember(next);
        if (view === "customers") await showCustomer(next);
      } else {
        const next = await readPoints();
        setData(current => ({ ...next, members: current.members }));
      }
      setMessage(copy("Saved.", "تم الحفظ."));
      done?.();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("photo");
    const existing = reward && reward !== "new" ? reward : null;
    let photoUrl = form.has("removePhoto") ? null : existing?.photoUrl ?? null;
    if (file instanceof File && file.size) {
      const upload = new FormData();
      upload.set("photo", file);
      try { photoUrl = (await sendPoints(upload)).photoUrl; }
      catch (error) { setError((error as Error).message); return; }
    }
    const expiry = String(form.get("expiresAt") || "");
    await save({
      action: "reward", ...(existing && { id: existing.id }),
      name: form.get("name"), description: form.get("description"), conditions: form.get("conditions"),
      cost: normalizePointsInput(String(form.get("cost") ?? "")), enabled: form.has("enabled"), locationIds: form.getAll("locationId"), photoUrl,
      expiresAt: expiry ? new Date(expiry).toISOString() : null,
    }, () => setReward(null));
  }

  const purchases = data.totals.find(total => total.kind === "PURCHASE");
  const redemptions = data.totals.find(total => total.kind === "REDEMPTION");
  const refunds = data.totals.find(total => total.kind === "REFUND");
  const recordedSpending = Number(purchases?._sum.amount ?? 0) - Number(refunds?._sum.amount ?? 0);
  const money = (value: number) => new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP" }).format(value);
  const available = data.rewards.filter(item => item.enabled && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()) && item.locations.some(item => item.locationId === location));
  const editing = reward && reward !== "new" ? reward : null;
  const title = view === "rewards" ? copy("Rewards", "المكافآت")
    : view === "overview" ? copy("Points overview", "نظرة عامة على النقاط")
    : view === "customers" ? copy("Customer database", "قاعدة بيانات العملاء") : copy("Points at checkout", "النقاط عند الدفع");

  if (cafe.loyaltyMode !== "POINTS" || (!admin && view !== "counter")) return null;

  return (
    <div lang={lang} dir={dir} className="space-y-5">
      <header><p className="text-sm opacity-70">{cafe.name}</p><h1 className="mt-1 text-3xl font-semibold">{title}</h1></header>
      {error && !pending && !reward && <p role="alert" className="rounded-xl border border-destructive p-3">{error}</p>}
      {message && <p role="status">{message}</p>}
      {(view === "counter" || view === "customers") && (
        <section className={panel}>
          <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void search(query); }}>
            <label className="min-w-48 flex-1">{copy("Scan or find a member", "امسح الكود أو ابحث عن عضو")}
              <input className={control} autoFocus={view === "counter" && !camera} value={query} onChange={event => setQuery(event.target.value)} placeholder={copy("Name, phone, member number or QR", "الاسم أو الهاتف أو رقم العضو أو الكود")} />
            </label>
            <button className={primary} disabled={busy}>{copy("Find", "بحث")}</button>
            <button className={button} type="button" onClick={() => setScanning(!scanning)}>{copy("Camera", "الكاميرا")}</button>
          </form>
          {scanning && <div className="max-w-sm overflow-hidden rounded-xl"><CameraScanner onScan={codes => {
            const code = codes[0]?.rawValue;
            if (code) { setScanning(false); setQuery(code); void search(code); }
          }} onError={() => setError(copy("Camera unavailable. Enter the member details instead.", "الكاميرا غير متاحة. أدخل بيانات العضو."))} /></div>}
          {data.members.length > 1 && <ul className="space-y-2">{data.members.map(item => <li key={item.id}>
            <button className={button} onClick={() => void showCustomer(item)}>{item.name} · {item.memberNumber}</button>
          </li>)}</ul>}
          {view === "counter" && <NewCustomerDialog />}
          {view === "customers" && <a className={button + " inline-flex items-center"} href={endpoint + "/export?view=customers"}>{copy("Download member CSV", "حمّل CSV للأعضاء")}</a>}
        </section>
      )}
      {member && view === "counter" && (
        <section className={panel}>
          <div><h2 className="text-xl font-semibold">{member.name}</h2><p className="mt-1">{member.pointsBalance} {copy("points", "نقطة")}</p></div>
          <label className="block">{copy("Branch", "الفرع")}
            <select className={control} value={location} onChange={event => setLocation(event.target.value)}>
              {!data.locations.length && <option value="">{copy("No assigned branch", "مفيش فرع مخصص")}</option>}
              {data.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => {
            event.preventDefault();
            confirmTransaction({ kind: "PURCHASE", amount: purchaseAmount, ...(receipt.trim() && { receipt }) },
              copy("Confirm purchase", "أكد عملية الشراء"), `${amount} EGP · +${preview} ${copy("points", "نقطة")}`);
          }}>
            <label>{copy("Purchase amount (EGP)", "قيمة الشراء (ج.م)")}<input className={control} inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} required /></label>
            <label>{copy("Receipt reference", "رقم الإيصال")}<input className={control} value={receipt} onChange={event => setReceipt(event.target.value)} maxLength={80} /></label>
            <button className={primary} disabled={!location || preview === null || busy}>{copy("Record purchase", "سجّل عملية شراء")}{preview !== null ? ` · +${preview}` : ""}</button>
          </form>
          <div className="space-y-2">
            <h3 className="font-semibold">{copy("Redeem reward", "استبدل مكافأة")}</h3>
            {available.length === 0 && <p>{copy("No rewards at this branch.", "مفيش مكافآت في الفرع ده.")}</p>}
            {available.map(item => <button key={item.id} className={button + " me-2 text-start"} disabled={Number(item.cost) > Number(member.pointsBalance)} onClick={() => confirmTransaction(
              { kind: "REDEMPTION", rewardId: item.id }, copy("Confirm redemption", "أكد استبدال المكافأة"), `${item.name} · −${item.cost} ${copy("points", "نقطة")}`)}>{item.name} · {item.cost}</button>)}
          </div>
        </section>
      )}
      {view === "rewards" && (
        <>
          <section className={panel}>
            <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void save({ action: "rate", rate: normalizePointsInput(rateDraft ?? data.rate) }); }}>
              <label className="flex-1">{copy("Points earned per 100 EGP", "النقاط المكتسبة لكل ١٠٠ ج.م")}<input className={control} inputMode="decimal" value={rateDraft ?? data.rate} onChange={event => setRateDraft(event.target.value)} required /></label>
              <button className={primary} disabled={busy}>{copy("Save rate", "احفظ المعدل")}</button>
            </form>
          </section>
          <section className={panel}>
            <button className={primary} onClick={() => { setError(""); setReward("new"); }}>{copy("Create reward", "أضف مكافأة")}</button>
            {data.rewards.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <p>{item.name} · {item.cost} {copy("points", "نقطة")} · {item.enabled ? copy("Enabled", "مفعّلة") : copy("Disabled", "غير مفعّلة")}</p>
              <button className={button} onClick={() => { setError(""); setReward(item); }}>{copy("Edit", "عدّل")}</button>
            </div>)}
          </section>
        </>
      )}
      {(view === "overview" || (view === "customers" && member)) && (
        <>
          <section className={panel}>
            {view === "overview" && data.analytics && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <p>{copy("Total members", "إجمالي الأعضاء")} <strong>{data.analytics.members}</strong></p>
                <p>{copy("New members (30 days)", "أعضاء جدد (٣٠ يوم)")} <strong>{data.analytics.newMembers}</strong></p>
                <p>{copy("Returning customers", "عملاء رجعوا")} <strong>{data.analytics.returning}</strong></p>
                <p>{copy("Outstanding points", "النقاط المتاحة")} <strong>{Number(data.analytics.outstanding).toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong></p>
              </div>
            )}
            {member && view === "customers" && <div className="space-y-1"><h2 className="text-xl font-semibold">{member.name}</h2>
              <p>{copy("Balance", "الرصيد")} {member.pointsBalance} · {copy("Joined at", "سجّل في")} {member.joinLocation?.name ?? "—"}</p>
              {data.locations.length > 1 && <label className="block">
                {copy("Refund branch", "فرع الاسترداد")}
                <select className={control} value={location} onChange={event => setLocation(event.target.value)}>
                  {data.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>}
              <p>{copy("Birthday", "عيد الميلاد")} {member.birthday?.slice(5, 10) ?? "—"} · {copy("Wallet", "المحفظة")} {member.wallet ? [member.wallet.apple && "Apple", member.wallet.google && "Google"].filter(Boolean).join(", ") || "—" : "—"}</p></div>}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <p>{copy("Recorded purchases", "عمليات الشراء المسجلة")} <strong>{purchases?._count._all ?? 0}</strong></p>
              <p>{copy("Recorded spending", "الإنفاق المسجل")} <strong>{money(recordedSpending)}</strong></p>
              <p>{copy("Average recorded purchase", "متوسط قيمة الشراء المسجل")} <strong>{money(recordedSpending / (purchases?._count._all || 1))}</strong></p>
              <p>{copy("Points issued", "النقاط المكتسبة")} <strong>{purchases?._sum.delta ?? 0}</strong></p>
              <p>{copy("Points redeemed", "النقاط المستبدلة")} <strong>{String(redemptions?._sum.delta ?? 0).replace(/^-/, "")}</strong></p>
              <p>{copy("Rewards redeemed", "المكافآت المستبدلة")} <strong>{redemptions?._count._all ?? 0}</strong></p>
            </div>
            <a className={button + " inline-flex items-center"} href={`${endpoint}/export${member && view === "customers" ? `?customer=${encodeURIComponent(member.id)}` : ""}`}>{copy("Download CSV", "حمّل CSV")}</a>
          </section>
          {view === "overview" && data.breakdown && <section className={panel}>
            <h2 className="text-lg font-semibold">{copy("Spending by day", "الإنفاق حسب اليوم")}</h2>
            <div className="grid gap-2">{data.breakdown.daily.map(item => <div key={item.name} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm">
              <span>{item.name}</span><meter className="w-full" min={0} max={Math.max(1, ...data.breakdown!.daily.map(day => Number(day.amount)))} value={Math.max(0, Number(item.amount))} aria-label={item.name} /><span>{money(Number(item.amount))}</span>
            </div>)}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><h3 className="font-semibold">{copy("Branches", "الفروع")}</h3>{data.breakdown.branches.map(item => <p key={item.name}>{item.name} · {item.count} · {money(Number(item.amount))}</p>)}</div>
              <div><h3 className="font-semibold">{copy("Popular rewards", "المكافآت الأكثر استخداماً")}</h3>{data.breakdown.popular.map(item => <p key={item.name}>{item.name} · {item.count}</p>)}</div>
            </div>
          </section>}
          <section className={panel}>
            <h2 className="text-lg font-semibold">{copy("Recent transactions and staff activity", "آخر المعاملات ونشاط الموظفين")}</h2>
            {data.history.map(row => <div key={row.id} className="space-y-1 border-t border-border pt-3 text-sm">
              <p><strong>{row.customer.name}</strong> · {row.location.name} · {row.actorName} · {new Date(row.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-EG", { timeZone: cafe.timezone })}</p>
              <p>{row.kind === "PURCHASE" ? copy("Purchase", "شراء") : row.kind === "REFUND" ? copy("Refund", "استرداد") : copy("Redemption", "استبدال")} · {row.delta} {copy("points", "نقطة")}{row.amount && ` · ${money(Number(row.amount))}`}{row.rewardName && ` · ${row.rewardName}`}{row.receipt && ` · ${row.receipt}`}</p>
              {member && row.kind === "PURCHASE" && data.locations.length > 0 && <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={event => {
                event.preventDefault();
                const values = new FormData(event.currentTarget);
                const amount = normalizePointsInput(String(values.get("refundAmount") ?? ""));
                confirmTransaction({ kind: "REFUND", purchaseId: row.id, amount, reason: values.get("reason") },
                  copy("Confirm refund", "أكد الاسترداد"), money(Number(amount)));
              }}>
                <input className={control} name="refundAmount" inputMode="decimal" required aria-label={copy("Refund amount", "قيمة الاسترداد")} placeholder={copy("Refund amount", "قيمة الاسترداد")} />
                <input className={control} name="reason" required maxLength={240} aria-label={copy("Reason", "السبب")} placeholder={copy("Reason", "السبب")} />
                <button className={button}>{copy("Refund", "استرداد")}</button>
              </form>}
            </div>)}
          </section>
          {view === "overview" && <StoreJoinQRCodes />}
        </>
      )}
      <Dialog open={!!pending} onOpenChange={open => { if (!open && !busy) setPending(null); }}>
        {pending && <DialogContent dir={dir} className="bg-card text-foreground">
          <DialogTitle>{pending.title}</DialogTitle><DialogDescription>{pending.summary}</DialogDescription>
          {error && <p role="alert">{error}</p>}
          <button className={primary} disabled={busy} onClick={() => void save(pending.payload, () => {
            setPending(null); setAmount(""); setReceipt("");
          })}>{copy("Confirm", "تأكيد")}</button>
        </DialogContent>}
      </Dialog>
      <Dialog open={!!reward} onOpenChange={open => { if (!open && !busy) setReward(null); }}>
        {reward && <DialogContent dir={dir} className="max-h-[85dvh] overflow-y-auto bg-card text-foreground">
          <DialogTitle>{editing ? copy("Edit reward", "عدّل المكافأة") : copy("Create reward", "أضف مكافأة")}</DialogTitle>
          <DialogDescription>{copy("Set the reward cost and participating branches.", "حدد تكلفة المكافأة والفروع المشاركة.")}</DialogDescription>
          {error && <p role="alert">{error}</p>}
          <form className="grid gap-3" onSubmit={saveReward}>
            <label>{copy("Name", "الاسم")}<input className={control} name="name" defaultValue={editing?.name} maxLength={100} required /></label>
            <label>{copy("Description", "الوصف")}<textarea className={control} name="description" defaultValue={editing?.description ?? ""} maxLength={600} /></label>
            <label>{copy("Conditions", "الشروط")}<textarea className={control} name="conditions" defaultValue={editing?.conditions ?? ""} maxLength={1000} /></label>
            <label>{copy("Required points", "النقاط المطلوبة")}<input className={control} name="cost" defaultValue={editing?.cost} inputMode="decimal" required /></label>
            <label>{copy("Reward photo", "صورة المكافأة")}<input className={control} name="photo" type="file" accept="image/png,image/jpeg,image/webp" /></label>
            {editing?.photoUrl && <label><input type="checkbox" name="removePhoto" /> {copy("Remove photo", "احذف الصورة")}</label>}
            <label>{copy("Expiration", "تاريخ الانتهاء")}<input className={control} name="expiresAt" type="datetime-local" defaultValue={editing?.expiresAt ? new Date(Date.parse(editing.expiresAt) - new Date(editing.expiresAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined} /></label>
            <fieldset className="grid gap-2"><legend>{copy("Participating branches", "الفروع المشاركة")}</legend>
              {data.locations.map(item => <label key={item.id}><input type="checkbox" name="locationId" value={item.id} defaultChecked={editing ? editing.locations.some(selected => selected.locationId === item.id) : true} /> {item.name}</label>)}
            </fieldset>
            <label><input type="checkbox" name="enabled" defaultChecked={editing?.enabled} /> {copy("Enabled", "مفعّلة")}</label>
            <button className={primary} disabled={busy}>{copy("Save reward", "احفظ المكافأة")}</button>
            {editing && <button type="button" className={button} disabled={busy} onClick={() => void save({ action: "archive", id: editing.id }, () => setReward(null))}>{copy("Archive reward", "أرشف المكافأة")}</button>}
          </form>
        </DialogContent>}
      </Dialog>
    </div>
  );
}
