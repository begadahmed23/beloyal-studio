"use client";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, Cake, Check, Clock3, Gift, Loader2, Search, Send, Trash2, Users, Wallet } from "lucide-react";
import { campaignSegments, MAX_CAMPAIGN_RECIPIENTS, type CampaignMember, type CampaignSegment } from "@/lib/wallet/campaign-segments";
import { ActionButton } from "@/components/ui/action-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SlidingSelection } from "@/components/ui/sliding-selection";
import WalletNotificationSettings from "./WalletNotificationSettings";
import type { WalletCampaign } from "@/lib/wallet/campaigns";
import { dashboardThemeVariables, type CafeThemeConfig } from "@/lib/cafe-theme";

type Business = { id: string; name: string; theme?: CafeThemeConfig };
type Audience = { cafe: Business & { timezone: string; rewardName: string }; members: CampaignMember[]; history: WalletCampaign[]; totalMembers?: number; walletMembers?: number; googleUnavailable?: boolean; messagingUnavailable?: boolean; counts?: Record<CampaignSegment, number> };
const field = "w-full rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] px-4 py-3 text-base outline-none transition focus:border-[var(--wallet-accent,#18181b)] focus:ring-2 focus:ring-black/10 disabled:opacity-50 sm:text-sm";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] px-4 py-2 text-sm font-medium transition active:opacity-80 disabled:opacity-40 pointer-fine:hover:opacity-90";
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--wallet-accent,#18181b)] px-5 py-3 text-sm font-medium text-[var(--wallet-accent-text,#ffffff)] active:opacity-80 disabled:opacity-60 pointer-fine:hover:opacity-90";
function totals(campaign: WalletCampaign) {
  return { accepted: campaign.recipients.filter(r => r.status === "accepted").length, failed: campaign.recipients.filter(r => r.status === "failed").length,
    skipped: campaign.recipients.filter(r => r.status === "skipped").length, pending: campaign.recipients.filter(r => r.status === "pending").length };
}
export default function WalletCampaigns({ businesses, initialCafeId, studio = false, branded = false, businessCanSend = false, pointsMode = false }: { businesses: Business[]; initialCafeId: string; studio?: boolean; branded?: boolean; businessCanSend?: boolean; pointsMode?: boolean }) {
  const { t, arabic } = useBeLoyalLanguage();
  const canSend = studio || businessCanSend;
  const [cafeId, setCafeId] = useState(initialCafeId);
  const [data, setData] = useState<Audience | null>(null);
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState<WalletCampaign | null>(null);
  const [result, setResult] = useState<WalletCampaign | null>(null);
  const [error, setError] = useState("");
  const [audienceError, setAudienceError] = useState("");
  const [busy, setBusy] = useState<"preview" | "send" | "delete" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyFeedback, setHistoryFeedback] = useState<{ message: string; failed?: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
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
  const members = useMemo(() => data?.members.filter(member => member.segments.includes(segment)) ?? [], [data, segment]);
  const eligible = members.filter(member => member.offersStatus === "enabled");
  const visible = members.filter(member => `${member.name} ${member.memberNumber} ${member.joinLocationName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const shown = visible.slice(0, 200);
  const selectable = shown.filter(member => member.offersStatus === "enabled");
  function resetReview() { setReviewOpen(false); setReview(null); setResult(null); setError(""); }
  function changeBusiness(id: string) { setCafeId(id); setData(null); setAudienceError(""); setSelected([]); setMessage(""); setSearch(""); setSegment("all"); setDeleteId(null); setHistoryFeedback(null); resetReview(); }
  function toggle(id: string) {
    resetReview();
    setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : previous.length < MAX_CAMPAIGN_RECIPIENTS ? [...previous, id] : previous);
  }
  async function request(action: "preview" | "send") {
    if (requestInFlight.current || result || (action === "send" && !review)) return;
    requestInFlight.current = true;
    if (action === "preview") {
      setReview(null);
      setReviewOpen(true);
    }
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/wallet/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "preview"
        ? { action, cafeId, segment, message, customerIds: selected }
        : { action, cafeId, campaignId: review?.id }) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.campaign) {
        if (action === "preview" && response.status === 409) {
          setSelected([]);
          setRevision(value => value + 1);
        }
        if (action === "send" && response.status === 404) setReview(null);
        throw new Error(body?.message || t("Could not complete the campaign request."));
      }
      if (action === "preview") setReview(body.campaign);
      else { setResult(body.campaign); setRevision(value => value + 1); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("Request failed. Refresh history before trying again.")); }
    finally { requestInFlight.current = false; setBusy(null); }
  }
  function closeReview() {
    if (requestInFlight.current) return;
    if (result) { setSelected([]); setMessage(""); }
    resetReview();
  }
  async function deleteHistoryEntry(campaignId: string) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy("delete");
    setHistoryFeedback(null);
    try {
      const response = await fetch("/api/wallet/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", cafeId, campaignId }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      setData(current => current && { ...current, history: current.history.filter(campaign => campaign.id !== campaignId) });
      setDeleteId(null);
      setHistoryFeedback({ message: "Message removed from history." });
      setRevision(value => value + 1);
    } catch (reason) {
      setHistoryFeedback({ message: reason instanceof Error ? reason.message : "Could not delete the message.", failed: true });
    } finally {
      requestInFlight.current = false;
      setBusy(null);
    }
  }
  const chosenSegment = campaignSegments.find(value => value.id === segment)!;
  const Heading = branded ? "h2" : "h1";
  const selectedBusiness = businesses.find(value => value.id === cafeId);
  const business = data?.cafe.name ?? selectedBusiness?.name ?? "Your business";
  const reviewTheme = selectedBusiness?.theme;
  return <div  className={branded ? "min-w-0 rounded-3xl p-1 sm:p-3" : "rounded-[28px] bg-[#f6f6f7] p-4 text-[var(--wallet-text,#18181b)] sm:p-7 lg:p-9"}>
    {studio && <a href="/studio" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--wallet-secondary,#52525b)] hover:opacity-90"><ArrowLeft size={16} /> BeLoyal Studio</a>}
    <header className="flex flex-col justify-between gap-5 rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-4 shadow-sm sm:flex-row sm:items-end sm:p-6">
      <div>
        <Heading className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("Wallet campaigns")}</Heading>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--wallet-secondary,#52525b)]">{canSend ? t("Choose who gets the message, write it, then review before sending.") : t("View message history and manage automatic Wallet updates.")}</p>
      </div>
      {studio && <div className="w-full sm:w-64"><label htmlFor="campaign-business" className="mb-2 block text-xs font-medium text-[var(--wallet-secondary,#52525b)]">Business</label>
        <select id="campaign-business" className={field} value={cafeId} disabled={!!busy} onChange={event => changeBusiness(event.target.value)}>{businesses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
    </header>
    {data?.messagingUnavailable && <p role="status" className="mt-5 text-sm">{t("Wallet messaging is not configured in this environment.")}</p>}
    {canSend && !data?.messagingUnavailable && <>
    {!businesses.length && <p className="mt-8 text-sm">Create an active business to start a Wallet campaign.</p>}
    <div className="mt-7 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:gap-4">{[
      { label: "Total members", value: data?.totalMembers, icon: Users },
      { label: t("Wallet members"), value: data?.walletMembers, icon: Wallet },
      { label: t("Agreed to offers"), value: data?.counts?.all, icon: Check },
    ].map(stat => <div key={stat.label} className="rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-3 sm:p-5"><stat.icon size={17} className="mb-3 text-[var(--wallet-muted,#71717a)]"/><p className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value ?? "—"}</p><p className="mt-1 text-[11px] text-[var(--wallet-muted,#71717a)] sm:text-xs">{stat.label}</p></div>)}</div>
    <section className="mt-7 rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-4 shadow-sm sm:p-6">
      <h2 className="font-semibold">{t("Who should get the message?")}</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">{t("You can message members who saved a Wallet card and agreed to receive offers.")}</p>
      <div className="mt-4 overflow-x-auto pb-1">
        <SlidingSelection
          value={segment}
          indicatorColor="var(--wallet-accent,#18181b)"
          className="flex w-max min-w-full items-center gap-1 rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-raised,#f4f4f5)] p-1"
          role="group"
          aria-label={t("Campaign audience filters")}
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
                {t(label)}
                <span className="min-w-4 text-center tabular-nums">{data?.counts?.[id] ?? "—"}</span>
              </button>
            );
          })}
        </SlidingSelection>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--wallet-muted,#71717a)]">{t(chosenSegment.description)}</p>
        <button type="button" disabled={!!busy} onClick={() => { setAudienceError(""); setSelected([]); resetReview(); setRevision(value => value + 1); }} className="min-h-11 text-xs font-medium underline underline-offset-4">{t("Refresh members and history")}</button></div>
      {data?.googleUnavailable && <p role="status" className="mt-3 text-sm text-[var(--wallet-secondary,#52525b)]">Google Wallet members are temporarily unavailable. Apple Wallet members are shown below.</p>}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute start-3 top-3.5 text-[var(--wallet-muted,#71717a)]"/><input type="search" name="beloyal-wallet-member-query" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="search" aria-label={t("Search Wallet members")} className={`${field} ps-10`} placeholder={t("Search by name, member number or store")} value={search} disabled={!!busy} onChange={event => setSearch(event.target.value)}/></div>
        <button disabled={!!busy || !selectable.length} className={secondary} onClick={() => { resetReview(); setSelected(selectable.slice(0, MAX_CAMPAIGN_RECIPIENTS).map(member => member.id)); }}>Select {Math.min(selectable.length, MAX_CAMPAIGN_RECIPIENTS)} shown</button>
        {!!selected.length && <button disabled={!!busy} className={secondary} onClick={() => { setSelected([]); resetReview(); }}>{t("Clear")}</button>}</div>
      <p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">{eligible.length} eligible · {selected.length}/{MAX_CAMPAIGN_RECIPIENTS} selected per campaign. The 30+ day group is also included in 14+ days.</p>
      {audienceError && <p role="alert" className="mt-3 text-sm text-red-700">Could not refresh the member list. {t(audienceError)}</p>}
      <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-[var(--wallet-border,#e4e4e7)]">
        {!data && !audienceError && <p className="flex items-center gap-2 p-5 text-sm text-[var(--wallet-muted,#71717a)]"><Loader2 size={16} className="animate-spin"/>{" " + t("Loading Wallet members…")}</p>}
        {data && !visible.length && <div className="p-7 text-center"><Wallet size={24} className="mx-auto text-[var(--wallet-muted,#71717a)]"/><p className="mt-3 text-sm font-medium">{search.trim() ? t("No Wallet members match your search") : t("No Wallet members in this group yet")}</p><p className="mt-1 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">{t("Try another group or refresh the audience after a member saves their pass.")}</p></div>}
        {shown.map(member => {
          const canSelect = member.offersStatus === "enabled";
          const checked = selected.includes(member.id);
          return <label key={member.id} className="flex min-h-20 items-center gap-3 border-b border-[var(--wallet-border,#e4e4e7)] p-4 last:border-0">
            <input type="checkbox" className="h-4 w-4 shrink-0 accent-[var(--wallet-accent,#18181b)]" checked={checked} disabled={!canSelect || !!busy || (!checked && selected.length >= MAX_CAMPAIGN_RECIPIENTS)} onChange={() => toggle(member.id)}/>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.name}</span><span className="mt-1 block text-xs text-[var(--wallet-muted,#71717a)]">{member.memberNumber} · {member.lastVisitAt ? `${member.inactiveDays}d since last visit` : `No visit recorded · joined ${member.inactiveDays}d ago`}</span>{member.joinLocationName && <span className="mt-1 block text-xs">{t("Joined at")} {member.joinLocationName}</span>}</span>
            <span className={`rounded-full px-2 py-1 text-center text-[10px] font-medium ${canSelect ? "bg-[#edf2ee] text-[#46624d]" : "bg-[var(--wallet-raised,#f4f4f5)] text-[var(--wallet-secondary,#52525b)]"}`}>
              {canSelect ? t("Can receive offers") : member.offersStatus === "withdrawn" ? t("Opted out") : t("Hasn’t agreed to offers")}
            </span>
          </label>;
        })}
      </div>
      {visible.length > 200 && <p className="mt-3 text-xs text-[var(--wallet-muted,#71717a)]">Showing the first 200 matches. Search by name, member number or store to narrow the list.</p>}
      <p className="mt-3 text-[11px] leading-5 text-[var(--wallet-muted,#71717a)]">{pointsMode ? t("Activity uses recorded purchases.") : t("Activity uses visits recorded on the loyalty card.")}</p>
    </section>
    <section className="mt-5">
      <div className="min-w-0 rounded-3xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-4 sm:p-6"><h2 className="font-semibold">{t("Write your message")}</h2>
        <label htmlFor="wallet-message" className="mb-2 mt-5 block text-xs font-medium">{t("Message")}</label><textarea id="wallet-message" dir="auto" className={`${field} min-h-32 resize-y leading-6`} maxLength={180} disabled={!!busy} value={message} placeholder={t("Example: We miss you! Stop by this week for a treat.")} onChange={event => { setMessage(event.target.value); resetReview(); }}/>
        <div className="mt-2 flex justify-between gap-4 text-xs text-[var(--wallet-muted,#71717a)]"><span>{t("Members can see this on their Wallet card. Their phone may show an alert.")}</span><span className="shrink-0">{message.length}/180</span></div>
        <div className="mt-4 flex flex-wrap gap-2">{segment === "reward_ready" && data && <button className={secondary} disabled={!!busy} onClick={() => { setMessage((arabic ? `مكافأتك جاهزة: ${data.cafe.rewardName}! عدّي على ${business} عشان تستلمها.` : `Your reward is ready: ${data.cafe.rewardName}! Visit ${business} to redeem it.`).slice(0, 180)); resetReview(); }}><Gift size={15}/>{" " + t("Reward reminder")}</button>}<button className={secondary} disabled={!!busy} onClick={() => { setMessage((arabic ? `كل سنة وإنت طيب! مبسوطين إنك معانا في ${business}.` : `Happy birthday! Thanks for being part of ${business}.`).slice(0, 180)); resetReview(); }}><Cake size={15}/>{" " + t("Birthday wish")}</button><button className={secondary} disabled={!!busy} onClick={() => { setMessage((arabic ? `وحشتنا! كارت الولاء بتاع ${business} جاهز لزيارتك الجاية.` : `We miss you! Your ${business} loyalty card is ready for your next visit.`).slice(0, 180)); resetReview(); }}><Clock3 size={15}/>{" " + t("Welcome back")}</button></div>
        <p className="mt-3 text-xs leading-5 text-[var(--wallet-muted,#71717a)]">{t("Select at least one member and write a message to review it.")}</p>
        <ActionButton
          className={`${primary} mt-5 w-full sm:w-auto`}
          icon={<ArrowRight size={16} />}
          pending={busy === "preview"}
          disabled={!!busy || !!result || !selected.length || !message.trim() || !data || !!audienceError}
          onClick={() => request("preview")}
        >
          {t("Review message")}
        </ActionButton>
      </div>
    </section>
    <Dialog open={reviewOpen} onOpenChange={open => { if (!open) closeReview(); }}>
      <DialogContent
        showCloseButton={false}
        dir={arabic ? "rtl" : "ltr"}
        style={reviewTheme ? dashboardThemeVariables(reviewTheme) : undefined}
        className="flex max-h-[min(40rem,calc(100dvh-1.5rem))] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden border p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-xl font-semibold">{t(result ? "Campaign result" : "Review message")}</DialogTitle>
          <DialogDescription className="text-secondary-foreground">
            {review?.business ?? business}
            {review && <> · {t(campaignSegments.find(item => item.id === review.segment)?.label ?? chosenSegment.label)}</>}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {busy === "preview" && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" />{t("Preparing review…")}</p>}
          {review && <>
            <div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Wallet size={16} />{t("Wallet notification")}</p>
                <p className="mt-2 text-sm font-semibold">{business}</p>
                <p dir="auto" className="mt-1 whitespace-pre-wrap wrap-anywhere text-sm leading-6">{review.message}</p>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer rounded-xl border border-border px-3 py-3 text-sm font-medium">
                {arabic ? `المستلمين (${review.recipients.length})` : `Recipients (${review.recipients.length})`}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto overscroll-contain px-3 text-sm text-secondary-foreground">
                {review.recipients.map(member => <li key={member.id} className="wrap-anywhere">{member.name} · {member.memberNumber}</li>)}
              </ul>
            </details>
          </>}
          {error && <p role="alert" className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">{t(error)}</p>}
          {busy === "send" && <p role="status" className="text-sm">{t("Sending your message… Keep this page open.")}</p>}
          {result && <div role="status" className="rounded-2xl bg-secondary p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><Check size={16} aria-hidden="true"/> {t(result.status === "complete" ? "Sending finished" : "Still sending")}</p>
            <p className="mt-2 text-xs">{totals(result).accepted} {t("Accepted by Wallet")} · {totals(result).failed} {t("Failed")} · {totals(result).skipped} {t("Skipped")}{totals(result).pending ? ` · ${totals(result).pending} ${t("Pending")}` : ""}</p>
          </div>}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
          <button type="button" disabled={!!busy} onClick={closeReview}
            className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-50">
            {t(result ? "Done" : "Back to editing")}
          </button>
          {!result && <ActionButton
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            icon={<Send size={16} />} pending={busy === "send"} disabled={!!busy || !review} onClick={() => request("send")}
          >{t("Send notification")}</ActionButton>}
        </div>
      </DialogContent>
    </Dialog>
    </>}
    <WalletNotificationSettings key={cafeId} cafeId={cafeId} manageLocation={studio} editNearbyMessages={!studio} pointsMode={pointsMode} />
    <section className="mt-7">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={18} aria-hidden="true" /> {t("Message history")}</h2>
      <p className="mt-2 text-xs text-[var(--wallet-muted,#71717a)]">{t("See your last 10 sends from the past 30 days.")}</p>
      {audienceError && !studio && <p role="alert" className="mt-3 text-sm">{t(audienceError)}</p>}
      {historyFeedback && <p role={historyFeedback.failed ? "alert" : "status"} className="mt-3 text-sm">{t(historyFeedback.message)}</p>}
      <div className="mt-4 space-y-3">
        {data?.history.length ? data.history.map(campaign => {
          const count = totals(campaign);
          return <article key={campaign.id} className="rounded-2xl border border-[var(--wallet-border,#e4e4e7)] bg-[var(--wallet-surface,#ffffff)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-[var(--wallet-muted,#71717a)]">{new Intl.DateTimeFormat(arabic ? "ar-EG" : "en-GB", { timeZone: data.cafe.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(campaign.sentAt ?? campaign.createdAt))}</p>
              <span className="rounded-full bg-[var(--wallet-raised,#f4f4f5)] px-2 py-1 text-[10px] uppercase tracking-wide">{t(campaign.status === "sending" ? "Still sending" : "Processed")}</span>
            </div>
            <p dir="auto" className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{campaign.message}</p>
            <p className="mt-3 flex flex-wrap gap-x-2 text-xs text-[var(--wallet-muted,#71717a)]">
              <span>{campaign.recipients.length} {t("Members")}</span>
              <span>· {count.accepted} {t("Accepted by Wallet")}</span>
              <span>· {count.failed} {t("Failed")}</span>
              <span>· {count.skipped} {t("Skipped")}</span>
              {count.pending > 0 && <span>· {count.pending} {t("Pending")}</span>}
            </p>
            {campaign.status === "complete" && (deleteId === campaign.id ? (
              <div className="mt-4 rounded-xl bg-[var(--wallet-raised,#f4f4f5)] p-3">
                <p className="text-sm">{t("Remove this message from BeLoyal history? Customers may still see it in Wallet.")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton className={primary} icon={<Trash2 size={16} />} pending={busy === "delete"} disabled={!!busy} onClick={() => deleteHistoryEntry(campaign.id)}>
                    {t("Delete from history")}
                  </ActionButton>
                  <button type="button" className={secondary} disabled={!!busy} onClick={() => setDeleteId(null)}>{t("Cancel")}</button>
                </div>
              </div>
            ) : (
              <button type="button" className={`${secondary} mt-4`} disabled={!!busy} onClick={() => { setHistoryFeedback(null); setDeleteId(campaign.id); }}>
                {t("Delete from history")}
              </button>
            ))}
          </article>;
        }) : <p className="rounded-2xl border border-dashed border-[var(--wallet-border,#e4e4e7)] p-6 text-sm text-[var(--wallet-muted,#71717a)]">{t(data ? "Sent messages will appear here." : audienceError ? "Message history is unavailable." : "Loading message history…")}</p>}
      </div>
    </section>
  </div>;
}
