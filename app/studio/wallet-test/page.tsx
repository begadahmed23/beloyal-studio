"use client";
import { useState } from "react";

type Card = { name: string; memberNumber: string; business: string; devices: number };
export default function WalletTestPage() {
  const [link, setLink] = useState("");
  const [card, setCard] = useState<Card | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const token = link.trim().split("/").pop()?.split("?")[0] ?? "";
  async function run(send: boolean) {
    setBusy(true); setStatus("");
    try {
      const response = await fetch(send ? "/api/studio/wallet-test" : `/api/studio/wallet-test?token=${encodeURIComponent(token)}`, {
        method: send ? "POST" : "GET", headers: { "Content-Type": "application/json" },
        ...(send ? { body: JSON.stringify({ token }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (send) setStatus(data.message); else setCard(data);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not complete request."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#F5F5F7] px-5 py-12 text-[#171719]">
    <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
      <a href="/studio" className="text-sm underline">← BeLoyal Studio</a>
      <h1 className="mt-6 text-2xl font-semibold">Loretto Wallet test</h1>
      <p className="mt-3 text-sm text-gray-600">Test on your own card. Stamps and rewards stay the same. Only the selected card receives this update.</p>
      <label htmlFor="card-link" className="mt-6 block text-sm font-medium">Customer card link</label>
      <input id="card-link" type="url" value={link} onChange={e => { setLink(e.target.value); setCard(null); }} className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="https://www.getbeloyal.app/card/…" />
      <button disabled={busy || !token} onClick={() => run(false)} className="mt-4 rounded-xl bg-black px-5 py-3 text-sm text-white disabled:opacity-40">Check Wallet registration</button>
      {card && <section className="mt-6 rounded-2xl bg-gray-50 p-5">
        <p className="font-medium">{card.name} · {card.memberNumber}</p><p className="mt-1 text-sm">{card.business} · {card.devices} registered device(s)</p>
        <p className="mt-4 text-sm">For this second test, leave Wallet closed and lock your iPhone before pressing Send. Do not manually refresh the card. Make sure Automatic Updates and Allow Notifications are enabled in the card’s details.</p>
        <p className="mt-4 rounded-xl border bg-white p-3 text-sm">Second BeLoyal test — automatic Loretto update ☕</p>
        <button disabled={busy || !card.devices} onClick={() => run(true)} className="mt-4 rounded-xl bg-black px-5 py-3 text-sm text-white disabled:opacity-40">Send test to this card</button>
      </section>}
      <p role="status" aria-live="polite" className="mt-4 text-sm">{busy ? "Working…" : status}</p>
    </div>
  </main>;
}
