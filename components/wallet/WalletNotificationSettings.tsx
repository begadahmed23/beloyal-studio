"use client";
import { useEffect, useState } from "react";
import { Bell, Loader2, LockKeyhole, Save } from "lucide-react";
import { walletNotificationPreview, type WalletNotificationSettings } from "@/lib/wallet/notification-text";

type Data = { settings: WalletNotificationSettings; rewardName: string; target: number };
export default function WalletNotificationSettings({ cafeId }: { cafeId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/wallet/notifications?cafeId=${encodeURIComponent(cafeId)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.message); return body as Data; })
      .then(body => { if (!controller.signal.aborted) setData(body); })
      .catch(reason => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [cafeId]);
  async function save() {
    if (!data) return;
    setSaving(true); setError(""); setStatus("");
    try {
      const response = await fetch("/api/wallet/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cafeId, ...data.settings }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setData(body); setStatus("Saved. Your extra messages will appear on future Wallet updates.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setSaving(false); }
  }
  function edit(key: keyof WalletNotificationSettings, value: string | number | boolean | null) {
    setData(previous => previous ? { ...previous, settings: { ...previous.settings, [key]: value } } : previous);
    setStatus("");
  }
  return <section className="mt-7 rounded-3xl border border-black/10 bg-white p-5 text-[#18181b] sm:p-7" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={19}/> Wallet notifications</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Add a little personality to automatic stamp, reward, and start-over notifications. Leave a message blank to use its default wording.</p>
    {!data && !error && <p className="mt-5 flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/> Loading messages…</p>}
    {data && <><div className="mt-6 grid gap-5 lg:grid-cols-3">{([
      { key: "stampSuffix", label: "After a stamp", placeholder: "Thanks for stopping by ☕", ready: false, reset: false },
      { key: "rewardSuffix", label: "When a reward is ready", placeholder: "Your next treat is on us 🎉", ready: true, reset: false },
      { key: "resetSuffix", label: "When the card starts over", placeholder: "A fresh start towards your next reward ✨", ready: false, reset: true },
    ] as const).map(item => <div key={item.key} className="rounded-2xl border border-black/10 p-4 sm:p-5">
      <h3 className="text-sm font-semibold">{item.label}</h3>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-zinc-100 p-3 text-xs leading-5 text-zinc-600"><LockKeyhole size={14} className="mt-0.5 shrink-0"/>{item.reset ? `The live balance resets to 0/${data.target} automatically.` : item.ready ? `The live stamp count and “${data.rewardName}” are added automatically.` : "The live stamp count is added automatically."}</p>
      <label htmlFor={`wallet-${item.key}`} className="mb-2 mt-4 block text-xs font-medium">Your optional extra message</label>
      <input id={`wallet-${item.key}`} type="text" maxLength={100} disabled={saving} value={data.settings[item.key] ?? ""} onChange={event => edit(item.key, event.target.value)} placeholder={item.placeholder} className="min-h-12 w-full rounded-xl border border-black/20 bg-white px-3 py-3 text-base outline-none focus:border-black focus:ring-2 focus:ring-black/10 sm:text-sm"/>
      <p className="mt-1 text-right text-xs text-zinc-400">{(data.settings[item.key] ?? "").length}/100</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Example notification</p>
      <p className="mt-2 break-words rounded-xl bg-zinc-50 p-3 text-sm leading-6">{walletNotificationPreview(`${item.reset ? 0 : item.ready ? data.target : Math.min(3, Math.max(0, data.target - 1))}/${data.target}`, item.ready, data.rewardName, data.settings)}</p>
    </div>)}</div>
    <div className="mt-5 rounded-2xl border border-black/10 p-4 sm:p-5">
      <h3 className="text-sm font-semibold">When a member is nearby</h3>
      <p className="mt-2 text-xs leading-5 text-zinc-500">Wallet can suggest the card on the Lock Screen near your business. This is a nearby card reminder, rather than a new push notification each time someone passes.</p>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-black" checked={data.settings.nearbyEnabled ?? false} disabled={saving} onChange={event => edit("nearbyEnabled", event.target.checked)}/> Enable nearby card reminders</label>
      <label htmlFor="wallet-nearby-message" className="mb-2 mt-3 block text-xs font-medium">Nearby message</label>
      <input id="wallet-nearby-message" maxLength={100} value={data.settings.nearbyMessage ?? ""} disabled={saving} onChange={event => edit("nearbyMessage", event.target.value)} placeholder="Your loyalty card, ready for your next visit nearby." className="min-h-12 w-full rounded-xl border border-black/20 bg-white px-3 py-3 text-base outline-none focus:border-black sm:text-sm"/>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{([
        {key:"nearbyLatitude",label:"Business latitude",min:-90,max:90,placeholder:"e.g. 31.2001"},
        {key:"nearbyLongitude",label:"Business longitude",min:-180,max:180,placeholder:"e.g. 29.9187"},
        {key:"nearbyMaxDistance",label:"Preferred max distance (m)",min:50,max:1000,placeholder:"150"},
      ] as const).map(item => <div key={item.key}><label htmlFor={`wallet-${item.key}`} className="mb-2 block text-xs font-medium">{item.label}</label><input id={`wallet-${item.key}`} type="number" inputMode="decimal" step={item.key === "nearbyMaxDistance" ? 1 : "any"} min={item.min} max={item.max} placeholder={item.placeholder} disabled={saving} value={data.settings[item.key] ?? ""} onChange={event => edit(item.key, event.target.value === "" ? null : Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-black/20 bg-white px-3 py-3 text-base outline-none focus:border-black sm:text-sm"/></div>)}</div>
      <p className="mt-3 text-xs leading-5 text-zinc-500">Use the coordinates from your business’s Google Maps pin. Apple may use a smaller distance and decides when the card appears; device location and Wallet settings also apply.</p>
      <div className="mt-4 rounded-xl bg-zinc-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Nearby reminder preview</p><p className="mt-2 break-words text-sm leading-6">{data.settings.nearbyMessage || "Your nearby reminder will appear here."}</p></div>
    </div>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-zinc-500">Saving doesn’t send a notification. Nearby settings reach installed cards on their next normal update. Stamp counts, reward names, and redemption rules stay managed by BeLoyal.</p><button onClick={save} disabled={saving} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#18181b] px-5 py-3 text-sm font-medium text-white disabled:opacity-40">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save messages & location</button></div></>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    {status && <p role="status" className="mt-4 text-sm text-green-800">{status}</p>}
  </section>;
}
