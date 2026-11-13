"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, ChartNoAxesCombined, Tag, Wallet, MessageCircle } from "lucide-react";

export default function MobileNavigation({ arabic = false }: { arabic?: boolean }) {
  const [active, setActive] = useState("");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const header = document.querySelector(".landing-page > header");
      const threshold = (header?.getBoundingClientRect().height ?? 120) + 64;
      let current = "";
      for (const section of document.querySelectorAll<HTMLElement>(".landing-page section[id]")) {
        if (section.getBoundingClientRect().top <= threshold) current = section.id;
      }
      setActive(current);
      frame = 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [arabic]);
  const message = arabic ? "أهلًا BeLoyal! حابب أعرف أكتر عن برنامج الولاء لمشروعي." : "Hi BeLoyal! I'd like to know more about a loyalty program for my business.";
  const items = [
    { label: arabic ? "المميزات" : "Features", href: "#features", icon: LayoutGrid },
    { label: arabic ? "البيانات" : "Insights", href: "#insights", icon: ChartNoAxesCombined },
    { label: arabic ? "الأسعار" : "Pricing", href: "#pricing", icon: Tag },
    { label: "Wallet", href: "#wallet", icon: Wallet },
    { label: arabic ? "واتساب" : "WhatsApp", href: `https://wa.me/201222134872?text=${encodeURIComponent(message)}`, icon: MessageCircle },
  ];
  return <nav aria-label={arabic ? "اختصارات الصفحة" : "Page shortcuts"} className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] text-neutral-950 sm:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">{items.map(({label,href,icon:Icon}) => {
      const external = href.startsWith("https:");
      const selected = href === `#${active}`;
      return <a key={href} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} aria-current={selected ? "location" : undefined} aria-label={external ? `${label}${arabic ? " (صفحة جديدة)" : " (opens in a new tab)"}` : undefined} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors ${selected ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}><Icon aria-hidden="true" size={19} strokeWidth={1.7}/><span>{label}</span></a>;
    })}</div>
  </nav>;
}
