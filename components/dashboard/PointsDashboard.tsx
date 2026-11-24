"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, CreditCard, Download, Flame, Gift, MapPin, ScanLine, Users } from "lucide-react";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import StoreJoinQRCodes from "./StoreJoinQRCodes";
import PointsMemberDirectory from "@/components/customers/PointsMemberDirectory";
import { fireyNashBrand, normalizePointsInput } from "@/lib/business/points";

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
const panel = "min-w-0 space-y-4 rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6";
const control = "min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring";
const button = "min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted active:scale-[.98] disabled:opacity-50";
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

export default function PointsDashboard({ view }: { view: "rewards" | "overview" | "customers" }) {
  const { cafe, userRole } = useCafeTheme();
  const { lang, dir } = useBeLoyalLanguage();
  const copy = (en: string, ar: string) => lang === "ar" ? ar : en;
  const admin = userRole === "CAFE_ADMIN";
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [selectedLocation, setLocation] = useState("");
  const [rateDraft, setRateDraft] = useState<string | null>(null);
  const [reward, setReward] = useState<Reward | "new" | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const location = selectedLocation || data.locations[0]?.id || "";

  useEffect(() => {
    let current = true;
    readPoints().then(value => { if (current) setData(value); }).catch(error => { if (current) setError(error.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

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
  const editing = reward && reward !== "new" ? reward : null;
  const firey = cafe.slug === fireyNashBrand.slug;
  const units = firey ? copy("flames", "لهب") : copy("points", "نقطة");
  const title = view === "overview" ? copy("Overview", "نظرة عامة")
    : view === "customers" ? copy("Customer database", "قاعدة بيانات العملاء") : copy("Checkout", "الكاشير");
  const number = (value: string | number) => new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 6,
  }).format(Number(value));

  if (cafe.loyaltyMode !== "POINTS" || !admin) return null;

  const metrics = [
    { label: copy("Members", "الأعضاء"), value: number(data.analytics?.members ?? 0), icon: Users,
      detail: copy(`${number(data.analytics?.newMembers ?? 0)} new in 30 days`, `${number(data.analytics?.newMembers ?? 0)} جديد خلال ٣٠ يوم`) },
    { label: copy("Recorded spending", "الإنفاق المسجل"), value: money(recordedSpending), icon: CreditCard,
      detail: copy(`${number(purchases?._count._all ?? 0)} purchases`, `${number(purchases?._count._all ?? 0)} عملية شراء`) },
    { label: firey ? copy("Flames in circulation", "اللهب المتاح") : copy("Points in circulation", "النقاط المتاحة"),
      value: number(data.analytics?.outstanding ?? 0), icon: Flame,
      detail: copy(`${number(purchases?._sum.delta ?? 0)} issued`, `${number(purchases?._sum.delta ?? 0)} مكتسبة`) },
    { label: copy("Rewards redeemed", "المكافآت المستبدلة"), value: number(redemptions?._count._all ?? 0), icon: Gift,
      detail: `${number(Math.abs(Number(redemptions?._sum.delta ?? 0)))} ${units}` },
  ];
  const daily = data.breakdown?.daily ?? [];
  const max = Math.max(1, ...daily.map(day => Number(day.amount)));
  const min = Math.min(0, ...daily.map(day => Number(day.amount)));
  const baseline = -min / (max - min) * 100;
  const dateLabel = (date: string) => new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(new Date(date + "T00:00:00Z"));

  return (
    <div id={view === "rewards" ? "loyalty-program" : undefined} lang={lang} dir={dir} className="scroll-mt-24 space-y-5">
      {view !== "rewards" && view !== "customers" && <header className={`${panel} flex flex-wrap items-center justify-between gap-4 space-y-0`}>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{cafe.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        </div>
        {view === "overview" && <div className="flex flex-wrap gap-2">
          <Link className={`${primary} inline-flex items-center gap-2`} href="/dashboard/scanner/phone"><ScanLine size={16} />{copy("Scan a card", "امسح الكارت")}</Link>
          <Link className={`${button} inline-flex items-center gap-2`} href="/dashboard/settings#loyalty-program">{copy("Loyalty settings", "إعدادات الولاء")}<ArrowUpRight size={15} /></Link>
        </div>}
      </header>}
      {loading && <p role="status" className="px-2 text-sm text-muted-foreground">{copy("Loading…", "جارٍ التحميل…")}</p>}
      {error && !pending && !reward && <p role="alert" className="rounded-xl border border-destructive p-3">{error}</p>}
      {message && <p role="status">{message}</p>}
      {view === "customers" && <PointsMemberDirectory database onSelect={item => {
        void showCustomer(item);
        requestAnimationFrame(() => document.getElementById("points-customer-detail")?.scrollIntoView({ block: "start", behavior: "smooth" }));
      }} />}
      {view === "rewards" && (
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight"><Gift size={19} className="text-primary" />{copy("Loyalty program", "برنامج الولاء")}</h2>
            <button className={primary} disabled={loading} onClick={() => { setError(""); setReward("new"); }}>{copy("Create reward", "أضف مكافأة")}</button>
          </div>
          <form className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-secondary/45 p-3 sm:p-4" onSubmit={event => {
            event.preventDefault();
            void save({ action: "rate", rate: normalizePointsInput(rateDraft ?? data.rate) }, () => setRateDraft(null));
          }}>
            <label className="min-w-36 flex-1 text-sm">{copy(`${firey ? "Flames" : "Points"} per 100 EGP`, `${firey ? "اللهب" : "النقاط"} لكل ١٠٠ ج.م`)}<input className={`mt-1 ${control}`} inputMode="decimal" value={rateDraft ?? data.rate} onChange={event => setRateDraft(event.target.value)} required /></label>
            <button className={button} disabled={busy || loading}>{copy("Save rate", "احفظ المعدل")}</button>
          </form>
          <div className="divide-y divide-border">
            {!loading && !data.rewards.length && <p className="py-3 text-sm text-muted-foreground">{copy("No rewards yet.", "مفيش مكافآت لسه.")}</p>}
            {data.rewards.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.cost} {units} · {item.enabled ? copy("Enabled", "مفعّلة") : copy("Disabled", "غير مفعّلة")}</p></div>
              <button className={button} onClick={() => { setError(""); setReward(item); }}>{copy("Edit", "عدّل")}</button>
            </div>)}
          </div>
        </section>
      )}
      {view === "overview" && data.analytics && <>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map(({label, value, detail, icon: Icon}) => <article key={label} className="min-w-0 rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5">
            <Icon size={18} className="text-primary" aria-hidden="true" />
            <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 wrap-anywhere text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </article>)}
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section className={panel}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="text-lg font-semibold tracking-tight">{copy("Daily spending", "الإنفاق اليومي")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{copy("Last 30 days · after refunds", "آخر ٣٠ يوم بعد الاسترداد")}</p></div>
              <a className={`${button} inline-flex items-center gap-2`} href={endpoint + "/export"} aria-label={copy("Download CSV", "حمّل CSV")}><Download size={15} /> CSV</a>
            </div>
            {daily.length ? <div className="mt-3">
              <div className="relative flex h-32 gap-1 px-1 sm:gap-2" aria-hidden="true">
                <div className="absolute inset-x-0 border-t border-border" style={{ bottom: `${baseline}%` }} />
                {daily.map(day => {
                  const amount = Number(day.amount);
                  return <div key={day.name} className="relative h-full min-w-0 flex-1" title={`${dateLabel(day.name)} · ${money(amount)}`}>
                    <div className={`absolute w-full rounded-sm ${amount < 0 ? "bg-destructive/70" : "bg-primary/80"}`}
                      style={{ bottom: `${(Math.min(0, amount) - min) / (max - min) * 100}%`, height: `${Math.abs(amount) / (max - min) * 100}%` }} />
                  </div>;
                })}
              </div>
              <div className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground"><span>{dateLabel(daily[0].name)}</span><span>{dateLabel(daily[daily.length - 1].name)}</span></div>
              <details className="mt-4 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">{copy("Daily totals", "الإجمالي اليومي")}</summary>
                <ul className="mt-2 max-h-40 space-y-2 overflow-auto">{daily.map(day => <li key={day.name} className="flex justify-between gap-3"><span>{dateLabel(day.name)}</span><span>{money(Number(day.amount))}</span></li>)}</ul>
              </details>
            </div> : <p className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">{copy("No spending recorded in the last 30 days.", "مفيش إنفاق مسجل خلال آخر ٣٠ يوم.")}</p>}
          </section>
          <section className={panel}>
            <h2 className="text-lg font-semibold tracking-tight">{copy("Branches", "الفروع")}</h2>
            <ul className="divide-y divide-border">{data.breakdown?.branches.map(branch => <li key={branch.name} className="flex flex-wrap items-start gap-3 py-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-24 flex-1"><p className="wrap-anywhere text-sm font-semibold">{branch.name}</p><p className="mt-1 text-xs text-muted-foreground">{number(branch.count)} {copy("purchases", "عملية شراء")}</p></div>
              <span className="shrink-0 text-sm tabular-nums">{money(Number(branch.amount))}</span>
            </li>)}</ul>
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">{copy("Returning customers", "العملاء العائدون")}</dt><dd className="mt-1 font-semibold">{number(data.analytics.returning)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{copy("Average purchase", "متوسط الشراء")}</dt><dd className="mt-1 font-semibold">{money(recordedSpending / (purchases?._count._all || 1))}</dd></div>
              {data.breakdown?.popular.length ? <div className="col-span-2"><dt className="text-xs text-muted-foreground">{copy("Popular rewards", "المكافآت الأكثر استخداماً")}</dt>
                <dd><ul className="mt-1 divide-y divide-border">{data.breakdown.popular.map(item => <li key={item.name} className="flex justify-between gap-3 py-1"><span>{item.name}</span><span className="tabular-nums">{number(item.count)}</span></li>)}</ul></dd>
              </div> : null}
            </dl>
          </section>
        </div>
      </>}
      {(view === "overview" || (view === "customers" && member)) && (
        <>
          {view === "customers" && <section id="points-customer-detail" className={`${panel} scroll-mt-24`}>
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
          </section>}
          <section className={panel}>
            <h2 className="text-lg font-semibold">{copy("Recent transactions and staff activity", "آخر المعاملات ونشاط الموظفين")}</h2>
            {!loading && !data.history.length && <p className="text-sm text-muted-foreground">{copy("No transactions recorded yet.", "مفيش معاملات مسجلة لسه.")}</p>}
            {data.history.map(row => <div key={row.id} className="space-y-1 border-t border-border pt-3 text-sm">
              <p><strong>{row.customer.name}</strong> · {row.location.name} · {row.actorName} · {new Date(row.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-EG", { timeZone: cafe.timezone })}</p>
              <p>{row.kind === "PURCHASE" ? copy("Purchase", "شراء") : row.kind === "REFUND" ? copy("Refund", "استرداد") : copy("Redemption", "استبدال")} · {row.delta} {units}{row.amount && ` · ${money(Number(row.amount))}`}{row.rewardName && ` · ${row.rewardName}`}{row.receipt && ` · ${row.receipt}`}</p>
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
            setPending(null);
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
            <label>{copy(firey ? "Flames needed to redeem" : "Points needed to redeem", firey ? "اللهب المطلوب للاستبدال" : "النقاط المطلوبة للاستبدال")}<input className={control} name="cost" defaultValue={editing?.cost} inputMode="decimal" required /></label>
            <label className="block rounded-xl border border-dashed border-border p-3 text-sm">{copy("Upload reward photo", "ارفع صورة المكافأة")}<input className={control} name="photo" type="file" accept="image/png,image/jpeg,image/webp" /></label>
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
