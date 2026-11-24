"use client";

import type { ReactNode } from "react";

import MbVapeLogo from "@/components/brand/MbVapeLogo";
import KatoMark from "@/components/brand/KatoMark";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import Image from "next/image";
import { fireyNashBrand, restaurantCategories } from "@/lib/business/points";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { isMbVape } from "@/lib/business/mb-vape";

import DashboardFrame from "./DashboardFrame";
import { cafeNavigation } from "./cafe-navigation";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { lang } = useBeLoyalLanguage();
  const { theme, cafe, userRole } = useCafeTheme();
  const normalizedName = cafe.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const slug = cafe.slug.toLowerCase();
  const isKato = cafe.businessType === "CAFE" && (slug.includes("kato") || normalizedName.includes("kato"));
  const isKeka = cafe.businessType === "CAFE" && (slug.includes("keka") || normalizedName.includes("keka"));
  const name = isKato ? "KATŌ" : isKeka ? "Keka" : cafe.name;
  const subtitle = isKato ? "Specialty Coffee" : isKeka ? "Little Rituals, Big Comfort" : cafe.restaurantCategory ? restaurantCategories[cafe.restaurantCategory][lang === "ar" ? "ar" : "en"] : "Loyalty Dashboard";
  const items = cafeNavigation.filter(item => (userRole !== "CASHIER" || !("adminOnly" in item)));

  let mark: ReactNode;
  if (isMbVape(cafe)) {
    mark = <MbVapeLogo className="h-10 w-11 shrink-0 border border-black/10 p-1" />;
  } else if (cafe.slug === fireyNashBrand.slug) {
    mark = <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-secondary">
      <Image src={fireyNashBrand.flame} alt="" width={13} height={23} />
    </span>;
  } else if (isKato) {
    mark = (
      <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: theme.accent, color: theme.buttonText }} aria-hidden="true">
        <KatoMark size={25} />
      </span>
    );
  } else if (cafe.logoUrl) {
    mark = (
      // Business logos can be hosted by the business.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={cafe.logoUrl} alt="" className={`size-10 shrink-0 rounded-xl ${isKeka ? "object-contain" : "border object-cover"}`} style={{ borderColor: theme.border }} />
    );
  } else {
    mark = (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl text-base font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return <DashboardFrame items={items} name={name} subtitle={subtitle} mark={mark}>{children}</DashboardFrame>;
}
