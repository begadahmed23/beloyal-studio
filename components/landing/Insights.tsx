import { ArrowUpRight, CalendarClock, ChartNoAxesCombined, Gift, Users } from "lucide-react";

const opportunities = [
  { icon: Users, title: "Understand your regulars", text: "Use recorded visit frequency and last-visit dates to group new, returning, and inactive members. Give each group a more relevant reason to return." },
  { icon: CalendarClock, title: "Spot a missed routine", text: "A weekly visitor and a monthly visitor have different habits. Compare recorded visits over time to decide who might need a reminder." },
  { icon: Gift, title: "Make rewards more meaningful", text: "Review stamp progress and reward redemptions to see how members use your program, then refine the rewards you offer." },
  { icon: ChartNoAxesCombined, title: "Measure what happens next", text: "For a tailored campaign, track who returns after an offer. Compare with a similar group that received no offer to estimate its impact." },
];

export default function Insights() {
  return (
    <section id="insights" className="scroll-mt-24 bg-[#edf1ec] px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-2 lg:gap-20">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#526b5e]">The data behind the loyalty</p><h2 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-[-0.05em] sm:text-5xl lg:text-6xl">Every visit tells<br />you something.</h2></div>
          <p className="max-w-xl self-end text-lg leading-8 text-neutral-600">Your loyalty program can do more than count stamps. It creates a record of member activity that helps you understand customer habits and make more informed decisions.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {opportunities.map(({icon: Icon, title, text}) => <article key={title} className="rounded-2xl border border-[#526b5e]/15 bg-white/70 p-6 sm:p-8"><Icon size={23} className="text-[#526b5e]" /><h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 max-w-xl leading-7 text-neutral-600">{text}</p></article>)}
        </div>
        <div className="mt-6 rounded-2xl bg-[#18261e] p-6 text-white sm:p-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-[#b9ceb9]">From data to a decision</p><h3 className="mt-4 text-2xl font-medium tracking-tight">“Who should we invite back?”</h3><p className="mt-4 text-sm leading-6 text-white/65">An example analysis we can shape around your business — with agreed campaign setup and measurement.</p></div>
            <ol className="space-y-5">
              {["Find members whose recorded visits have slowed down.", "Choose a relevant offer for a small test group.", "Track return visits and compare with a similar uncontacted group."].map((step, i) => <li key={step} className="flex gap-4 text-sm leading-6"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-xs text-[#b9ceb9]">{i + 1}</span><span>{step}</span></li>)}
            </ol>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-3xl text-sm leading-6 text-neutral-600">Insights reflect activity recorded through BeLoyal, not every purchase. Campaign evaluation is a tailored analysis; predictive models would require enough reliable history and validation. Revenue and spend analysis would also need transaction values.</p>
          <a href="#contact" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-[#385144] underline underline-offset-4">Talk about your data goals <ArrowUpRight size={17} /></a>
        </div>
      </div>
    </section>
  );
}
