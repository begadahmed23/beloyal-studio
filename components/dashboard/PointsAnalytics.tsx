"use client";

import { useState } from "react";
import { CreditCard, Flame, Gift, MapPin, TrendingUp, Users } from "lucide-react";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

type Analytics = { members: number; newMembers: number; returning: number; outstanding: string; today: string };
type Breakdown = {
  daily: { name: string; amount: string }[];
  branches: { id: string; name: string; count: number; amount: string }[];
  popular: { name: string | null; count: number }[];
};

function calendarDays(today: string, amount: number, spending: Breakdown["daily"]) {
  const observed = new Map(spending.map(day => [day.name, Number(day.amount)]));
  const timestamp = Date.parse(today + "T00:00:00Z");
  if (!Number.isFinite(timestamp)) return [];
  return Array.from({ length: amount }, (_, index) => {
    const day = new Date(timestamp - (amount - 1 - index) * 86400000).toISOString().slice(0, 10);
    return { day, amount: observed.get(day) ?? 0 };
  });
}

const panel = "min-w-0 rounded-[24px] border border-border bg-card p-4 sm:p-6";

export default function PointsAnalytics({ analytics, breakdown, purchaseCount, netSpending, issued, redeemed, rewards, unit }: {
  analytics: Analytics;
  breakdown: Breakdown;
  purchaseCount: number;
  netSpending: number;
  issued: number;
  redeemed: number;
  rewards: number;
  unit: string;
}) {
  const { arabic } = useBeLoyalLanguage();
  const copy = (en: string, ar: string) => arabic ? ar : en;
  const locale = arabic ? "ar-EG" : "en-EG";
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EGP" }).format(amount);
  const date = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z"));
  const [range, setRange] = useState(7);
  const [selected, setSelected] = useState<string>();
  const days = calendarDays(analytics.today, range, breakdown.daily);
  const focus = days.find(day => day.day === selected);
  const max = Math.max(1, ...days.map(day => day.amount));
  const min = Math.min(0, ...days.map(day => day.amount));
  const maxBranch = Math.max(1, ...breakdown.branches.map(branch => Number(branch.amount)));
  const hasActivity = breakdown.daily.some(day => days.some(slot => slot.day === day.name));
  const stats = [
    { label: copy("Recorded spending", "الإنفاق المسجل"), value: money(netSpending), help: copy("After refunds", "بعد الاسترداد"), icon: CreditCard },
    { label: copy("Purchases", "عمليات الشراء"), value: numbers.format(purchaseCount), help: copy("Recorded transactions", "عمليات مسجلة"), icon: TrendingUp },
    { label: copy("Members", "الأعضاء"), value: numbers.format(analytics.members), help: copy(`${numbers.format(analytics.newMembers)} new in 30 days`, `${numbers.format(analytics.newMembers)} جديد خلال ٣٠ يوم`), icon: Users },
    { label: copy("Rewards redeemed", "المكافآت المستبدلة"), value: numbers.format(rewards), help: `${numbers.format(redeemed)} ${unit}`, icon: Gift },
  ];

  return (
    <section aria-label={copy("Loyalty analytics", "تحليلات الولاء")} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, help, icon: Icon }) => <article key={label} className={`${panel} p-3 sm:p-5`}>
          <div className="inline-flex rounded-lg bg-primary/12 p-2 text-primary"><Icon size={17} aria-hidden="true" /></div>
          <p className="mt-3 text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1 wrap-anywhere text-lg font-semibold tracking-tight tabular-nums sm:text-2xl"><bdi>{value}</bdi></p>
          <p className="mt-1 text-xs text-muted-foreground">{help}</p>
        </article>)}
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className={panel} aria-label={copy("Spending trend", "اتجاه الإنفاق")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">{copy("Spending trend", "اتجاه الإنفاق")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{copy("Daily totals after refunds", "الإجمالي اليومي بعد الاسترداد")}</p>
            </div>
            <div className="flex shrink-0 rounded-xl border border-border bg-secondary/35 p-0.5" aria-label={copy("Date range", "الفترة")}>
              {[7, 30].map(value => <button key={value} type="button" aria-pressed={value === range}
                className={`min-h-11 rounded-lg px-3 text-xs font-semibold ${value === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setRange(value); setSelected(undefined); }}>{copy(`${value} days`, `${numbers.format(value)} أيام`)}</button>)}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-y border-border py-3">
            <p className="text-sm text-muted-foreground">{focus ? date(focus.day) : copy("Period total", "إجمالي الفترة")}</p>
            <p className="wrap-anywhere text-lg font-semibold tabular-nums" aria-live="polite"><bdi>{money(focus?.amount ?? days.reduce((sum, day) => sum + day.amount, 0))}</bdi></p>
          </div>
          {hasActivity ? <>
            <div className="mt-4 flex h-32 min-w-0 gap-1 sm:h-40 sm:gap-1.5">
              {days.map(day => <button type="button" aria-label={`${date(day.day)}, ${money(day.amount)}`} key={day.day}
                aria-pressed={day.day === focus?.day} onClick={() => setSelected(current => current === day.day ? undefined : day.day)}
                className={`relative min-w-0 flex-1 rounded-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary ${day.day === focus?.day ? "bg-secondary" : "hover:bg-secondary/45"}`}>
                <span className="absolute inset-x-0 border-t border-border" aria-hidden="true" style={{ bottom: `${-min / (max - min) * 100}%` }} />
                <span aria-hidden="true" className={`absolute inset-x-0.5 min-h-0 rounded-sm ${day.amount < 0 ? "bg-destructive/80" : "bg-primary/85"}`}
                  style={{ bottom: `${(Math.min(0, day.amount) - min) / (max - min) * 100}%`, height: `${Math.abs(day.amount) / (max - min) * 100}%` }} />
              </button>)}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{date(days[0].day)}</span><span>{date(days[days.length - 1].day)}</span></div>
            <details className="mt-2 text-sm">
              <summary className="min-h-11 cursor-pointer content-center text-muted-foreground">{copy("Daily totals", "الإجمالي اليومي")}</summary>
              <ul className="max-h-52 divide-y divide-border overflow-auto">{days.map(day => <li key={day.day} className="flex flex-wrap justify-between gap-2 py-2"><span>{date(day.day)}</span><bdi className="tabular-nums">{money(day.amount)}</bdi></li>)}</ul>
            </details>
          </> : <p className="mt-4 grid min-h-28 place-items-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{copy("No spending recorded in this period.", "مفيش إنفاق مسجل خلال الفترة دي.")}</p>}
        </section>
        <section className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} className="text-primary" aria-hidden="true" />{copy("Branches", "الفروع")}</h2>
          {breakdown.branches.length ? <ul className="mt-3 space-y-3">{breakdown.branches.map(branch => <li key={branch.id} className="min-w-0 rounded-xl border border-border p-3">
            <div className="flex flex-wrap justify-between gap-1">
              <p className="wrap-anywhere font-medium">{branch.name}</p>
              <p className="wrap-anywhere font-semibold tabular-nums"><bdi>{money(Number(branch.amount))}</bdi></p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{numbers.format(branch.count)} {copy("purchases", "عملية شراء")}</p>
            {Number(branch.amount) > 0 && <div className="mt-3 h-1.5 rounded-full bg-secondary" aria-hidden="true"><div className="h-full rounded-full bg-primary" style={{ width: `${Number(branch.amount) / maxBranch * 100}%` }} /></div>}
          </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{copy("No branches added yet.", "مفيش فروع مضافة لسه.")}</p>}
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div><dt className="text-xs text-muted-foreground">{copy("Returning members", "الأعضاء العائدون")}</dt><dd className="mt-1 font-semibold">{numbers.format(analytics.returning)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{copy("Net spending per purchase", "صافي الإنفاق لكل عملية شراء")}</dt><dd className="mt-1 wrap-anywhere font-semibold"><bdi>{money(netSpending / (purchaseCount || 1))}</bdi></dd></div>
          </dl>
        </section>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Flame size={18} className="text-primary" aria-hidden="true" />{copy("Loyalty balances", "أرصدة الولاء")}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0"><dt className="text-muted-foreground">{copy("Held by members", "في رصيد الأعضاء")}</dt><dd className="mt-1 wrap-anywhere font-semibold">{numbers.format(Number(analytics.outstanding))} {unit}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">{copy("Earned from purchases", "المكتسبة من المشتريات")}</dt><dd className="mt-1 wrap-anywhere font-semibold">{numbers.format(issued)} {unit}</dd></div>
          </dl>
        </section>
        <section className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Gift size={18} className="text-primary" aria-hidden="true" />{copy("Popular rewards", "أشهر المكافآت")}</h2>
          {breakdown.popular.length ? <ul className="mt-2 divide-y divide-border">{breakdown.popular.map(reward => <li key={reward.name ?? ""} className="flex justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 wrap-anywhere">{reward.name ?? copy("Reward", "مكافأة")}</span><span className="tabular-nums">{numbers.format(reward.count)}</span>
          </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{copy("No rewards redeemed yet.", "مفيش مكافآت مستبدلة لسه.")}</p>}
        </section>
      </div>
    </section>
  );
}
