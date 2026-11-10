"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import FAQ from "./FAQ";
import Contact from "./Contact";
import Insights from "./Insights";
import Pricing from "./Pricing";
import Footer from "./Footer";
import ArabicLanding from "./ArabicLanding";

export default function LandingPage() {
  const [arabic, setArabic] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  function navigateToSection(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = link?.getAttribute("href")?.slice(1);
    if (!id || !pageRef.current?.querySelector(`[id="${id}"]`)) return;
    event.preventDefault();
    // Wait for the mobile menu to close before measuring the final layout.
    requestAnimationFrame(() => {
      const page = pageRef.current;
      const section = document.getElementById(id);
      const header = page?.querySelector("header");
      if (!page || !section || !header) return;
      const top = window.scrollY + section.getBoundingClientRect().top - header.getBoundingClientRect().height;
      window.history.pushState(null, "", `#${id}`);
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    });
  }
  useEffect(() => {
    const language = new URLSearchParams(window.location.search).get("lang");
    setArabic(language === "ar");
    const sync = () => setArabic(new URLSearchParams(window.location.search).get("lang") === "ar");
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    document.documentElement.lang = arabic ? "ar" : "en";
    document.documentElement.dir = arabic ? "rtl" : "ltr";
    return () => { document.documentElement.lang = "en"; document.documentElement.dir = "ltr"; };
  }, [arabic]);
  function changeLanguage() {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", arabic ? "en" : "ar");
    window.history.pushState(null, "", url);
    setArabic(!arabic);
  }
  return (
    <main ref={pageRef} onClick={navigateToSection} lang={arabic ? "ar" : "en"} dir={arabic ? "rtl" : "ltr"} style={{ colorScheme: "light", ...(arabic ? {fontFamily: 'Tahoma, Arial, sans-serif'} : {}) }} className="landing-page min-h-screen bg-white text-neutral-950">
      <Navbar arabic={arabic} onLanguageChange={changeLanguage} />
      {arabic ? <ArabicLanding /> : <><Hero /><Features /><HowItWorks /><Insights /><Pricing /><FAQ /><Contact /><Footer /></>}
    </main>
  );
}
