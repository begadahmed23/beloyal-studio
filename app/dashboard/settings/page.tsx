"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import StoreLocations from "@/components/settings/StoreLocations";
import BirthdayRewardsSettings from "@/components/settings/BirthdayRewardsSettings";
import CafeSettingsForm, { AccountSubscriptionSettings } from "@/components/settings/CafeSettingsForm";
import StaffManagementPanel from "@/components/staff/StaffManagementPanel";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { cafe, userRole, theme } = useCafeTheme();

  useEffect(() => {
    if (userRole === "CASHIER") {
      router.replace("/dashboard");
    }
  }, [router, userRole]);

  if (userRole === "CASHIER") {
    return null;
  }

  return (
    <div className="space-y-7 border p-3 shadow-sm sm:p-5 lg:p-6" style={{ backgroundColor: theme.surfaceRaised, borderColor: theme.border, borderRadius: theme.radiusLarge }}>
      <CafeSettingsForm />
      <StoreLocations key={cafe.id} />
      <BirthdayRewardsSettings />
      <StaffManagementPanel
        endpoint="/api/cafe/staff"
        title="Staff & cashier activity"
      />
      <AccountSubscriptionSettings />
    </div>
  );
}
