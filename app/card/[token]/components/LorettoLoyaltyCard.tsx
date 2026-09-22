"use client";

import { Cake, ChevronRight, MessageCircle, QrCode, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { Customer } from "./LoyaltyCard";

type Props = {
  customer: Customer; refreshing: boolean; newStampIndex: number | null;
  birthdayText: string; daysUntilBirthday: number; rewardTarget: number;
  visibleStamps: number; rewardReady: boolean; remainingStamps: number;
  onRefresh: () => void; onShowQrCode: () => void; onShowFeedback: () => void;
};

function LorettoStamp({ active, dark }: { active: boolean; dark: boolean }) {
  const plum = "#625565";
  const cream = "#F1E8D5";
  const ink = dark ? cream : plum;

  return (
    <div
      className="relative flex h-10 w-10 items-center justify-center rounded-full border min-[390px]:h-11 min-[390px]:w-11"
      style={{
        borderColor: active ? ink : dark ? "rgba(241,232,213,.22)" : "rgba(98,85,101,.20)",
        backgroundColor: active ? ink : "transparent",
        color: active ? (dark ? "#514552" : cream) : dark ? "rgba(241,232,213,.36)" : "rgba(98,85,101,.34)",
        boxShadow: active ? "0 6px 16px rgba(72,61,74,.14)" : "none",
      }}
    >
      <span className="font-serif text-[13px] font-semibold tracking-[-0.05em]">LO</span>
    </div>
  );
}

export default function LorettoLoyaltyCard({customer,refreshing,newStampIndex,birthdayText,daysUntilBirthday,rewardTarget,visibleStamps,rewardReady,onRefresh,onShowQrCode,onShowFeedback}:Props) {
  const [birthdayOpen,setBirthdayOpen]=useState(false);
  const dark=customer.cafe.theme==="DARK_LUXURY";
  const plum="#625565", plumDeep="#514552", cream="#F1E8D5", creamDeep="#E8DCC5", sage="#899087";
  const muted=dark?"rgba(241,232,213,.62)":"rgba(81,69,82,.56)";
  const border=dark?"rgba(241,232,213,.14)":"rgba(98,85,101,.13)";
  const surface=dark?"rgba(241,232,213,.055)":"rgba(255,255,255,.28)";
  const text=dark?cream:plumDeep;
  const paidTarget=Math.max(rewardTarget,1), totalSlots=paidTarget+1;
  const displayStamps=Math.min(visibleStamps,paidTarget), remaining=Math.max(paidTarget-displayStamps,0);
  const progressPercent=rewardReady?100:Math.min((displayStamps/paidTarget)*100,100);
  const customerName=customer.name?customer.name.charAt(0).toUpperCase()+customer.name.slice(1):"";
  const progressMessage=rewardReady?"Your next drink is on us.":displayStamps===0?"Your first visit starts here.":remaining===1?"One more visit until your reward.":remaining+" more visits until your reward.";

  return <div className="mx-auto w-full max-w-[430px]">
    <div className="overflow-hidden rounded-[30px] border px-5 pb-6 pt-6 min-[390px]:rounded-[34px] min-[390px]:px-7 min-[390px]:pb-8"
      style={{color:text,borderColor:border,background:dark?"radial-gradient(circle at 88% 4%,rgba(241,232,213,.08),transparent 28%),linear-gradient(150deg,#6B5D6C 0%,#574A59 58%,#463B48 100%)":"radial-gradient(circle at 88% 4%,rgba(98,85,101,.07),transparent 28%),radial-gradient(circle at 6% 88%,rgba(137,144,135,.08),transparent 30%),linear-gradient(155deg,#F5EDDD 0%,#EEE3CE 58%,#E8DCC5 100%)",boxShadow:dark?"0 28px 90px rgba(48,39,49,.28)":"0 28px 80px rgba(81,69,82,.12)"}}>
      <header>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="flex items-baseline font-serif text-[2.55rem] font-medium uppercase leading-none tracking-[-0.07em] min-[390px]:text-[2.9rem]"
              style={{ color: text }}
              aria-label="LORETTO"
            >
              <span>LO</span>
              <span className="inline-block" style={{ transform: "scaleX(-1)", marginInline: "-0.015em" }} aria-hidden="true">R</span>
              <span>ETTO</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-px w-5" style={{ backgroundColor: dark ? "rgba(241,232,213,.24)" : "rgba(98,85,101,.24)" }} />
              <p className="text-[8px] font-semibold uppercase tracking-[0.28em]" style={{ color: muted }}>
                Artisan coffee & bakery
              </p>
            </div>
          </div>

          <button type="button" onClick={onRefresh} disabled={refreshing} aria-label="Refresh loyalty card"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50"
            style={{ color: muted, backgroundColor: surface }}>
            <RefreshCw size={16} className={refreshing?"animate-spin":""}/>
          </button>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-medium" style={{ color: muted }}>Good to see you,</p>
            <h1 className="mt-1 max-w-full truncate pb-[.12em] font-serif text-[2.2rem] font-semibold leading-[1.08] tracking-[-.045em]">
              {customerName}
            </h1>
          </div>
          <span className="mb-1 shrink-0 text-[9px] font-semibold uppercase tracking-[.24em]" style={{ color: sage }}>
            Alexandria
          </span>
        </div>
      </header>
      <div className="my-6 h-px" style={{backgroundColor:border}}/>
      {(customer.cafe.eligiblePurchaseDescription?.trim()||customer.cafe.rewardDescription?.trim())&&<div className="mb-6 flex items-start justify-between gap-5 text-[11px] leading-5" style={{color:muted}}>
        <p className="max-w-[58%]">{customer.cafe.eligiblePurchaseDescription?.trim()}</p><p className="max-w-[38%] text-right font-medium" style={{color:text}}>{customer.cafe.rewardDescription?.trim()}</p></div>}
      <section
        className="relative overflow-hidden rounded-[24px] px-4 pb-5 pt-5 min-[390px]:rounded-[28px] min-[390px]:px-5 min-[390px]:pb-6"
        style={{
          background: dark
            ? "rgba(241,232,213,.07)"
            : "linear-gradient(145deg,#6B5D6C 0%,#625565 55%,#554857 100%)",
          color: cream,
          boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,.04)" : "0 18px 38px rgba(81,69,82,.16)",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[.28em]" style={{ color: "rgba(241,232,213,.70)" }}>
            Your Loretto card
          </p>
          <p className="text-[15px] font-semibold tracking-[.08em]">{displayStamps} / {totalSlots}</p>
        </div>

        <div className="mt-6 grid items-center gap-1" style={{gridTemplateColumns:`repeat(${totalSlots},minmax(0,1fr))`}}>
          {Array.from({length:totalSlots}).map((_,index)=>{
            const active=index<paidTarget&&index<displayStamps;
            const isNew=index<paidTarget&&newStampIndex===index;
            return <div key={index} className={"flex min-w-0 justify-center "+(isNew?"loretto-stamp-glow":"")}><LorettoStamp active={active} dark={true}/></div>;
          })}
        </div>

        <div className="mt-6">
          <div className="h-[3px] overflow-hidden rounded-full" style={{backgroundColor:"rgba(241,232,213,.14)"}}>
            <div className="h-full rounded-full transition-[width] duration-700" style={{width:progressPercent+"%",backgroundColor:cream}}/>
          </div>
          <p className="mt-4 text-center font-serif text-[15px]" style={{color:"rgba(241,232,213,.76)"}}>{progressMessage}</p>
        </div>
      </section>
      <div className="my-7 flex items-center justify-center gap-3"><span className="h-px w-8" style={{backgroundColor:border}}/><span className="text-[8px] font-semibold uppercase tracking-[.35em]" style={{color:muted}}>Alexandria · Egypt</span><span className="h-px w-8" style={{backgroundColor:border}}/></div>
      <button type="button" onClick={()=>setBirthdayOpen(v=>!v)} className="flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left" style={{borderColor:border,backgroundColor:surface}}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]" style={{backgroundColor:surface}}><Cake size={18}/></div>
        <div className="min-w-0 flex-1"><p className="text-[11px]" style={{color:muted}}>Your Birthday</p><p className="mt-.5 font-serif text-[15px] font-semibold">{birthdayText}</p></div>
        <p className="shrink-0 text-[11px]" style={{color:muted}}>{daysUntilBirthday===0?"Today":`In ${daysUntilBirthday} ${daysUntilBirthday===1?"day":"days"}`}</p><ChevronRight size={17} style={{color:muted,transform:birthdayOpen?"rotate(90deg)":"none"}}/>
      </button>
      {birthdayOpen&&<div className="mt-2 rounded-[18px] border px-4 py-4 text-xs leading-5" style={{borderColor:border,backgroundColor:surface,color:muted}}>
        {customer.cafe.birthdayRewardsEnabled?<><p className="font-semibold" style={{color:text}}>{customer.cafe.birthdayRewardName||"Birthday Reward"}</p>{customer.cafe.birthdayRewardDescription&&<p className="mt-2">{customer.cafe.birthdayRewardDescription}</p>}{customer.cafe.birthdayPurchaseRequirement&&<p className="mt-2">{customer.cafe.birthdayPurchaseRequirement}</p>}<p className="mt-2">Valid for {customer.cafe.birthdayValidityDays} {customer.cafe.birthdayValidityDays===1?"day":"days"} from your birthday.</p></>:<p>Birthday rewards are not currently active.</p>}
      </div>}
      <button type="button" onClick={onShowQrCode} className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-[20px] text-[15px] font-semibold transition hover:-translate-y-.5" style={{backgroundColor:dark?cream:plum,color:dark?plumDeep:cream}}><QrCode size={18}/>Show QR Code</button>
      {customer.cafe.feedbackEnabled&&<button type="button" onClick={onShowFeedback} className="mt-3 flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left" style={{borderColor:border,backgroundColor:surface}}>
        <div className="flex items-center gap-3"><MessageCircle size={18}/><div><p className="text-sm font-semibold">Share your thoughts</p><p className="mt-.5 text-[11px]" style={{color:muted}}>Tell us about your Loretto visit.</p></div></div><ChevronRight size={17} style={{color:muted}}/>
      </button>}
    </div>
    <p className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[.28em]" style={{color:dark?"rgba(241,232,213,.40)":"rgba(81,69,82,.42)"}}>Powered by BeLoyal</p>
    <style jsx global>{`@keyframes loretto-stamp-glow{0%,100%{filter:drop-shadow(0 0 0 rgba(196,145,87,0))}45%{filter:drop-shadow(0 0 8px rgba(196,145,87,.75)) drop-shadow(0 0 17px rgba(242,228,194,.55))}}.loretto-stamp-glow{animation:loretto-stamp-glow 760ms cubic-bezier(.16,1,.3,1) both}@media(prefers-reduced-motion:reduce){.loretto-stamp-glow{animation:none}} `}</style>
  </div>;
}
