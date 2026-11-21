"use client";
import { useEffect, useState } from "react";
type Item = { id: string; date: string; amount: number; location: string };
type History = { total: number; purchaseCount: number; recent: Item[] };
export default function CustomerSpendingHistory({ customerId, active }: { customerId: string; active: boolean }) {
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/spending/customer/" + encodeURIComponent(customerId), { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("Unable to load spending history"); return r.json() as Promise<History>; })
      .then(data => { if (!cancelled) { setHistory(data); setError(""); } })
      .catch(() => { if (!cancelled) setError("Spending history unavailable"); });
    return () => { cancelled = true; };
  }, [customerId, active]);
  return <section className="rounded-2xl border p-4">
    <h3 className="font-semibold">Recorded customer spending</h3>
    <p className="mt-1 text-xs opacity-60">Only amounts entered when stamps were added. Older or skipped amounts are excluded.</p>
    {!history && !error && <p className="mt-3 text-sm opacity-60">Loading...</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
    {history && <>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2"><strong className="text-xl">{history.total.toLocaleString("en-EG")} EGP</strong><span className="text-xs opacity-60">{history.purchaseCount} recorded purchases</span></div>
      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">{history.recent.map(item => <div key={item.id} className="flex justify-between gap-3 border-t pt-2 text-xs"><span>{new Date(item.date).toLocaleDateString("en-GB")} · {item.location}</span><span className="font-medium">{item.amount.toLocaleString("en-EG")} EGP</span></div>)}</div>
      {!history.recent.length && <p className="mt-3 text-xs opacity-60">No purchase amounts recorded.</p>}
    </>}
  </section>;
}
