"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, Cake, Check, Clock3, Gift, Loader2, Search, Send, Smartphone, Users, Wallet } from "lucide-react";
import { campaignSegments, MAX_CAMPAIGN_RECIPIENTS, type CampaignMember, type CampaignSegment } from "@/lib/wallet/campaign-segments";
import { ActionButton } from "@/components/ui/action-button";
import { SlidingSelection } from "@/components/ui/sliding-selection";
import WalletNotificationSettings from "./WalletNotificationSettings";
import type { WalletCampaign } from "@/lib/wallet/campaigns";

type Business = { id: string; name: string };
type Audience = { cafe: Business & { timezone: string; rewardName: string }; totalMembers: number; walletMembers: number; googleUnavailable: boolean; members: CampaignMember[]; counts: Record<CampaignSegment, number>; history: WalletCampaign[] };
const field = "w-full rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] px-4 py-3 text-base outline-none transition focus:border-[var(--wallet-accent,#18181b)] focus:ring-2 focus:ring-black/10 disabled:opacity-50 sm:text-sm";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] px-4 py-2 text-sm font-medium transition active:opacity-80 disabled:opacity-40 pointer-fine:hover:opacity-90";
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--wallet-accent,#18181b)] px-5 py-3 text-sm font-medium text-[var(--wallet-accent-text,#ffffff)] active:opacity-80 disabled:opacity-60 pointer-fine:hover:opacity-90";
function totals(campaign: WalletCampaign) {
  return { accepted: campaign.recipients.filter(r => r.status === "accepted").length, failed: campaign.recipients.filter(r => r.status === "failed").length,
    skipped: campaign.recipients.filter(r => r.status === "skipped").length, pending: campaign.recipients.filter(r => r.status === "pending").length };
}
export default function WalletCampaigns({ businesses, initialCafeId, studio = false, branded = false }: { businesses: Business[]; initialCafeId: string; studio?: boolean; branded?: boolean }) {
  const [cafeId, setCafeId] = useState(initialCafeId);
  const [data, setData] = useState<Audience | null>(null);
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<WalletCampaign | null>(null);
  const [result, setResult] = useState<WalletCampaign | null>(null);
  const [error, setError] = useState("");
  const [audienceError, setAudienceError] = useState("");
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [revision, setRevision] = useState(0);
  const reviewRef = useRef<HTMLDivElement>(null);
  const requestInFlight = useRef(false);
  useEffect(() => {
    if (!cafeId) return;
    const controller = new AbortController();
    fetch(`/api/wallet/campaigns?cafeId=${encodeURIComponent(cafeId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.message); return body as Audience; })
      .then(body => { if (!controller.signal.aborted) { setData(body); setAudienceError(""); } })
      .catch(reason => { if (!controller.signal.aborted) setAudienceError(reason.message || "Could not load Wallet members."); });
    return () => controller.abort();
  }, [cafeId, revision]);
  useEffect(() => {
    if (review) reviewRef.current?.scrollIntoView({ block: "nearest" });
  }, [review]);
  const members = useMemo(() => data?.members.filter(member => member.segments.includes(segment)) ?? [], [data, segment]);
  const eligible = members.filter(member => member.offersStatus === "enabled");
  const visible = members.filter(member => `${member.name} ${member.memberNumber}`.toLowerCase().includes(search.trim().toLowerCase()));
  const shown = visible.slice(0, 200);
  const selectable = shown.filter(member => member.offersStatus === "enabled");
  function resetReview() { setReview(null); setResult(null); setError(""); }
  function changeBusiness(id: string) { setCafeId(id); setData(null); setAudienceError(""); setSelected([]); setMessage(""); setSearch(""); setSegment("all"); resetReview(); }
  function toggle(id: string) {
    resetReview();
    setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : previous.length < MAX_CAMPAIGN_RECIPIENTS ? [...previous, id] : previous);
  }
  async function request(action: "preview" | "send") {
    if (requestInFlight.current || result || (action === "send" && !review)) return;
    requestInFlight.current = true;
    setBusy(action); setError("");
    try {
      const response = await fetch("/api/wallet/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "preview"
        ? { action, cafeId, segment, message, customerIds: selected }
        : { action, cafeId, campaignId: review?.id }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      if (action === "preview") setReview(body.campaign);
      else { setResult(body.campaign); setRevision(value => value + 1); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed. Refresh history before trying again."); }
    finally { requestInFlight.current = false; setBusy(null); }
  }
  const chosenSegment = campaignSegments.find(value => value.id === segment)!;
  const Heading = branded ? "h2" : "h1";
  const business = data?.cafe.name ?? businesses.find(value => value.id === cafeId)?.name ?? "Your business";
  return <div  className={branded ? "min-w-0 rounded-3xl p-1 sm:p-3" : "rounded-[28px] bg-[#f6f6f7] p-4 text-[var(--wallet-text,#18181b)] sm:p-7 lg:p-9"}>
    {studio && <a href="/studio" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--wallet-secondary,#52525b)] hover:opacity-90"><ArrowLeft size={16} /> BeLoyal Studio</a>}
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <Heading className="text-2xl font-semibold tracking-tight sm:text-3xl">Wallet campaigns</Heading>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--wallet-secondary,#52525b)]">Choose who gets the message, write it, then review before sending.</p>
      </div>
      {studio && <div className="w-full sm:w-64"><label htmlFor="campaign-business" className="mb-2 block text-xs font-medium text-[var(--wallet-secondary,#52525b)]">Business</label>
        <select id="campaign-business" className={field} value={cafeId} disabled={!!busy} onChange={event => changeBusiness(event.target.value)}>{businesses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
    </header>
    {!businesses.length && <p className="mt-8 text-sm">Create an active business to start a Wallet campaign.</p>}
    <div className="mt-7 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:gap-4">{[
      { label: "Total members", value: data?.totalMembers, icon: Users },
      { label: "Wallet members", value: data?.walletMembers, icon: Wallet },
      { label: "Agreed to offers", value: data?.counts.all, icon: Check },
    ].map(stat => <div key={stat.label} className="rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-3 sm:p-5"><stat.icon size={17} className="mb-3 text-[var(--wallet-muted,#71717a)]"/><p className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value ?? "—"}</p><p className="mt-1 text-[11px] text-[var(--wallet-muted,#71717a)] sm:text-xs">{stat.label}</p></div>)}</div>
    <section className="mt-7 rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-4 sm:p-6">
      <h2 className="font-semibold">Who should get the message?</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">You can message members who saved a Wallet card and agreed to receive offers.</p>
      <div className="mt-4 overflow-x-auto pb-1">
        <SlidingSelection
          value={segment}
          indicatorColor="var(--wallet-accent,#18181b)"
          className="flex w-max min-w-full items-center gap-1 rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-raised,#f4f4f5)] p-1"
          role="group"
          aria-label="Campaign audience filters"
        >
          {campaignSegments.map(({ id, label }) => {
            const active = segment === id;
            return (
              <button
                key={id}
                type="button"
                disabled={!!busy}
                aria-pressed={active}
                data-selection={active ? "active" : undefined}
                onClick={() => {
                  if (active) return;
                  setSegment(id);
                  setSelected([]);
                  setSearch("");
                  resetReview();
                }}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] motion-safe:transition-colors ${active ? "text-[var(--wallet-accent-text,#ffffff)]" : "text-[var(--wallet-secondary,#52525b)]"}`}
              >
                {label}
                <span className="min-w-4 text-center tabular-nums">{data?.counts[id] ?? "—"}</span>
              </button>
            );
          })}
        </SlidingSelection>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--wallet-muted,#71717a)]">{chosenSegment.description}</p>
        <button type="button" disabled={!!busy} onClick={() => { setAudienceError(""); setSelected([]); resetReview(); setRevision(value => value + 1); }} className="min-h-11 text-xs font-medium underline underline-offset-4">Refresh members and history</button></div>
      {data?.googleUnavailable && <p role="status" className="mt-3 text-sm text-[var(--wallet-secondary,#52525b)]">Google Wallet members are temporarily unavailable. Apple Wallet members are shown below.</p>}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3.5 text-[var(--wallet-muted,#71717a)]"/><input aria-label="Search Wallet members" className={`${field} pl-10`} placeholder="Search by name or member number" value={search} disabled={!!busy} onChange={event => setSearch(event.target.value)}/></div>
        <button disabled={!!busy || !selectable.length} className={secondary} onClick={() => { resetReview(); setSelected(selectable.slice(0, MAX_CAMPAIGN_RECIPIENTS).map(member => member.id)); }}>Select {Math.min(selectable.length, MAX_CAMPAIGN_RECIPIENTS)} shown</button>
        {!!selected.length && <button disabled={!!busy} className={secondary} onClick={() => { setSelected([]); resetReview(); }}>Clear</button>}</div>
      <p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">{eligible.length} eligible · {selected.length}/{MAX_CAMPAIGN_RECIPIENTS} selected per campaign. The 30+ day group is also included in 14+ days.</p>
      {audienceError && <p role="alert" className="mt-3 text-sm text-red-700">Could not refresh the member list. {audienceError}</p>}
      <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-[var(--wallet-border,#e4e4e7)]">
        {!data && !audienceError && <p className="flex items-center gap-2 p-5 text-sm text-[var(--wallet-muted,#71717a)]"><Loader2 size={16} className="animate-spin"/> Loading Wallet members…</p>}
        {data && !visible.length && <div className="p-7 text-center"><Wallet size={24} className="mx-auto text-[var(--wallet-muted,#71717a)]"/><p className="mt-3 text-sm font-medium">{search.trim() ? "No Wallet members match your search" : "No Wallet members in this group yet"}</p><p className="mt-1 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">Try another group or refresh the audience after a member saves their pass.</p></div>}
        {shown.map(member => {
          const canSelect = member.offersStatus === "enabled";
          const checked = selected.includes(member.id);
          return <label key={member.id} className="flex min-h-20 items-center gap-3 border-b border-[var(--wallet-border,#e4e4e7)] p-4 last:border-0">
            <input type="checkbox" className="h-4 w-4 shrink-0 accent-[var(--wallet-accent,#18181b)]" checked={checked} disabled={!canSelect || !!busy || (!checked && selected.length >= MAX_CAMPAIGN_RECIPIENTS)} onChange={() => toggle(member.id)}/>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.name}</span><span className="mt-1 block text-xs text-[var(--wallet-muted,#71717a)]">{member.memberNumber} · {member.lastVisitAt ? `${member.inactiveDays}d since last visit` : `No visit recorded · joined ${member.inactiveDays}d ago`}</span></span>
            <span className={`rounded-full px-2 py-1 text-center text-[10px] font-medium ${canSelect ? "bg-[#edf2ee] text-[#46624d]" : "bg-[var(--wallet-raised,#f4f4f5)] text-[var(--wallet-secondary,#52525b)]"}`}>
              {canSelect ? "Can receive offers" : member.offersStatus === "withdrawn" ? "Opted out" : "Hasn’t agreed to offers"}
            </span>
          </label>;
        })}
      </div>
      {visible.length > 200 && <p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">Showing the first 200 matches. Search by name or member number to narrow the list.</p>}
      <p className="mt-3 text-[11px] leading-5 text-[var(--wallet-muted,#71717a)]">Visits use recorded stamps and redemptions, excluding feedback bonuses. For members without a visit, inactivity starts from joining. Birthdays use {data?.cafe.timezone ?? "the business’s timezone"}.</p>
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="min-w-0 rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-4 sm:p-6"><h2 className="font-semibold">Write your message</h2>
        <label htmlFor="wallet-message" className="mb-2 mt-5 block text-xs font-medium">Message</label><textarea id="wallet-message" className={`${field} min-h-32 resize-y leading-6`} maxLength={180} disabled={!!busy} value={message} placeholder="Example: We miss you! Stop by this week for a treat." onChange={event => { setMessage(event.target.value); resetReview(); }}/>
        <div className="mt-2 flex justify-between gap-4 text-xs text-[var(--wallet-muted,#71717a)]"><span>Members can see this on their Wallet card. Their phone may show an alert.</span><span className="shrink-0">{message.length}/180</span></div>
        <div className="mt-4 flex flex-wrap gap-2">{segment === "reward_ready" && data && <button className={secondary} disabled={!!busy} onClick={() => { setMessage(`Your reward is ready: ${data.cafe.rewardName}! Visit ${business} to redeem it.`.slice(0,180)); resetReview(); }}><Gift size={15}/> Reward reminder</button>}<button className={secondary} disabled={!!busy} onClick={() => { setMessage(`Happy birthday! Thanks for being part of ${business}.`.slice(0,180)); resetReview(); }}><Cake size={15}/> Birthday wish</button><button className={secondary} disabled={!!busy} onClick={() => { setMessage(`We miss you! Your ${business} loyalty card is ready for your next visit.`.slice(0,180)); resetReview(); }}><Clock3 size={15}/> Welcome back</button></div>
        <p className="mt-4 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">This message keeps everyone’s stamps and rewards as they are.</p>
        <p className="mt-3 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">Select at least one member and write a message to review it.</p>
        <ActionButton
          className={`${primary} mt-5 w-full sm:w-auto`}
          icon={<ArrowRight size={16} />}
          pending={busy === "preview"}
          disabled={!!busy || !!result || !selected.length || !message.trim() || !data || !!audienceError}
          onClick={() => request("preview")}
        >
          Review {selected.length || "your"} recipient{selected.length === 1 ? "" : "s"}
        </ActionButton>
      </div>
      <div className="flex flex-col justify-center rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-raised,#eaeaec)] p-6 sm:p-8"><p className="mb-5 text-xs font-medium uppercase tracking-[0.15em] text-[var(--wallet-muted,#71717a)]">Notification preview</p><div className="rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.06)]"><div className="flex items-center gap-2 text-xs text-[var(--wallet-muted,#71717a)]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--wallet-accent,#18181b)] text-[var(--wallet-accent-text,#ffffff)]"><Wallet size={17}/></span> Wallet<span className="ml-auto">now</span></div><p className="mt-4 text-sm font-semibold">{business}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.trim() || "Your message will appear here."}</p></div><p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[var(--wallet-muted,#71717a)]"><Smartphone size={17} className="mt-0.5 shrink-0"/> Updates can take a few minutes. Members may see a Wallet alert depending on their phone settings.</p></div>
    </section>
    {error && !review && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {review && (
      <div ref={reviewRef} className="mt-5 scroll-mt-24 rounded-3xl border-2 border-[var(--wallet-accent,#18181b)] bg-[var(--wallet-surface,#ffffff)] p-5 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--wallet-muted,#71717a)]">Final review</p>
        <h2 className="mt-3 text-xl font-semibold">Send to {review.recipients.length} Wallet member{review.recipients.length === 1 ? "" : "s"}?</h2>
        <p className="mt-2 text-sm text-[var(--wallet-muted,#71717a)]">{review.business} · {chosenSegment.label}</p>
        <p className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-[var(--wallet-raised,#f4f4f5)] p-4 text-sm leading-6">{review.message}</p>
        <p className="mt-3 max-h-24 overflow-y-auto text-xs leading-6 text-[var(--wallet-muted,#71717a)]">{review.recipients.map(member => `${member.name} (${member.memberNumber})`).join(", ")}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ActionButton
            className={primary}
            icon={<Send size={16} />}
            pending={busy === "send"}
            disabled={!!busy || !!result}
            onClick={() => request("send")}
          >
            Send message
          </ActionButton>
          <button type="button" disabled={!!busy} className={secondary} onClick={() => {
            if (result) { setSelected([]); setMessage(""); }
            resetReview();
          }}>{result ? "Done" : "Back to editing"}</button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div role="status" className="mt-3 min-h-5 text-sm">
          {busy === "send" && "Sending your message… Keep this page open."}
          {result && <>
            <p className="flex items-center gap-2 font-semibold"><Check size={16} aria-hidden="true"/> {result.status === "complete" ? "Sending finished" : "Still sending"}</p>
            <p className="mt-1 text-xs">{totals(result).accepted} accepted by Wallet · {totals(result).failed} failed · {totals(result).skipped} skipped{totals(result).pending ? ` · ${totals(result).pending} still sending` : ""}.</p>
            <p className="mt-1 text-xs text-[var(--wallet-secondary,#52525b)]">Wallet can accept an update even if the member never opens it.</p>
          </>}
        </div>
        {!result && <p className="mt-2 text-xs text-[var(--wallet-muted,#71717a)]">Review expires in 10 minutes. BeLoyal skips removed cards, members who no longer match the group, and repeat Apple Wallet messages.</p>}
      </div>
    )}
    <WalletNotificationSettings key={cafeId} cafeId={cafeId} manageLocation={studio} />
    <section className="mt-7"><h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={18}/> Message history</h2><p className="mt-2 text-xs text-[var(--wallet-muted,#71717a)]">See your last 10 sends from the past 30 days. If sending was interrupted, check here before trying again.</p><div className="mt-4 space-y-3">{data?.history.length ? data.history.map(campaign => { const count = totals(campaign); return <article key={campaign.id} className="rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-[var(--wallet-muted,#71717a)]">{new Intl.DateTimeFormat("en-GB", { timeZone: data.cafe.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(campaign.sentAt ?? campaign.createdAt))}</p><span className="rounded-full bg-[var(--wallet-raised,#f4f4f5)] px-2 py-1 text-[10px] uppercase tracking-wide">{campaign.status === "sending" ? "Still sending" : "Processed"}</span></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{campaign.message}</p><p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">{campaign.recipients.length} members · {count.accepted} accepted by Wallet · {count.failed} failed · {count.skipped} skipped{count.pending ? ` · ${count.pending} pending` : ""}</p></article>; }) : <p className="rounded-2xl border border-dashed border-[var(--wallet-border,#e4e4e7)] p-6 text-sm text-[var(--wallet-muted,#71717a)]">Sent messages will appear here.</p>}</div></section>
  </div>;
}
