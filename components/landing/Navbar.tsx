"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ arabic = false, onLanguageChange }: { arabic?: boolean; onLanguageChange?: () => void }) {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    const page = bar?.closest("main");
    if (!bar || !page) return;
    // Measure the persistent bar, excluding the collapsible mobile menu.
    const updateOffset = () => {
      const border = bar.parentElement ? parseFloat(getComputedStyle(bar.parentElement).borderBottomWidth) || 0 : 0;
      page.style.setProperty("--landing-header-height", `${bar.getBoundingClientRect().height + border}px`);
    };
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  const links = arabic ? [["المميزات", "#features"], ["طريقة الاستخدام", "#how-it-works"], ["تحليل العملاء", "#insights"], ["الأسعار", "#pricing"]] : [["Features", "#features"], ["How it works", "#how-it-works"], ["Customer insights", "#insights"], ["Pricing", "#pricing"]];
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/95 text-neutral-950 backdrop-blur-xl">
      <div ref={barRef} className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label={arabic ? "الصفحة الرئيسية لـ BeLoyal" : "BeLoyal home"} className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-[-0.04em]" dir="ltr"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-sm text-white">B</span>BeLoyal</Link>
        <nav aria-label={arabic ? "التنقل الرئيسي" : "Main navigation"} className="hidden items-center gap-5 text-sm text-neutral-600 xl:flex">{links.map(([label, href]) => <a key={href} href={href} className="py-3 transition hover:text-black">{label}</a>)}</nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setOpen(false); onLanguageChange?.(); }} lang={arabic ? "en" : "ar"} aria-label={arabic ? "Switch to English" : "التبديل إلى العربية"} className="min-h-11 rounded-full px-3 text-sm font-medium hover:bg-neutral-100">{arabic ? "English" : "العربية"}</button>
          <div className="hidden items-center gap-2 sm:flex"><Link href="/login" className="inline-flex min-h-11 items-center rounded-full border border-neutral-300 px-4 text-sm font-medium">{arabic ? "دخول أصحاب الأعمال" : "Business login"}</Link><a href="#contact" className="inline-flex min-h-11 items-center rounded-full bg-black px-5 text-sm font-semibold text-white">{arabic ? "خلّينا نتكلم" : "Let’s talk"}</a></div>
          <button type="button" aria-label={arabic ? (open ? "إغلاق القائمة" : "فتح القائمة") : (open ? "Close navigation" : "Open navigation")} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 xl:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:hidden"><Link href="/login" className="flex min-h-11 items-center justify-center rounded-full border border-neutral-300 px-3 text-sm font-medium">{arabic ? "دخول أصحاب الأعمال" : "Business login"}</Link><a href="#contact" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-full bg-black px-3 text-sm font-semibold text-white">{arabic ? "خلّينا نتكلم" : "Let’s talk"}</a></div>
      </div>
      {open && <nav id="mobile-navigation" aria-label={arabic ? "قائمة التنقل" : "Mobile navigation"} className="max-h-[60dvh] overflow-y-auto border-t border-neutral-200 bg-white px-5 py-3 xl:hidden">{links.concat([[arabic ? "الأسئلة الشائعة" : "FAQ", "#faq"]]).map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-neutral-100 py-3.5 text-sm font-medium">{label}</a>)}</nav>}
    </header>
  );
}
