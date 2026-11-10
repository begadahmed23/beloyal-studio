"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";

const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none transition focus:border-[#526b5e] focus:ring-2 focus:ring-[#526b5e]/20";

export default function Contact() {
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = ["Hi BeLoyal, I'd like a custom quote.", "", ...["Business name", "Your name", "Email", "Phone / WhatsApp", "Business type", "Branches", "What do you have in mind?"].map(key => `${key}: ${String(data.get(key) || "Not provided").trim()}`)].join("\n");
    const url = `mailto:begad.ahmed124@gmail.com?subject=${encodeURIComponent(`BeLoyal quote — ${data.get("Business name")}`)}&body=${encodeURIComponent(body)}`;
    setEmailDraft(url);
    window.location.href = url;
  }
  return (
    <section id="contact" className="scroll-mt-24 border-t border-neutral-200 bg-[#fcfbf8] px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#526b5e]">Let’s talk loyalty</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">Your next regular<br />starts here.</h2>
          <p className="mt-7 max-w-md text-lg leading-8 text-neutral-600">Tell us a little about your business. We’ll help you shape a loyalty program your customers will want to come back to.</p>
          <div className="mt-10 border-t border-neutral-200 pt-6 text-sm leading-7 text-neutral-500"><p>Prefer to reach out directly?</p><a className="break-all font-medium text-neutral-950 underline underline-offset-4" href="mailto:begad.ahmed124@gmail.com">begad.ahmed124@gmail.com</a></div>
          <p className="mt-8 text-sm text-neutral-500">Already with BeLoyal? <Link href="/login" className="font-medium text-neutral-950 underline underline-offset-4">Business login</Link></p>
        </div>
        <form onSubmit={submit} className="rounded-[2rem] border border-neutral-200 bg-white p-6 sm:p-10">
          <h3 className="text-2xl font-semibold tracking-tight">Get your custom quote</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">A few details to help us understand what you need.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[{name:"Business name", auto:"organization",type:"text"},{name:"Your name",auto:"name",type:"text"},{name:"Email",auto:"email",type:"email"},{name:"Phone / WhatsApp",auto:"tel",type:"tel"}].map(input => <label key={input.name} className="text-sm font-medium text-neutral-700">{input.name}<input required name={input.name} autoComplete={input.auto} type={input.type} maxLength={160} className={field} /></label>)}
            <label className="text-sm font-medium text-neutral-700">Business type<select name="Business type" required defaultValue="" className={field}><option value="" disabled>Select your business</option>{["Café / Coffee shop", "Restaurant / Bakery", "Barbershop / Salon", "Other"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-medium text-neutral-700">Number of branches<select name="Branches" required defaultValue="" className={field}><option value="" disabled>Select branches</option>{["1", "2–5", "6–10", "11+"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-medium text-neutral-700 sm:col-span-2">What do you have in mind? <span className="font-normal text-neutral-400">(optional)</span><textarea name="What do you have in mind?" rows={3} maxLength={1500} placeholder="Your rewards idea, goals, or any special requirements…" className={field} /></label>
          </div>
          <p className="mt-5 text-xs leading-5 text-neutral-500">Your details will be used to respond to your enquiry. See our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
          <button type="submit" className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800">Prepare my quote enquiry <ArrowUpRight size={17} /></button>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-500">Opens a draft in your email app for you to send.</p>
          {emailDraft && <p role="status" className="mt-5 rounded-xl bg-[#edf2ee] p-4 text-sm leading-6 text-[#385144]">Your email draft is ready. Send it from your email app to complete your enquiry. <a href={emailDraft} className="font-semibold underline">Open draft again</a></p>}
        </form>
      </div>
    </section>
  );
}
