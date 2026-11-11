"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppEnquiry({ arabic = false }: { arabic?: boolean }) {
  function openChat(button: HTMLButtonElement) {
    const form = button.closest("form");
    const details = form ? Array.from(new FormData(form).entries())
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => `${key}: ${String(value).trim()}`) : [];
    const greeting = arabic
      ? "أهلًا BeLoyal! حابب أعرف أكتر عن برنامج الولاء وإزاي أطبّقه في مشروعي."
      : "Hi BeLoyal! I'd like to know more about a loyalty program for my business.";
    const message = [greeting, ...(details.length ? ["", ...details] : [])].join("\n");
    window.open(`https://wa.me/201222134872?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }
  return <div className="mt-6 border-t border-neutral-200 pt-6">
    <button type="button" onClick={event => openChat(event.currentTarget)} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-4 text-sm font-semibold text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"><MessageCircle size={19} aria-hidden="true"/>{arabic ? "كلّمنا على واتساب" : "Chat on WhatsApp"}</button>
    <p className="mt-3 text-center text-xs leading-6 text-neutral-500">{arabic ? "هنفتح واتساب برسالة جاهزة وأي بيانات كتبتها فوق. تقدر تعدّلها قبل ما تبعتها، ومش لازم تملا الفورم." : "Opens WhatsApp with a ready message and any details entered above. Review it before sending — no form required."}</p>
  </div>;
}
