"use client";

import { useCallback, useEffect, useState } from "react";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Entry = { id: string; date: string; amount: number; customer: string; memberNumber: string; location: string };
type Summary = { recordedSales: number; totalMatching: number; page: number; limit: number; dailySpending: { date: string; amount: number }[]; recent: Entry[] };

export default function SpendingAnalytics() {
  const { theme } = useCafeTheme();
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<"newest" | "oldest" | "highest">("newest");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const money = (v: number) => new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(v) + " EGP";
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ period, limit: String(limit), page: String(page), order, search });
      const response = await fetch("/api/spending/summary?" + q, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load customer spending.");
      setData(await response.json());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spending data unavailable.");
    } finally { setLoading(false); }
  }, [period, limit, page, order, search]);

  useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener("members-updated", refresh); return () => window.removeEventListener("members-updated", refresh); }, [load]);

  const selectStyle = { backgroundColor: theme.surfaceRaised, borderColor: theme.border, color: theme.textPrimary, borderRadius: theme.radiusMedium };
  const maxValue = Math.max(1, ...(data?.dailySpending ?? []).map(day => day.amount));
  const totalPages = Math.max(1, Math.ceil((data?.totalMatching ?? 0) / limit));

  return <section className="mt-5 border p-4 sm:p-6" style={{ backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radiusLarge, boxShadow: theme.cardShadow, color: theme.textPrimary }}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Customer spending</h2><p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Recorded purchases from loyalty stamps, not total shop revenue.</p></div>
      <select aria-label="Spending period" value={period} onChange={e => { setPeriod(e.target.value as "7d" | "30d" | "all"); setPage(1); }} className="h-11 border px-3 text-sm" style={selectStyle}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All recorded history</option></select>
    </div>

    {error && <p role="alert" className="mt-4 text-sm" style={{ color: theme.danger }}>{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></p>}
    {data && <>
      <div className="mt-5 border p-5" style={{ backgroundColor: theme.surfaceRaised, borderColor: theme.border, borderRadius: theme.radiusMedium }}>
        <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>Total recorded spending</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{money(data.recordedSales)}</p>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold">Spending by day</h3>
        <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>Daily amounts actually entered by staff. No estimates.</p>
        <div className="mt-4 flex h-48 items-end gap-1 border-b pb-2 sm:gap-2" style={{ borderColor: theme.border }} role="img" aria-label="Recorded purchase amounts by day">
          {data.dailySpending.map(day => <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end" title={day.date + ": " + money(day.amount)}>
            <div className="w-full rounded-t-sm transition-opacity group-hover:opacity-75" style={{ height: Math.max(day.amount > 0 ? 3 : 0, (day.amount / maxValue) * 100) + "%", backgroundColor: theme.accent }} />
          </div>)}
        </div>
        <div className="mt-2 flex justify-between text-xs" style={{ color: theme.textMuted }}><span>{data.dailySpending[0]?.date}</span><span>{data.dailySpending.at(-1)?.date}</span></div>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-semibold">Recent recorded purchases</h3><p className="text-xs" style={{ color: theme.textMuted }}>{data.totalMatching} matching purchases</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Sort purchases" value={order} onChange={e => { setOrder(e.target.value as "newest" | "oldest" | "highest"); setPage(1); }} className="h-10 border px-2 text-sm" style={selectStyle}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option></select>
            <select aria-label="Purchases per page" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="h-10 border px-2 text-sm" style={selectStyle}><option value={10}>Show 10</option><option value={25}>Show 25</option><option value={50}>Show 50</option><option value={100}>Show 100</option></select>
          </div>
        </div>
        <input aria-label="Find customer purchases" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer or member number" className="mt-4 h-11 w-full border px-3 text-sm outline-none focus:ring-2" style={selectStyle} />
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
          <thead><tr className="border-b" style={{ color: theme.textSecondary, borderColor: theme.border }}><th className="py-3">Customer</th><th>Location</th><th>When</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{data.recent.map(row => <tr key={row.id} className="border-b" style={{ borderColor: theme.border }}><td className="py-3 font-medium">{row.customer} <span className="text-xs" style={{ color: theme.textMuted }}>#{row.memberNumber}</span></td><td>{row.location}</td><td>{new Date(row.date).toLocaleDateString("en-GB")}</td><td className="text-right font-semibold">{money(row.amount)}</td></tr>)}</tbody>
        </table>{!data.recent.length && <p className="py-5 text-sm" style={{ color: theme.textMuted }}>No matching recorded purchases.</p>}</div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs" style={{ color: theme.textSecondary }}>
          <span>Page {page} of {totalPages}{loading ? " · Updating..." : ""}</span>
          <div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(v => Math.max(1, v - 1))} className="rounded-lg border px-3 py-2 disabled:opacity-40" style={{ borderColor: theme.border }}>Previous</button><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(v => v + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40" style={{ borderColor: theme.border }}>Next</button></div>
        </div>
      </div>
    </>}
    {loading && !data && !error && <p className="mt-4 text-sm" style={{ color: theme.textMuted }}>Loading spending records...</p>}
  </section>;
}
