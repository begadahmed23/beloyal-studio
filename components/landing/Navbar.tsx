"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [["Features", "#features"], ["How it works", "#how-it-works"], ["Customer insights", "#insights"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/95 text-neutral-950 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="BeLoyal home" className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-[-0.04em]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-sm text-white">B</span>BeLoyal</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-neutral-600 lg:flex">{links.map(([label, href]) => <a key={href} href={href} className="py-3 transition hover:text-black">{label}</a>)}</nav>
        <div className="flex items-center gap-2"><a href="#contact" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white sm:px-5 sm:text-sm">Get a quote ↗</a><button type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 lg:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-neutral-200 bg-white px-5 py-3 lg:hidden">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-neutral-100 py-3.5 text-sm font-medium">{label}</a>)}<Link href="/login" className="block py-3.5 text-sm text-neutral-500">Business login</Link></nav>}
    </header>
  );
}
