"use client";

import Link from "next/link";
import { Download, ReceiptText } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fireyNashBrand, normalizePointsInput, purchaseAmountSchema } from "@/lib/business/points";
import EditMemberDialog from "./EditMemberDialog";
import type { DirectoryMember } from "./PointsMemberDirectory";

type Kind = "PURCHASE" | "REDEMPTION" | "REFUND";
type Member = DirectoryMember & {
  publicToken: string;
  phone: string | null;
  instagram: string | null;
  birthday: string;
  stamps: number;
  wallet?: { apple: boolean | null; google: boolean | null };
};
type Profile = {
  members: Member[];
  locations: { id: string; name: string }[];
  totals: { kind: Kind; _count: { _all: number }; _sum: { amount: string | null; delta: string | null } }[];
  history: { id: string; kind: Kind; amount: string | null; delta: string; rewardName: string | null;
    receipt: string | null; actorName: string; createdAt: string; location: { name: string } }[];
};
type Refund = { kind: "REFUND"; customerId: string; locationId: string; purchaseId: string; amount: string; reason: string; requestId: string };

const endpoint = "/api/loyalty/points";
const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50";
const field = "min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base";

export default function PointsMemberProfile({ selected, onClose, onCheckout, onUpdated }: {
  selected: DirectoryMember;
  onClose: () => void;
  onCheckout: (member: DirectoryMember) => void;
  onUpdated: () => void;
}) {
  const { cafe } = useCafeTheme();
  const { arabic, lang, dir } = useBeLoyalLanguage();
  const copy = (en: string, ar: string) => arabic ? ar : en;
  const units = cafe.slug === fireyNashBrand.slug ? copy("Flames", "لهب") : copy("Points", "نقاط");
  const [data, setData] = useState<Profile | null>(null);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Refund | null>(null);
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const working = useRef(false);
  const member = data?.members[0];
  const locale = arabic ? "ar-EG" : "en-EG";

  useEffect(() => {
    const abort = new AbortController();
    fetch(`${endpoint}?customer=${encodeURIComponent(selected.id)}`, { signal: abort.signal, cache: "no-store" })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message);
        if (!abort.signal.aborted) setData(payload);
      }).catch(reason => { if (!abort.signal.aborted) setError(reason.message); });
    return () => abort.abort();
  }, [selected.id, revision]);

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EGP" }).format(amount);
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: cafe.timezone }).format(new Date(value));
  const purchase = data?.totals.find(row => row.kind === "PURCHASE");
  const refund = data?.totals.find(row => row.kind === "REFUND");
  const redemption = data?.totals.find(row => row.kind === "REDEMPTION");
  const net = Number(purchase?._sum.amount ?? 0) - Number(refund?._sum.amount ?? 0);
  const branch = location || data?.locations[0]?.id || "";

  function reviewRefund(event: FormEvent<HTMLFormElement>, purchaseId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = normalizePointsInput(String(form.get("amount") ?? ""));
    const reason = String(form.get("reason") ?? "").trim();
    if (!branch || !purchaseAmountSchema.safeParse(amount).success || !reason) {
      setError(copy("Enter a valid refund amount, branch, and reason.", "ادخل مبلغ استرداد صحيح وحدد الفرع والسبب."));
      return;
    }
    setError("");
    setNotice("");
    setPending({ kind: "REFUND", customerId: selected.id, purchaseId, locationId: branch, amount, reason, requestId: crypto.randomUUID() });
  }

  async function confirmRefund() {
    if (!pending || working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pending),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setPending(null);
      setNotice(copy("Refund recorded.", "تم تسجيل الاسترداد."));
      setRevision(value => value + 1);
      onUpdated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy("The refund could not be saved.", "تعذّر تسجيل الاسترداد."));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  if (editing && member) {
    return <EditMemberDialog customer={{ ...member, phone: member.phone ?? "" }}
      onOpenChange={open => setEditing(open)}
      onUpdated={updated => {
        setData(current => current && ({ ...current, members: [{ ...member, ...updated, publicToken: updated.publicToken ?? member.publicToken }] }));
        setRevision(value => value + 1);
        onUpdated();
      }} />;
  }

  const facts = member ? [
    [copy("Phone", "الهاتف"), member.phone],
    ["Instagram", member.instagram && `@${member.instagram}`],
    [copy("Birthday", "عيد الميلاد"), new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(member.birthday))],
    [copy("Joined", "تاريخ التسجيل"), date(member.createdAt)],
    [copy("Signup branch", "فرع التسجيل"), member.joinLocation?.name],
    [copy("Wallet", "المحفظة"), [member.wallet?.apple && "Apple Wallet", member.wallet?.google && "Google Wallet"].filter(Boolean).join(" · ")],
  ] : [];
  const stats = [
    [copy("Recorded spending", "الإنفاق المسجل"), money(net)],
    [copy("Purchases", "عمليات الشراء"), number.format(purchase?._count._all ?? 0)],
    [units, number.format(Number(member?.pointsBalance ?? selected.pointsBalance))],
    [copy("Rewards redeemed", "المكافآت المستبدلة"), number.format(redemption?._count._all ?? 0)],
  ];

  return (
    <Dialog open onOpenChange={open => { if (!open && !working.current) onClose(); }}>
      <DialogContent lang={lang} dir={dir}
        className="max-sm:top-2 max-sm:translate-y-0 max-sm:max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none gap-4 p-4 sm:max-w-2xl sm:p-6">
        <div className="min-w-0 space-y-2 pe-12">
          <DialogTitle className="wrap-anywhere text-2xl font-semibold">{member?.name ?? selected.name}</DialogTitle>
          <DialogDescription>{copy("Membership number", "رقم العضوية")} <bdi>{selected.memberNumber}</bdi></DialogDescription>
        </div>
        {error && <p role="alert" className="rounded-xl border border-destructive/50 p-3">{error}</p>}
        {notice && <p role="status" className="text-primary">{notice}</p>}
        {!data && !error && <p role="status">{copy("Loading member…", "جارٍ تحميل بيانات العضو…")}</p>}
        {data && !member && <p>{copy("This member is unavailable.", "هذا العضو غير متاح.")}</p>}
        {data && member && <>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-border bg-secondary/45 p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 wrap-anywhere text-base font-semibold tabular-nums"><bdi>{value}</bdi></dd>
            </div>)}
          </dl>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{copy("Earned", "المكتسبة")} <strong>{number.format(Number(purchase?._sum.delta ?? 0))} {units}</strong></span>
            <span>{copy("Redeemed", "المستبدلة")} <strong>{number.format(Math.abs(Number(redemption?._sum.delta ?? 0)))} {units}</strong></span>
          </p>
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
            {facts.map(([label, value]) => <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 wrap-anywhere font-medium"><bdi>{value || "—"}</bdi></dd>
            </div>)}
          </dl>
          <div className="flex flex-wrap gap-2">
            <button className={`${action} bg-primary text-primary-foreground hover:bg-primary/90`} type="button" disabled={busy} onClick={() => onCheckout(member)}>{copy("Checkout", "الكاشير")}</button>
            <button className={action} type="button" disabled={busy} onClick={() => setEditing(true)}>{copy("Edit member", "تعديل العضو")}</button>
            {member.publicToken && <Link className={action} href={`/card/${encodeURIComponent(member.publicToken)}`} target="_blank" rel="noopener">{copy("Open loyalty card", "افتح كارت الولاء")}</Link>}
            <a className={action} href={`${endpoint}/export?view=customers&customer=${encodeURIComponent(member.id)}`}><Download size={15} aria-hidden="true" />{copy("Download summary", "تحميل الملخص")}</a>
          </div>
          <section aria-label={copy("Member activity", "نشاط العضو")} className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold"><ReceiptText size={17} aria-hidden="true" />{copy("Recent activity", "آخر النشاط")}</h3>
            {!data.history.length && <p className="text-muted-foreground">{copy("No transactions recorded yet.", "مفيش معاملات مسجلة لسه.")}</p>}
            <ul className="divide-y divide-border">
              {data.history.map(row => <li key={row.id} className="min-w-0 space-y-2 py-3">
                <div className="flex flex-wrap justify-between gap-1">
                  <p className="wrap-anywhere font-semibold">{row.rewardName ?? (row.kind === "PURCHASE" ? copy("Purchase", "شراء") : row.kind === "REFUND" ? copy("Refund", "استرداد") : copy("Reward", "مكافأة"))}</p>
                  <p className="tabular-nums"><bdi>{row.amount ? money(Number(row.amount)) : `${row.delta} ${units}`}</bdi></p>
                </div>
                <p className="wrap-anywhere text-xs text-muted-foreground">{row.location.name} · {row.actorName} · {date(row.createdAt)}{row.receipt && ` · ${row.receipt}`}</p>
                {row.kind === "PURCHASE" && branch && (pending?.purchaseId === row.id ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
                    <p className="w-full">{copy("Confirm refund", "أكد الاسترداد")} · <bdi>{money(Number(pending.amount))}</bdi></p>
                    {error && <p role="alert" className="w-full text-destructive">{error}</p>}
                    <button className={`${action} bg-primary text-primary-foreground hover:bg-primary/90`} type="button" disabled={busy} onClick={() => void confirmRefund()}>{copy("Confirm", "تأكيد")}</button>
                    <button className={action} type="button" disabled={busy} onClick={() => { setPending(null); setError(""); }}>{copy("Cancel", "إلغاء")}</button>
                  </div>
                ) : <details className="rounded-xl border border-border px-3">
                  <summary className="min-h-11 cursor-pointer content-center font-medium">{copy("Refund", "استرداد")}</summary>
                  <form className="grid gap-2 pb-3 sm:grid-cols-2" onSubmit={event => reviewRefund(event, row.id)}>
                    {data.locations.length > 1 && <label className="space-y-1 sm:col-span-2">{copy("Refund branch", "فرع الاسترداد")}
                      <select className={field} value={branch} onChange={event => setLocation(event.target.value)} disabled={busy}>
                        {data.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </label>}
                    <input className={field} name="amount" inputMode="decimal" required aria-label={copy("Refund amount", "قيمة الاسترداد")} placeholder={copy("Refund amount", "قيمة الاسترداد")} />
                    <input className={field} name="reason" required maxLength={240} aria-label={copy("Reason", "السبب")} placeholder={copy("Reason", "السبب")} />
                    <button className={action} disabled={busy}>{copy("Review refund", "راجع الاسترداد")}</button>
                  </form>
                </details>)}
              </li>)}
            </ul>
          </section>
        </>}
      </DialogContent>
    </Dialog>
  );
}
