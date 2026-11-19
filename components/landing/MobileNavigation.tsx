"use client";

import { SlidingSelection } from "@/components/ui/sliding-selection";
import { LayoutGrid, ChartNoAxesCombined, Tag, Wallet, MessageCircle } from "lucide-react";

export default function MobileNavigation({ arabic = false, active }: { arabic?: boolean; active: string }) {
  const message = arabic ? "أهلًا BeLoyal! حابب أعرف أكتر عن برنامج الولاء لمشروعي." : "Hi BeLoyal! I'd like to know more about a loyalty program for my business.";
  const items = [
    { label: arabic ? "المميزات" : "Features", href: "#features", icon: LayoutGrid },
    { label: arabic ? "البيانات" : "Insights", href: "#insights", icon: ChartNoAxesCombined },
    { label: arabic ? "الأسعار" : "Pricing", href: "#pricing", icon: Tag },
    { label: "Wallet", href: "#wallet", icon: Wallet },
    { label: arabic ? "واتساب" : "WhatsApp", href: `https://wa.me/201222134872?text=${encodeURIComponent(message)}`, icon: MessageCircle },
  ];
  return <nav aria-label={arabic ? "اختصارات الصفحة" : "Page shortcuts"} className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] text-neutral-950 sm:hidden">
    <SlidingSelection value={active} indicatorColor="#171717" className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">{items.map(({label,href,icon:Icon}) => {
      const external = href.startsWith("https:");
      const selected = href === `#${active}`;
      return <a key={href} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} aria-current={selected ? "location" : undefined} data-selection={selected ? "active" : undefined} aria-label={external ? `${label}${arabic ? " (صفحة جديدة)" : " (opens in a new tab)"}` : undefined} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium motion-safe:transition-colors ${selected ? "text-white" : "text-neutral-600 hover:bg-neutral-100"}`}><Icon aria-hidden="true" size={19} strokeWidth={1.7}/><span>{label}</span></a>;
    })}</SlidingSelection>
  </nav>;
}
