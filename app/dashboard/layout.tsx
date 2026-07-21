import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import CafeThemeProvider from "@/components/theme/CafeThemeProvider";
import { requireAuth } from "@/lib/require-auth";

type Props = {
  children: ReactNode;
};

function serializeDate(date: Date | null) {
  return date ? date.toISOString() : null;
}

export default async function DashboardLayout({
  children,
}: Props) {
  const authData = await requireAuth(await headers());

  if (!authData) {
    redirect("/login");
  }

  if (
    authData.isSuperAdmin ||
    !authData.cafe ||
    !authData.cafeId
  ) {
    redirect("/studio");
  }

  const cafe = authData.cafe;

  if (!cafe.isActive) {
    redirect("/login");
  }

  return (
    <CafeThemeProvider
      themeName={cafe.theme}
      cafe={{
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        logoUrl: cafe.logoUrl,

        rewardTarget: cafe.rewardTarget,
        rewardName: cafe.rewardName,
        rewardDescription:
          cafe.rewardDescription,
        eligiblePurchaseDescription:
          cafe.eligiblePurchaseDescription,
        minimumPurchaseAmount:
          cafe.minimumPurchaseAmount?.toString() ??
          null,

        whatsappBusinessNumber:
          cafe.whatsappBusinessNumber,
        whatsappEnabled: cafe.whatsappEnabled,

        subscriptionStatus:
          cafe.subscriptionStatus,

        trialStartedAt: serializeDate(
          cafe.trialStartedAt
        ),
        trialEndsAt: serializeDate(cafe.trialEndsAt),
        subscriptionStartedAt: serializeDate(
          cafe.subscriptionStartedAt
        ),
        subscriptionEndsAt: serializeDate(
          cafe.subscriptionEndsAt
        ),

        monthlyPrice:
          cafe.monthlyPrice?.toString() ?? null,

        isActive: cafe.isActive,
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </CafeThemeProvider>
  );
}