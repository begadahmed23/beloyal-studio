"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import BirthdayRewardsSettings from "@/components/settings/BirthdayRewardsSettings";
import CafeSettingsForm from "@/components/settings/CafeSettingsForm";
import StaffManagementPanel from "@/components/staff/StaffManagementPanel";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const {
    accountEmail,
    userRole,
  } = useCafeTheme();

  useEffect(() => {
    if (userRole === "CASHIER") {
      router.replace("/dashboard");
    }
  }, [router, userRole]);

  if (userRole === "CASHIER") {
    return null;
  }

  return (
    <div className="space-y-7">
      <CafeSettingsForm
        accountEmail={accountEmail}
      />
      <BirthdayRewardsSettings />
      <StaffManagementPanel
        endpoint="/api/cafe/staff"
        title="Staff & cashier activity"
      />
    </div>
  );
}
