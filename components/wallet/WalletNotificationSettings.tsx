"use client";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Bell, Loader2, LockKeyhole, Save } from "lucide-react";
import { walletNotificationPreview, type WalletLocation, type WalletNotificationSettings } from "@/lib/wallet/notification-text";

type Data = { settings: WalletNotificationSettings; rewardName: string; target: number };
export default function WalletNotificationSettings({ cafeId, manageLocation = false }: { cafeId: string; manageLocation?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/wallet/notifications?cafeId=${encodeURIComponent(cafeId)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.message); return body as Data; })
      .then(body => { if (!controller.signal.aborted) setData(body); })
      .catch(reason => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [cafeId]);
  async function save() {
    if (!data || savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setError(""); setStatus("");
    try {
      const response = await fetch("/api/wallet/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cafeId, ...(manageLocation ? data.settings : { stampSuffix: data.settings.stampSuffix, rewardSuffix: data.settings.rewardSuffix, resetSuffix: data.settings.resetSuffix }) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setData(body); setStatus("Saved. Wallet will use the new wording the next time it updates a card.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { savingRef.current = false; setSaving(false); }
  }
  function edit(key: keyof WalletNotificationSettings, value: string | number | boolean | null) {
    setData(previous => previous ? { ...previous, settings: { ...previous.settings, [key]: value } } : previous);
    setStatus("");
  }
  const locations: WalletLocation[] = data?.settings.nearbyLocations ?? (data?.settings.nearbyLatitude != null && data.settings.nearbyLongitude != null ? [{name:"Main branch",latitude:data.settings.nearbyLatitude,longitude:data.settings.nearbyLongitude,message:data.settings.nearbyMessage || "Your loyalty card is ready nearby."}] : []);
  function setLocations(value: WalletLocation[]) {
    setData(previous => previous ? {...previous,settings:{...previous.settings,nearbyLocations:value}} : previous);
    setStatus("");
  }
  return <section className="mt-5 rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-4 text-[var(--wallet-text,#18181b)] sm:p-6" >
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={19}/> Wallet notifications</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--wallet-muted,#71717a)]">These Apple Wallet messages go out after a stamp, when a reward is ready, and when the card starts over. Leave a field blank to use BeLoyal’s message.</p>
    {!data && !error && <p className="mt-5 flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/> Loading messages…</p>}
    {data && <><div className="mt-6 grid gap-5 xl:grid-cols-3">{([
      { key: "stampSuffix", label: "After a stamp", placeholder: "Thanks for stopping by ☕", ready: false, reset: false },
      { key: "rewardSuffix", label: "When a reward is ready", placeholder: "Your next treat is on us 🎉", ready: true, reset: false },
      { key: "resetSuffix", label: "When the card starts over", placeholder: "A fresh start towards your next reward ✨", ready: false, reset: true },
    ] as const).map(item => <div key={item.key} className="rounded-2xl border border-[var(--wallet-border,#e4e4e7)] p-4 sm:p-5">
      <h3 className="text-sm font-semibold">{item.label}</h3>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--wallet-raised,#f4f4f5)] p-3 text-xs leading-5 text-[var(--wallet-secondary,#52525b)]"><LockKeyhole size={14} className="mt-0.5 shrink-0"/>{item.reset ? `The card goes back to 0/${data.target} automatically.` : item.ready ? `BeLoyal adds the stamp count and “${data.rewardName}” automatically.` : "BeLoyal adds the stamp count for you."}</p>
      <label htmlFor={`wallet-${item.key}`} className="mb-2 mt-4 block text-xs font-medium">Add your own line (optional)</label>
      <input id={`wallet-${item.key}`} type="text" maxLength={100} disabled={saving} value={data.settings[item.key] ?? ""} onChange={event => edit(item.key, event.target.value)} placeholder={item.placeholder} className="min-h-12 w-full rounded-xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] px-3 py-3 text-base outline-none focus:border-[var(--wallet-accent,#18181b)] focus:ring-2 focus:ring-black/10 sm:text-sm"/>
      <p className="mt-1 text-right text-xs text-[var(--wallet-muted,#71717a)]">{(data.settings[item.key] ?? "").length}/100</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--wallet-muted,#71717a)]">Example notification</p>
      <p className="mt-2 break-words rounded-xl bg-[var(--wallet-raised,#fafafa)] p-3 text-sm leading-6">{walletNotificationPreview(`${item.reset ? 0 : item.ready ? data.target : Math.min(3, Math.max(0, data.target - 1))}/${data.target}`, item.ready, data.rewardName, data.settings)}</p>
    </div>)}</div>
    {!manageLocation && locations.length>0 && <div className="mt-5 rounded-2xl border p-4"><h3 className="text-sm font-semibold">Business locations</h3>{locations.map((l,i)=><div key={i} className="mt-3 text-sm">{l.name} · {data.settings.nearbyEnabled ? "Nearby reminders enabled" : "Reminders disabled"}</div>)}</div>}
    {manageLocation && <div className="mt-5 rounded-2xl border border-[var(--wallet-border,#e4e4e7)] p-4 sm:p-5">
      <h3 className="text-sm font-semibold">When a member is nearby</h3>
      <p className="mt-2 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">Wallet may show the loyalty card on a member’s lock screen near a branch. The phone decides when the reminder appears.</p>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--wallet-accent,#18181b)]" checked={data.settings.nearbyEnabled ?? false} disabled={saving} onChange={event => edit("nearbyEnabled", event.target.checked)}/> Enable nearby card reminders</label>
      <p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">{locations.length}/10 locations · All branches share the same loyalty card. Apple supports custom text; Google chooses its own reminder wording.</p>
      {locations.map((location,index)=><div key={index} className="mt-4 space-y-2 rounded-xl border p-3">
        <div className="flex items-center justify-between"><span className="text-xs font-semibold">Branch {index+1}</span><button type="button" disabled={saving} onClick={()=>setLocations(locations.filter((_,i)=>i!==index))} className="min-h-11 px-2 text-xs text-red-700">Remove</button></div>
        <label className="block text-xs">Branch name<input className="mt-1 w-full rounded-lg border p-3 text-sm" maxLength={80} value={location.name} disabled={saving} onChange={e=>setLocations(locations.map((l,i)=>i===index?{...l,name:e.target.value}:l))}/></label> 
        <label className="block text-xs">Google Maps link<input type="url" placeholder="https://maps.app.goo.gl/..." className="mt-1 w-full rounded-lg border p-3 text-sm" value={location.mapsUrl ?? ""} disabled={saving} onChange={e=>setLocations(locations.map((l,i)=>i===index?{...l,mapsUrl:e.target.value,latitude:NaN,longitude:NaN}:l))}/></label>
        {Number.isFinite(location.latitude)&&Number.isFinite(location.longitude)&&<p className="text-xs text-green-700">Location configured</p>}
        <label className="block text-xs">Apple nearby message<input className="mt-1 w-full rounded-lg border p-3 text-sm" maxLength={100} value={location.message} disabled={saving} onChange={e=>setLocations(locations.map((l,i)=>i===index?{...l,message:e.target.value}:l))}/></label>
      </div>)}
      <button type="button" disabled={saving||locations.length>=10} onClick={()=>setLocations([...locations,{name:"",latitude:NaN,longitude:NaN,message:"Your loyalty card is ready for your next visit."}])} className="mt-3 rounded-xl border px-4 py-3 text-sm disabled:opacity-40">+ Add branch</button>
      <p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">Paste the Google Maps link for each branch. Device permissions and Wallet determine when reminders appear.</p>
    </div>}
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-[var(--wallet-muted,#71717a)]">These changes take effect the next time Wallet updates the card.</p><ActionButton onClick={save} pending={saving} icon={<Save size={16} />} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--wallet-accent,#18181b)] px-5 py-3 text-sm font-medium text-[var(--wallet-accent-text,#ffffff)] disabled:opacity-60">{manageLocation ? "Save messages and locations" : "Save messages"}</ActionButton></div></>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <p role="status" className="mt-3 min-h-5 text-sm">{saving ? "Saving messages…" : status}</p>
  </section>;
}
