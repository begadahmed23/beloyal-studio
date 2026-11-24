"use client";

import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";
import Link from "next/link";
import { Download, Gift, ScanLine } from "lucide-react";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { fireyNashBrand, normalizePointsInput } from "@/lib/business/points";
import PointsAnalytics from "./PointsAnalytics";
import StoreJoinQRCodes from "./StoreJoinQRCodes";

type Location = { id: string; name: string };
type Reward = {
  id: string; name: string; description: string | null; conditions: string | null; cost: string;
  enabled: boolean; expiresAt: string | null; photoUrl: string | null; locations: { locationId: string }[];
};
type ActivityKind = "PURCHASE" | "REDEMPTION" | "REFUND";
type Data = {
  rate: string; locations: Location[]; rewards: Reward[];
  history: { id: string; kind: ActivityKind; amount: string | null; delta: string; createdAt: string; receipt: string | null;
    rewardName: string | null; actorName: string; location: { name: string }; customer: { name: string } }[];
  totals: { kind: ActivityKind; _count: { _all: number }; _sum: { amount: string | null; delta: string | null } }[];
  analytics?: ComponentProps<typeof PointsAnalytics>["analytics"];
  breakdown?: ComponentProps<typeof PointsAnalytics>["breakdown"];
};

const endpoint = "/api/loyalty/points";
const panel = "min-w-0 space-y-4 rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6";
const control = "min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50";
const primary = `${button} bg-primary text-primary-foreground hover:bg-primary/90`;
const empty: Data = { rate: "10", locations: [], rewards: [], history: [], totals: [] };

async function readPoints(view: "rewards" | "overview"): Promise<Data> {
  const response = await fetch(`${endpoint}?view=${view}`, { cache: "no-store" });
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

export default function PointsDashboard({ view }: { view: "rewards" | "overview" }) {
  const { cafe, userRole } = useCafeTheme();
  const { lang, dir, arabic } = useBeLoyalLanguage();
  const copy = (en: string, ar: string) => arabic ? ar : en;
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [rateDraft, setRateDraft] = useState<string | null>(null);
  const [reward, setReward] = useState<Reward | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  const editorTitle = useRef<HTMLHeadingElement>(null);
  const addReward = useRef<HTMLButtonElement>(null);
  const rewardTrigger = useRef<HTMLButtonElement | null>(null);
  const admin = userRole === "CAFE_ADMIN";

  useEffect(() => {
    if (cafe.loyaltyMode !== "POINTS" || !admin) return;
    let mounted = true;
    readPoints(view).then(value => { if (mounted) setData(value); })
      .catch(reason => { if (mounted) setError(reason.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [view, cafe.loyaltyMode, admin]);

  useEffect(() => {
    if (!reward || !editorTitle.current) return;
    editorTitle.current.focus({ preventScroll: true });
    editorTitle.current.scrollIntoView({ block: "start" });
  }, [reward]);

  function openReward(value: Reward | "new", trigger: HTMLButtonElement) {
    setError("");
    setMessage("");
    rewardTrigger.current = trigger;
    setReward(value);
  }

  function closeReward() {
    setReward(null);
    window.requestAnimationFrame(() => {
      const target = rewardTrigger.current?.isConnected ? rewardTrigger.current : addReward.current;
      target?.focus({ preventScroll: true });
    });
  }

  async function save(write: () => Promise<unknown>, done?: () => void) {
    if (saving.current) return;
    saving.current = true;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await write();
      setMessage(copy("Saved.", "تم الحفظ."));
      done?.();
      try { setData(await readPoints(view)); }
      catch { setError(copy("Saved. Refresh to see the latest details.", "تم الحفظ. حدّث الصفحة لعرض آخر البيانات.")); }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy("Unable to save.", "تعذّر الحفظ."));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  const editing = reward && reward !== "new" ? reward : null;

  function saveReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void save(async () => {
      const file = form.get("photo");
      let photoUrl = form.has("removePhoto") ? null : editing?.photoUrl ?? null;
      if (file instanceof File && file.size) {
        const upload = new FormData();
        upload.set("photo", file);
        photoUrl = (await sendPoints(upload)).photoUrl;
      }
      const expiry = String(form.get("expiresAt") || "");
      return sendPoints({
        action: "reward", ...(editing && { id: editing.id }),
        name: form.get("name"), description: form.get("description"), conditions: form.get("conditions"),
        cost: normalizePointsInput(String(form.get("cost") ?? "")), enabled: form.has("enabled"), locationIds: form.getAll("locationId"), photoUrl,
        expiresAt: expiry ? new Date(expiry).toISOString() : null,
      });
    }, closeReward);
  }

  if (cafe.loyaltyMode !== "POINTS" || !admin) return null;

  const buy = data.totals.find(row => row.kind === "PURCHASE");
  const redeem = data.totals.find(row => row.kind === "REDEMPTION");
  const refund = data.totals.find(row => row.kind === "REFUND");
  const firey = cafe.slug === fireyNashBrand.slug;
  const unit = firey ? copy("Flames", "لهب") : copy("Points", "نقاط");
  const locale = arabic ? "ar-EG" : "en-EG";
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EGP" });
  const time = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: cafe.timezone });

  return (
    <div id={view === "rewards" ? "loyalty-program" : undefined} lang={lang} dir={dir} className="min-w-0 scroll-mt-24 space-y-4">
      {loading && <p role="status" className="text-sm text-muted-foreground">{copy("Loading…", "جارٍ التحميل…")}</p>}
      {error && !reward && <p role="alert" className="rounded-xl border border-destructive/50 p-3">{error}</p>}
      {message && <p role="status" className="text-sm text-primary">{message}</p>}
      {view === "overview" ? <>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">{cafe.name}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{copy("Overview", "نظرة عامة")}</h1></div>
          <div className="flex flex-wrap gap-2">
            <Link className={primary} href="/dashboard/settings#loyalty-program"><Gift size={16} aria-hidden="true" />{copy("Manage reward items", "إدارة عناصر المكافآت")}</Link>
            <Link className={button} href="/dashboard/scanner/phone"><ScanLine size={16} aria-hidden="true" />{copy("Scan a card", "امسح الكارت")}</Link>
          </div>
        </header>
        {data.analytics && data.breakdown && <PointsAnalytics analytics={data.analytics} breakdown={data.breakdown}
          purchaseCount={buy?._count._all ?? 0} netSpending={Number(buy?._sum.amount ?? 0) - Number(refund?._sum.amount ?? 0)}
          issued={Number(buy?._sum.delta ?? 0)} redeemed={Math.abs(Number(redeem?._sum.delta ?? 0))}
          rewards={redeem?._count._all ?? 0} unit={unit} />}
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{copy("Recent activity", "آخر النشاط")}</h2>
            <a className={button} href={endpoint + "/export?view=ledger"}><Download size={15} aria-hidden="true" />{copy("Activity CSV", "تحميل سجل النشاط")}</a>
          </div>
          {!loading && !data.history.length && <p className="text-sm text-muted-foreground">{copy("No transactions recorded yet.", "مفيش معاملات مسجلة لسه.")}</p>}
          <ul className="divide-y divide-border">{data.history.map(row => <li key={row.id} className="min-w-0 py-3 text-sm">
            <div className="flex flex-wrap justify-between gap-1"><p className="min-w-0 wrap-anywhere font-semibold">{row.customer.name}</p>
              <p className="wrap-anywhere font-medium tabular-nums"><bdi>{row.amount ? money.format(Number(row.amount)) : `${row.delta} ${unit}`}</bdi></p></div>
            <p className="mt-1 wrap-anywhere text-xs text-muted-foreground">{row.rewardName ?? (row.kind === "PURCHASE" ? copy("Purchase", "شراء") : row.kind === "REFUND" ? copy("Refund", "استرداد") : copy("Reward", "مكافأة"))} · {row.location.name} · {row.actorName} · {time.format(new Date(row.createdAt))}{row.receipt && ` · ${row.receipt}`}</p>
          </li>)}</ul>
        </section>
        <StoreJoinQRCodes />
      </> : <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Gift size={19} className="text-primary" aria-hidden="true" />{copy("Reward items", "عناصر المكافآت")}</h2>
          <button ref={addReward} type="button" className={primary} disabled={loading || busy || !!reward}
            onClick={event => openReward("new", event.currentTarget)}>{copy("Add reward item", "أضف عنصر مكافأة")}</button>
        </div>
        {reward && <section aria-labelledby="reward-editor" className="min-w-0 space-y-4 rounded-2xl border border-primary/35 bg-secondary/25 p-3 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 id="reward-editor" ref={editorTitle} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold outline-none">{editing ? copy("Edit reward", "عدّل المكافأة") : copy("Add reward item", "أضف عنصر مكافأة")}</h3>
            <button className={button} type="button" disabled={busy} onClick={closeReward}>{copy("Cancel", "إلغاء")}</button>
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/50 p-3">{error}</p>}
          <form key={editing?.id ?? "new"} className="grid min-w-0 gap-4" aria-busy={busy} onSubmit={saveReward}>
            <fieldset disabled={busy} className="grid min-w-0 gap-4">
              <label className="grid min-w-0 gap-1 text-sm">{copy("Item name", "اسم العنصر")}<input className={control} name="name" defaultValue={editing?.name} maxLength={100} required /></label>
              <label className="grid min-w-0 gap-1 text-sm">{copy(firey ? "Flames needed to redeem" : "Points needed to redeem", firey ? "اللهب المطلوب للاستبدال" : "النقاط المطلوبة للاستبدال")}<input className={control} name="cost" defaultValue={editing?.cost} inputMode="decimal" required /></label>
              <label className="grid min-w-0 gap-1 text-sm">{copy("Upload reward photo", "ارفع صورة المكافأة")}<input className={`${control} file:me-2 file:max-w-full file:text-sm`} name="photo" type="file" accept="image/png,image/jpeg,image/webp" /></label>
              {editing?.photoUrl && <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="removePhoto" /> {copy("Remove photo", "احذف الصورة")}</label>}
              <label className="grid min-w-0 gap-1 text-sm">{copy("Description", "الوصف")}<textarea className={`${control} min-h-24 resize-y`} name="description" defaultValue={editing?.description ?? ""} maxLength={600} /></label>
              <label className="grid min-w-0 gap-1 text-sm">{copy("Conditions", "الشروط")}<textarea className={`${control} min-h-24 resize-y`} name="conditions" defaultValue={editing?.conditions ?? ""} maxLength={1000} /></label>
              <label className="grid min-w-0 gap-1 text-sm">{copy("Expiration", "تاريخ الانتهاء")}<input className={control} name="expiresAt" type="datetime-local" defaultValue={editing?.expiresAt ? new Date(Date.parse(editing.expiresAt) - new Date(editing.expiresAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined} /></label>
              <fieldset className="grid min-w-0 gap-1"><legend className="text-sm">{copy("Participating branches", "الفروع المشاركة")}</legend>
                {data.locations.map(item => <label className="flex min-h-11 items-center gap-2" key={item.id}><input type="checkbox" name="locationId"
                  value={item.id} defaultChecked={editing ? editing.locations.some(selected => selected.locationId === item.id) : true} /> {item.name}</label>)}
              </fieldset>
              <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={editing?.enabled ?? true} /> {copy("Enabled", "مفعّلة")}</label>
            </fieldset>
            <div className="grid gap-2 sm:flex">
              <button className={primary} disabled={busy}>{busy ? copy("Saving…", "جارٍ الحفظ…") : copy("Save reward", "احفظ المكافأة")}</button>
              {editing && <button type="button" className={button} disabled={busy}
                onClick={() => void save(() => sendPoints({ action: "archive", id: editing.id }), closeReward)}>{copy("Archive reward", "أرشف المكافأة")}</button>}
            </div>
          </form>
        </section>}
        <form className="grid min-w-0 items-end gap-2 rounded-2xl border border-border bg-secondary/35 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-4" onSubmit={event => {
          event.preventDefault();
          void save(() => sendPoints({ action: "rate", rate: normalizePointsInput(rateDraft ?? data.rate) }), () => setRateDraft(null));
        }}>
          <label className="grid min-w-0 gap-1 text-sm">{copy(`${unit} per 100 EGP`, `${unit} لكل ١٠٠ ج.م`)}
            <input className={control} inputMode="decimal" value={rateDraft ?? data.rate} onChange={event => setRateDraft(event.target.value)} required />
          </label>
          <button className={button} disabled={busy || loading || !!reward}>{copy("Save rate", "احفظ المعدل")}</button>
        </form>
        <div className="divide-y divide-border">
          {!loading && !data.rewards.length && !reward && <p className="py-3 text-sm text-muted-foreground">{copy("Add your first item with a photo and a redemption cost.", "أضف أول عنصر مع صورته وتكلفة استبداله.")}</p>}
          {data.rewards.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="wrap-anywhere font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.cost} {unit} · {item.enabled ? copy("Enabled", "مفعّلة") : copy("Disabled", "غير مفعّلة")}</p></div>
            <button type="button" className={button} disabled={busy || !!reward} onClick={event => openReward(item, event.currentTarget)}>{copy("Edit", "عدّل")}</button>
          </div>)}
        </div>
      </section>}
    </div>
  );
}
