"use client";

import type { ReactNode } from "react";
import { Scissors } from "lucide-react";

import DashboardFrame from "@/components/dashboard/DashboardFrame";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import { barberNavigation } from "./barber-navigation";

export default function BarberDashboardShell({ children }: { children: ReactNode }) {
  const { cafe, theme, userRole } = useCafeTheme();
  const items = barberNavigation.filter((item) => userRole !== "CASHIER" || !("adminOnly" in item));
  const mark = cafe.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cafe.logoUrl} alt="" className="size-10 shrink-0 rounded-xl border object-cover" style={{ borderColor: theme.border }} />
  ) : (
    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ color: theme.accent, backgroundColor: theme.accentSoft }}>
      <Scissors size={19} />
    </span>
  );

  return <DashboardFrame items={items} name={cafe.name} subtitle="Barber loyalty" mark={mark}>{children}</DashboardFrame>;
}
