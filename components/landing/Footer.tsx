import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function TikTokIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M16.6 2h-3.2v13.3a3 3 0 1 1-2.5-3v-3.2a6.2 6.2 0 1 0 5.7 6.2V8.6a8.2 8.2 0 0 0 4.7 1.5V6.9A4.8 4.8 0 0 1 16.6 2Z" /></svg>;
}

export default function Footer({ arabic = false }: { arabic?: boolean }) {
  const product = arabic ? [["المميزات", "#features"], ["طريقة الاستخدام", "#how-it-works"], ["تحليل العملاء", "#insights"], ["الأسعار", "#pricing"], ["الأسئلة الشائعة", "#faq"]] : [["Features", "#features"], ["How it works", "#how-it-works"], ["Customer insights", "#insights"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  const legal = arabic ? [["الخصوصية (بالإنجليزية)", "/privacy"], ["الشروط (بالإنجليزية)", "/terms"], ["حذف البيانات (بالإنجليزية)", "/data-deletion"]] : [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Data Deletion", "/data-deletion"]];
  return (
    <footer className="overflow-hidden bg-[#111713] px-5 pb-8 pt-16 text-white sm:px-8 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-8 border-b border-white/15 pb-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-[#afc5b2]">{arabic ? "خلّينا على تواصل" : "Stay in the loop"}</p><h2 className={`mt-4 text-3xl font-medium sm:text-5xl ${arabic ? "leading-[1.5]" : "leading-tight tracking-[-0.04em]"}`}>{arabic ? <>الزيارة الجاية<br />بتبدأ بفكرة.</> : <>Good things<br />are worth returning for.</>}</h2><p className="mt-5 max-w-md text-sm leading-7 text-white/60">{arabic ? "تابع BeLoyal لأفكار عن ولاء العملاء، ونظرة أقرب للي بنبنيه." : "Follow BeLoyal for ideas on customer loyalty and a closer look at what we’re building."}</p></div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {[{name:"Instagram",url:"https://www.instagram.com/getbeloyal.app/",icon:<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>},{name:"TikTok",url:"https://www.tiktok.com/@getbeloyal.app",icon:<TikTokIcon/>}].map(({name,url,icon}) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name} — @getbeloyal.app${arabic ? " (بيفتح في صفحة جديدة)" : " (opens in a new tab)"}`} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.035] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#afc5b2]/50 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#afc5b2] motion-reduce:transform-none"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#afc5b2]/10 text-[#c1d4c4]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-base font-medium" dir="ltr">{name}</span><span className="mt-1 block text-xs text-white/55" dir="ltr">@getbeloyal.app</span></span><ArrowUpRight aria-hidden="true" size={18} className="shrink-0 text-white/40 transition group-hover:text-white"/></a>)}
          </div>
        </div>
        <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_0.8fr_1fr] md:gap-16">
          <div><Link href="/" dir="ltr" className="inline-flex items-center gap-3 text-2xl font-semibold tracking-tight"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-lg">B</span>BeLoyal</Link><p className="mt-5 max-w-sm text-sm leading-7 text-white/60">{arabic ? "ادّيهم سبب يرجعوا تاني. ولاء رقمي للكافيهات والصالونات ومغاسل العربيات والمخابز." : "Give them a reason to return. Digital loyalty for cafés, salons, car washes, and bakeries."}</p><a href="mailto:getbeloyal@gmail.com" dir="ltr" className="mt-5 inline-block break-all text-sm text-[#c1d4c4] underline decoration-[#c1d4c4]/30 underline-offset-4 hover:decoration-[#c1d4c4]">getbeloyal@gmail.com</a></div>
          <nav aria-label={arabic ? "روابط المنتج" : "Product links"}><h3 className="text-sm font-semibold">{arabic ? "اكتشف BeLoyal" : "Explore BeLoyal"}</h3><div className="mt-4 flex flex-col items-start gap-1 text-sm text-white/60">{product.map(([name,href]) => <a key={href} href={href} className="py-2 hover:text-white">{name}</a>)}<Link href="/login" className="py-2 hover:text-white">{arabic ? "دخول أصحاب الأعمال" : "Business login"}</Link></div></nav>
          <nav aria-label={arabic ? "معلومات قانونية" : "Legal links"}><h3 className="text-sm font-semibold">{arabic ? "معلومات تهمّك" : "The details"}</h3><div className="mt-4 flex flex-col items-start gap-1 text-sm text-white/60">{legal.map(([name,href]) => <Link key={href} href={href} className="py-2 hover:text-white">{name}</Link>)}</div></nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/15 pt-6 text-xs leading-6 text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>{arabic ? "© 2026 BeLoyal. جميع الحقوق محفوظة." : "© 2026 BeLoyal. All rights reserved."}</p><p>{arabic ? "من الإسكندرية، مصر" : "From Alexandria, Egypt"}</p></div>
      </div>
    </footer>
  );
}
