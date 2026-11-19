"use client";

import { useSyncExternalStore } from "react";
import { dashboardArabic } from "@/lib/business/dashboard-arabic";

const languageKey = "beloyal-language";
const languageEvent = "beloyal-language-change";

function subscribe(onChange: () => void) {
  window.addEventListener(languageEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(languageEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let sessionArabic = false;

function getLanguage() {
  try {
    return window.localStorage.getItem(languageKey) === "ar";
  } catch {
    return sessionArabic;
  }
}
const serverLanguage = () => false;

const toArabic = (english: string) => dashboardArabic.get(english) ?? english;
const toEnglish = (english: string) => english;

export function useBeLoyalLanguage() {
  const arabic = useSyncExternalStore(subscribe, getLanguage, serverLanguage);
  return { arabic, lang: arabic ? "ar" : "en", dir: arabic ? "rtl" : "ltr",
    t: arabic ? toArabic : toEnglish,
  } as const;
}

export default function LanguageToggle() {
  const { arabic } = useBeLoyalLanguage();

  return (
    <button type="button" dir="ltr" lang={arabic ? "en" : "ar"}
      aria-label={arabic ? "Switch to English" : "التبديل إلى العربية"}
      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-current/20 px-2.5 text-xs font-semibold transition-opacity active:opacity-70"
      onClick={() => {
        sessionArabic = !arabic;
        try {
          window.localStorage.setItem(languageKey, sessionArabic ? "ar" : "en");
        } catch {
          // Keep the language switch usable when browser storage is blocked.
        }
        window.dispatchEvent(new Event(languageEvent));
      }}>
      {arabic ? "EN" : "عربي"}
    </button>
  );
}
