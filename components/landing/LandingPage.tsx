"use client";

import { useEffect, useState } from "react";
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
    <main lang={arabic ? "ar" : "en"} dir={arabic ? "rtl" : "ltr"} style={{ colorScheme: "light", ...(arabic ? {fontFamily: 'Tahoma, Arial, sans-serif'} : {}) }} className="min-h-screen bg-white text-neutral-950 [--landing-header-height:121px] sm:[--landing-header-height:69px] [&_section[id]]:scroll-mt-[var(--landing-header-height)]">
      <Navbar arabic={arabic} onLanguageChange={changeLanguage} />
      {arabic ? <ArabicLanding /> : <><Hero /><Features /><HowItWorks /><Insights /><Pricing /><FAQ /><Contact /><Footer /></>}
    </main>
  );
}
