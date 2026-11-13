"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, Cake, Check, Clock3, Gift, Loader2, Search, Send, Smartphone, Users, Wallet } from "lucide-react";
import { campaignSegments, MAX_CAMPAIGN_RECIPIENTS, type CampaignMember, type CampaignSegment } from "@/lib/wallet/campaign-segments";
import WalletNotificationSettings from "./WalletNotificationSettings";
import type { WalletCampaign } from "@/lib/wallet/campaigns";

type Business = { id: string; name: string };
type Audience = { cafe: Business & { timezone: string; rewardName: string }; totalMembers: number; members: CampaignMember[]; counts: Record<CampaignSegment, number>; history: WalletCampaign[] };
const field = "w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:opacity-40";
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#18181b] px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-40";
function totals(campaign: WalletCampaign) {
  return { accepted: campaign.recipients.filter(r => r.status === "accepted").length, failed: campaign.recipients.filter(r => r.status === "failed").length,
    skipped: campaign.recipients.filter(r => r.status === "skipped").length, pending: campaign.recipients.filter(r => r.status === "pending").length };
}
export default function WalletCampaigns({ businesses, initialCafeId, studio = false }: { businesses: Business[]; initialCafeId: string; studio?: boolean }) {
  const [cafeId, setCafeId] = useState(initialCafeId);
  const [data, setData] = useState<Audience | null>(null);
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<WalletCampaign | null>(null);
  const [result, setResult] = useState<WalletCampaign | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [revision, setRevision] = useState(0);
  const reviewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cafeId) return;
    const controller = new AbortController();
    fetch(`/api/wallet/campaigns?cafeId=${encodeURIComponent(cafeId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.message); return body as Audience; })
      .then(body => { setData(body); setError(""); })
      .catch(reason => { if (reason.name !== "AbortError") setError(reason.message || "Could not load Wallet members."); });
    return () => controller.abort();
  }, [cafeId, revision]);
  const eligible = useMemo(() => data?.members.filter(member => member.segments.includes(segment)) ?? [], [data, segment]);
  const visible = useMemo(() => eligible.filter(member => `${member.name} ${member.memberNumber}`.toLowerCase().includes(search.toLowerCase())), [eligible, search]);
  function resetReview() { setReview(null); setResult(null); setError(""); }
  function changeBusiness(id: string) { setCafeId(id); setData(null); setSelected([]); setMessage(""); setSearch(""); setSegment("all"); resetReview(); }
  function toggle(id: string) {
    resetReview();
    setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : previous.length < MAX_CAMPAIGN_RECIPIENTS ? [...previous, id] : previous);
  }
  async function request(action: "preview" | "send") {
    setBusy(action); setError("");
    try {
      const response = await fetch("/api/wallet/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "preview"
        ? { action, cafeId, segment, message, customerIds: selected }
        : { action, cafeId, campaignId: review?.id }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      if (action === "preview") { setReview(body.campaign); setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }
      else { setResult(body.campaign); setReview(null); setSelected([]); setRevision(value => value + 1); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed. Refresh history before trying again."); }
    finally { setBusy(null); }
  }
  const chosenSegment = campaignSegments.find(value => value.id === segment)!;
  const business = data?.cafe.name ?? businesses.find(value => value.id === cafeId)?.name ?? "Your business";
  return <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }} className="rounded-[28px] bg-[#f6f6f7] p-4 text-[#18181b] sm:p-7 lg:p-9">
    {studio && <a href="/studio" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-zinc-600 hover:text-black"><ArrowLeft size={16} /> BeLoyal Studio</a>}
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium"><Wallet size={14} /> Apple Wallet</div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">A little reason to return.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Send a personal card update to the right members, straight to their Apple Wallet.</p>
      </div>
      {studio && <div className="w-full sm:w-64"><label htmlFor="campaign-business" className="mb-2 block text-xs font-medium text-zinc-600">Business</label>
        <select id="campaign-business" className={field} value={cafeId} disabled={!!busy} onChange={event => changeBusiness(event.target.value)}>{businesses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
    </header>
    {!businesses.length && <p className="mt-8 text-sm">Create an active business to start a Wallet campaign.</p>}
    <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-4">{[
      { label: "Total members", value: data?.totalMembers, icon: Users },
      { label: "Wallet members", value: data?.members.length, icon: Wallet },
      { label: "Selected", value: selected.length, icon: Check },
    ].map(stat => <div key={stat.label} className="rounded-2xl border border-black/[0.07] bg-white p-3 sm:p-5"><stat.icon size={17} className="mb-3 text-zinc-400"/><p className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value ?? "—"}</p><p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">{stat.label}</p></div>)}</div>
    <section className="mt-7 rounded-3xl border border-black/[0.07] bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold">01</span><div><h2 className="font-semibold">Choose your people</h2><p className="mt-1 text-xs leading-5 text-zinc-500">Only members with a registered Wallet card appear. Notification settings are controlled by each customer.</p></div></div>
      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">{campaignSegments.map(item => <button key={item.id} disabled={!!busy} aria-pressed={segment === item.id} onClick={() => { setSegment(item.id); setSelected([]); setSearch(""); resetReview(); }} className={`min-h-24 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${segment === item.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-black/10 bg-white hover:bg-zinc-50"}`}><p className="text-2xl font-semibold">{data?.counts[item.id] ?? "—"}</p><p className={`mt-2 text-xs ${segment === item.id ? "text-white/80" : "text-zinc-500"}`}>{item.label}</p></button>)}</div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-zinc-500">{chosenSegment.description}</p>
        <button type="button" disabled={!!busy} onClick={() => { setData(null); setSelected([]); resetReview(); setRevision(value => value + 1); }} className="min-h-11 text-xs font-medium underline underline-offset-4">Refresh audience & history</button></div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3.5 text-zinc-400"/><input aria-label="Search Wallet members" className={`${field} pl-10`} placeholder="Search by name or member number" value={search} disabled={!!busy} onChange={event => setSearch(event.target.value)}/></div>
        <button disabled={!!busy || !visible.length} className={secondary} onClick={() => { resetReview(); setSelected(visible.slice(0, MAX_CAMPAIGN_RECIPIENTS).map(member => member.id)); }}>Select {Math.min(visible.length, MAX_CAMPAIGN_RECIPIENTS)} shown</button>
        {!!selected.length && <button disabled={!!busy} className={secondary} onClick={() => { setSelected([]); resetReview(); }}>Clear</button>}</div>
      <p className="mt-3 text-xs text-zinc-500">{eligible.length} eligible · {selected.length}/{MAX_CAMPAIGN_RECIPIENTS} selected per campaign. The 30+ day group is also included in 14+ days.</p>
      <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-black/10">
        {!data && !error && <p className="flex items-center gap-2 p-5 text-sm text-zinc-500"><Loader2 size={16} className="animate-spin"/> Checking Wallet members…</p>}
        {data && !visible.length && <div className="p-7 text-center"><Wallet size={24} className="mx-auto text-zinc-300"/><p className="mt-3 text-sm font-medium">No Wallet members in this group yet</p><p className="mt-1 text-xs leading-5 text-zinc-500">As members add their cards, they’ll appear here automatically. Try another group or refresh the audience.</p></div>}
        {visible.slice(0, 200).map(member => <label key={member.id} className="flex min-h-20 cursor-pointer items-center gap-3 border-b border-black/5 p-4 last:border-0 hover:bg-zinc-50"><input type="checkbox" className="h-4 w-4 shrink-0 accent-black" checked={selected.includes(member.id)} disabled={!!busy || (!selected.includes(member.id) && selected.length >= MAX_CAMPAIGN_RECIPIENTS)} onChange={() => toggle(member.id)}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.name}</span><span className="mt-1 block text-xs text-zinc-500">{member.memberNumber} · {member.lastVisitAt ? `${member.inactiveDays}d since last visit` : `No visit recorded · joined ${member.inactiveDays}d ago`}</span></span><span className="flex shrink-0 items-center gap-1 rounded-full bg-[#edf2ee] px-2 py-1 text-[10px] font-medium text-[#46624d]"><Wallet size={12}/> Wallet</span></label>)}
      </div>
      {visible.length > 200 && <p className="mt-3 text-xs text-zinc-500">Showing the first 200 matches. Search by name or member number to narrow the list.</p>}
      <p className="mt-3 text-[11px] leading-5 text-zinc-400">Visits use recorded stamps and redemptions, excluding feedback bonuses. For members without a visit, inactivity starts from joining. Birthdays use {data?.cafe.timezone ?? "the business’s timezone"}.</p>
    </section>
    <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-black/[0.07] bg-white p-4 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold">02</span><h2 className="font-semibold">Write your card update</h2></div>
        <label htmlFor="wallet-message" className="mb-2 mt-5 block text-xs font-medium">Message</label><textarea id="wallet-message" className={`${field} min-h-32 resize-y leading-6`} maxLength={180} disabled={!!busy} value={message} placeholder="A birthday wish, a welcome-back note, or an update to a current offer…" onChange={event => { setMessage(event.target.value); resetReview(); }}/>
        <div className="mt-2 flex justify-between gap-4 text-xs text-zinc-500"><span>Appears on the Wallet card and can trigger a notification.</span><span className="shrink-0">{message.length}/180</span></div>
        <div className="mt-4 flex flex-wrap gap-2">{segment === "reward_ready" && data && <button className={secondary} disabled={!!busy} onClick={() => { setMessage(`Your reward is ready: ${data.cafe.rewardName}! Visit ${business} to redeem it.`.slice(0,180)); resetReview(); }}><Gift size={15}/> Reward reminder</button>}<button className={secondary} disabled={!!busy} onClick={() => { setMessage(`Happy birthday! Thanks for being part of ${business}.`.slice(0,180)); resetReview(); }}><Cake size={15}/> Birthday wish</button><button className={secondary} disabled={!!busy} onClick={() => { setMessage(`We miss you! Your ${business} loyalty card is ready for your next visit.`.slice(0,180)); resetReview(); }}><Clock3 size={15}/> Welcome back</button></div>
        <p className="mt-4 text-xs leading-5 text-zinc-500">This updates the card’s message. Stamps and reward eligibility stay the same.</p>
        <button className={`${primary} mt-5 w-full sm:w-auto`} disabled={!!busy || !selected.length || !message.trim() || !data} onClick={() => request("preview")}>{busy === "preview" ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16}/>} Review {selected.length || "your"} recipient{selected.length === 1 ? "" : "s"}</button>
      </div>
      <div className="flex flex-col justify-center rounded-3xl border border-black/[0.07] bg-[#eaeaec] p-6 sm:p-8"><p className="mb-5 text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">Notification preview</p><div className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.06)]"><div className="flex items-center gap-2 text-xs text-zinc-500"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white"><Wallet size={17}/></span> Wallet<span className="ml-auto">now</span></div><p className="mt-4 text-sm font-semibold">{business}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.trim() || "Your message will appear here."}</p></div><p className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500"><Smartphone size={17} className="mt-0.5 shrink-0"/> Appearance and delivery timing vary by device. Updates may take a few minutes; Apple acceptance doesn’t confirm the customer saw a notification.</p></div>
    </section>
    {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {review && <div ref={reviewRef} className="mt-5 rounded-3xl border-2 border-zinc-900 bg-white p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">03 · Final review</p><h2 className="mt-3 text-xl font-semibold">Send to {review.recipients.length} Wallet member{review.recipients.length === 1 ? "" : "s"}?</h2><p className="mt-2 text-sm text-zinc-500">{review.business} · {chosenSegment.label}</p><p className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-zinc-100 p-4 text-sm leading-6">{review.message}</p><p className="mt-3 max-h-24 overflow-y-auto text-xs leading-6 text-zinc-500">{review.recipients.map(member => `${member.name} (${member.memberNumber})`).join(", ")}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button disabled={!!busy} className={primary} onClick={() => request("send")}>{busy === "send" ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} {busy === "send" ? "Sending… keep this page open" : `Send to ${review.recipients.length} Wallet members`}</button><button disabled={!!busy} className={secondary} onClick={() => setReview(null)}>Back to editing</button></div><p className="mt-3 text-xs text-zinc-500">This preview expires in 10 minutes. Removed cards, members who no longer match the group, and unchanged messages will be skipped.</p></div>}
    {result && <div role="status" className="mt-5 rounded-3xl border border-[#c9d8cc] bg-[#eef4ef] p-5"><p className="flex items-center gap-2 font-semibold"><Check size={18}/> {result.status === "complete" ? "Campaign processed" : "Campaign in progress"}</p><p className="mt-2 text-sm">{totals(result).accepted} accepted by Apple · {totals(result).failed} failed · {totals(result).skipped} skipped{totals(result).pending ? ` · ${totals(result).pending} awaiting processing` : ""}.</p><p className="mt-2 text-xs text-zinc-600">These are update requests, not confirmed notification views. Check history for the latest result.</p></div>}
    <WalletNotificationSettings key={cafeId} cafeId={cafeId} />
    <section className="mt-7"><h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={18}/> Recent campaigns</h2><p className="mt-2 text-xs text-zinc-500">Last 10 campaigns · history kept for 30 days. Pending results after an interruption need review before creating another campaign.</p><div className="mt-4 space-y-3">{data?.history.length ? data.history.map(campaign => { const count = totals(campaign); return <article key={campaign.id} className="rounded-2xl border border-black/[0.07] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-zinc-500">{new Intl.DateTimeFormat("en-GB", { timeZone: data.cafe.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(campaign.sentAt ?? campaign.createdAt))}</p><span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] uppercase tracking-wide">{campaign.status === "sending" ? "Processing / check status" : "Processed"}</span></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{campaign.message}</p><p className="mt-3 text-xs text-zinc-500">{campaign.recipients.length} members · {count.accepted} accepted by Apple · {count.failed} failed · {count.skipped} skipped{count.pending ? ` · ${count.pending} pending` : ""}</p></article>; }) : <p className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-500">Your first campaign will appear here after you send it.</p>}</div></section>
  </div>;
}
