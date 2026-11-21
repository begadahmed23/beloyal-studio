"use client";
import { useCallback, useEffect, useState } from "react";
type Summary = { recordedSales: number; averagePurchase: number; recordedCount: number; allStamps: number; repeatSpenders: number; recent: { id: string; date: string; amount: number; customer: string; memberNumber: string; location: string }[] };
export default function SpendingAnalytics() {
  const [period, setPeriod] = useState<"30d" | "all">("30d");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/spending/summary?period=" + period, { cache: "no-store" });
      if (!r.ok) throw new Error("Unable to load spending analytics.");
      setData(await r.json());
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load spending data."); }
  }, [period]);
  useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener("members-updated", refresh); return () => window.removeEventListener("members-updated", refresh); }, [load]);
  const money = (v: number) => new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(v) + " EGP";
  return <section className="mt-5 rounded-3xl border p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Customer spending</h2><p className="mt-1 text-sm opacity-60">Only spending entered during stamping is counted, not all shop revenue.</p></div>
      <select value={period} onChange={e => setPeriod(e.target.value as "30d" | "all")} className="rounded-xl border bg-transparent px-3 py-2 text-sm"><option value="30d">Last 30 days</option><option value="all">All recorded history</option></select>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-red-500">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></p>}
    {!data && !error && <p className="mt-4 text-sm opacity-60">Loading spending data...</p>}
    {data && <><div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ["Recorded sales", money(data.recordedSales)],
        ["Average recorded purchase", money(data.averagePurchase)],
        ["Amount coverage", data.recordedCount + " / " + data.allStamps + " stamps"],
        ["Repeat spenders", String(data.repeatSpenders)]
      ].map(([label, value]) => <div key={label} className="rounded-2xl border p-4"><p className="text-xs opacity-60">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}
    </div>
    <h3 className="mt-6 font-semibold">Recent recorded purchases</h3>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b opacity-60"><th className="py-2">Customer</th><th>Location</th><th>When</th><th className="text-right">Amount</th></tr></thead><tbody>{data.recent.map(row => <tr key={row.id} className="border-b"><td className="py-3">{row.customer} <span className="text-xs opacity-50">#{row.memberNumber}</span></td><td>{row.location}</td><td>{new Date(row.date).toLocaleDateString("en-GB")}</td><td className="text-right font-medium">{money(row.amount)}</td></tr>)}</tbody></table>
      {data.recent.length === 0 && <p className="py-4 text-sm opacity-60">No recorded amounts yet. Earlier stamps are not counted as zero.</p>}
    </div></>}
  </section>;
}
