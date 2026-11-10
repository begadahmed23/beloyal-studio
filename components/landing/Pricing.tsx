import { ArrowUpRight, Check } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[#f5f3ee] px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#526b5e]">Pricing</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">Your business.<br /><span className="text-neutral-500">Your loyalty program.</span></h2>
          <p className="mt-7 max-w-lg text-lg leading-8 text-neutral-600">From your neighbourhood café to your next location, we build a proposal around your business, branding, and the support you need.</p>
          <p className="mt-6 text-sm leading-6 text-neutral-500">Tell us about your business. We’ll walk you through BeLoyal and agree on the scope and price before you start.</p>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)] sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-lg font-semibold">BeLoyal for your business</span><span className="rounded-full bg-[#edf2ee] px-3 py-1 text-xs font-medium text-[#526b5e]">Made for you</span></div>
          <p className="mt-9 text-4xl font-semibold sm:text-5xl tracking-[-0.05em]">Custom pricing</p>
          <p className="mt-4 leading-7 text-neutral-500">A tailored quote. A clear scope. Personal setup.</p>
          <ul className="my-8 space-y-4 border-y border-neutral-200 py-8 text-sm text-neutral-700">
            {["Your own branded digital loyalty card", "Reward rules that fit your business", "QR joining, stamping, and redemption", "Customer insights and member management", "Team access and guided onboarding"].map(item => <li key={item} className="flex items-center gap-3"><Check size={17} className="shrink-0 text-[#526b5e]" />{item}</li>)}
          </ul>
          <a href="#contact" className="flex min-h-13 items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800">Get my custom quote <ArrowUpRight size={17} /></a>
          <p className="mt-4 text-center text-xs text-neutral-500">No payment required to enquire.</p>
        </div>
      </div>
    </section>
  );
}
