"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, ReceiptText, Search, TrendingUp } from "lucide-react";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Entry = { id: string; date: string; amount: number; customer: string; memberNumber: string; location: string };
type Day = { date: string; amount: number };
type Summary = {
  recordedSales: number; recordedPurchases: number; totalMatching: number;
  page: number; limit: number; dailySpending: Day[]; recent: Entry[];
};
const cash = (amount: number) => new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(amount);
const dateLabel = (date: string) => {
  const parts = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(parts[0], (parts[1] || 1) - 1, parts[2] || 1)));
};

export default function SpendingAnalytics() {
  const { theme } = useCafeTheme();
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("7d");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<"newest" | "oldest" | "highest">("newest");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ period, limit: String(limit), page: String(page), order, search });
      const response = await fetch("/api/spending/summary?" + query, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load spending records.");
      const value = await response.json() as Summary;
      setData(value);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load spending records.");
    } finally {
      setLoading(false);
    }
  }, [period, limit, page, order, search]);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("members-updated", refresh);
    return () => window.removeEventListener("members-updated", refresh);
  }, [load]);

  const days = data?.dailySpending ?? [];
  const selected = useMemo(() => days.find(day => day.date === selectedDay) ?? days.at(-1), [days, selectedDay]);
  const maximum = Math.max(1, ...days.map(day => day.amount));
  const totalPages = Math.max(1, Math.ceil((data?.totalMatching ?? 0) / limit));
  const muted = theme.textMuted;
  const field = { backgroundColor: theme.surfaceRaised, color: theme.textPrimary, borderColor: theme.border, borderRadius: theme.radiusMedium };

  return (
    <section className="mt-5 overflow-hidden border p-4 sm:p-6" style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary, borderRadius: theme.radiusLarge }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: theme.accent }}>Spending insights</p>
          <h2 className="mt-1 text-2xl font-semibold">Customer spending</h2>
          <p className="mt-1 text-sm" style={{ color: muted }}>Only purchases with a recorded amount. Not total shop revenue.</p>
        </div>
        <select aria-label="Spending period" value={period}
          onChange={e => { setPeriod(e.target.value as "7d" | "30d" | "all"); setPage(1); setSelectedDay(null); }}
          className="h-11 w-full border px-3 text-sm sm:w-auto" style={field}>
          <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All recorded history</option>
        </select>
      </div>

      {error && <div role="alert" className="mt-4 text-sm" style={{ color: theme.danger }}>{error} <button onClick={() => void load()} className="underline">Retry</button></div>}

      {data && <>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-2xl border p-3 sm:p-5" style={{ backgroundColor: theme.surfaceRaised, borderColor: theme.border }}>
            <div className="flex items-center gap-2" style={{ color: muted }}><CreditCard size={15}/><span className="text-xs">Recorded spending</span></div>
            <p className="mt-3 break-words text-2xl font-semibold tabular-nums sm:text-3xl">{cash(data.recordedSales)} <span className="text-sm font-medium">EGP</span></p>
          </div>
          <div className="rounded-2xl border p-3 sm:p-5" style={{ backgroundColor: theme.surfaceRaised, borderColor: theme.border }}>
            <div className="flex items-center gap-2" style={{ color: muted }}><ReceiptText size={15}/><span className="text-xs">Recorded purchases</span></div>
            <p className="mt-3 text-2xl font-semibold tabular-nums sm:text-3xl">{data.recordedPurchases}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border p-3 sm:p-5" style={{ borderColor: theme.border, backgroundColor: theme.surfaceRaised }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="flex items-center gap-2"><TrendingUp size={17} style={{ color: theme.accent }}/><h3 className="font-semibold">Spending by day</h3></div><p className="mt-1 text-xs" style={{ color: muted }}>Select a bar to view the exact amount</p></div>
            <div className="text-right"><p className="text-[11px]" style={{ color: muted }}>{selected ? dateLabel(selected.date) : "Daily spending"}</p><p className="text-lg font-semibold tabular-nums">{cash(selected?.amount ?? 0)} EGP</p></div>
          </div>
          <div className="mt-5 overflow-x-auto pb-2">
            <div className="flex h-52 min-w-full items-end gap-2 border-b pb-1" style={{ width: days.length > 10 ? days.length * 37 : "100%", borderColor: theme.border }}>
              {days.map(day => {
                const active = day.date === (selected?.date ?? "");
                const height = day.amount ? Math.max(8, Math.round(100 * day.amount / maximum)) : 0;
                return <button type="button" key={day.date} onClick={() => setSelectedDay(day.date)} title={dateLabel(day.date) + ": " + cash(day.amount) + " EGP"}
                  aria-label={dateLabel(day.date) + ", " + cash(day.amount) + " EGP"}
                  className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" style={{ minWidth: days.length > 10 ? 27 : 25 }}>
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: active ? theme.textPrimary : muted }}>{day.amount > 0 ? cash(day.amount) : "0"}</span>
                  <span className="w-full max-w-11 rounded-t-md transition-opacity group-hover:opacity-75"
                    style={{ height: height + "%", minHeight: day.amount > 0 ? 8 : 2, backgroundColor: day.amount === 0 ? theme.border : theme.accent, opacity: active ? 1 : .7 }} />
                  <span className="absolute -bottom-5 text-[10px]" style={{ color: muted }}>{dateLabel(day.date).split(" ")[0]}</span>
                </button>;
              })}
            </div>
            <div className="h-6"/>
          </div>
          <p className="mt-1 text-xs" style={{ color: muted }}>{period === "all" ? "Chart displays the most recent 30 days; total above includes all recorded history." : "Values are recorded transactions, grouped by the cafe's local day."}</p>
        </div>

        <div className="mt-7">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="text-lg font-semibold">Recent recorded purchases</h3><p className="mt-1 text-xs" style={{ color: muted }}>{data.totalMatching} matching transactions</p></div>
            <CalendarDays size={19} style={{ color: theme.accent }}/>
          </div>

          <label className="mt-4 flex h-11 items-center gap-2 border px-3" style={field}>
            <Search size={16} style={{ color: muted }}/>
            <input aria-label="Search purchases" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search customer or member ID" className="w-full min-w-0 bg-transparent text-sm outline-none" />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select aria-label="Sort purchases" value={order} onChange={e => { setOrder(e.target.value as "newest" | "oldest" | "highest"); setPage(1); }} className="h-11 min-w-0 border px-2 text-sm" style={field}>
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option>
            </select>
            <select aria-label="Purchases per page" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="h-11 min-w-0 border px-2 text-sm" style={field}>
              <option value={10}>Show 10</option><option value={25}>Show 25</option><option value={50}>Show 50</option><option value={100}>Show 100</option>
            </select>
          </div>

          <div className="mt-3 space-y-2 sm:hidden">
            {data.recent.map(entry => <div key={entry.id} className="rounded-xl border p-3" style={{ borderColor: theme.border, backgroundColor: theme.surfaceRaised }}>
              <div className="flex items-start justify-between gap-2"><p className="min-w-0 break-words text-sm font-semibold">{entry.customer}</p><p className="shrink-0 text-sm font-semibold tabular-nums">{cash(entry.amount)} EGP</p></div>
              <p className="mt-1 text-xs" style={{ color: muted }}>#{entry.memberNumber} · {entry.location} · {new Date(entry.date).toLocaleDateString("en-GB")}</p>
            </div>)}
          </div>
          <div className="mt-3 hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm"><thead><tr className="border-b" style={{ borderColor: theme.border, color: muted }}><th className="py-3">Customer</th><th>Location</th><th>When</th><th className="text-right">Amount</th></tr></thead>
            <tbody>{data.recent.map(entry => <tr key={entry.id} className="border-b" style={{ borderColor: theme.border }}>
              <td className="py-3">{entry.customer} <span className="text-xs" style={{ color: muted }}>#{entry.memberNumber}</span></td>
              <td>{entry.location}</td><td>{new Date(entry.date).toLocaleDateString("en-GB")}</td><td className="text-right font-semibold">{cash(entry.amount)} EGP</td>
            </tr>)}</tbody></table>
          </div>
          {!data.recent.length && <p className="py-6 text-center text-sm" style={{ color: muted }}>No recorded purchases match these filters.</p>}
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span style={{ color: muted }}>Page {page} of {totalPages}{loading ? " · Refreshing" : ""}</span>
            <div className="flex gap-2">
              <button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage(v => Math.max(1, v - 1))} className="grid size-10 place-items-center rounded-lg border disabled:opacity-30" style={{ borderColor: theme.border }}><ChevronLeft size={18}/></button>
              <button aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => setPage(v => v + 1)} className="grid size-10 place-items-center rounded-lg border disabled:opacity-30" style={{ borderColor: theme.border }}><ChevronRight size={18}/></button>
            </div>
          </div>
        </div>
      </>}
      {loading && !data && !error && <p className="mt-6 text-sm" style={{ color: muted }}>Loading spending analytics...</p>}
    </section>
  );
}
