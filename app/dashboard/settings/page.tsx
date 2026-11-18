"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import WalletNotificationSettings from "@/components/wallet/WalletNotificationSettings";
import BirthdayRewardsSettings from "@/components/settings/BirthdayRewardsSettings";
import CafeSettingsForm from "@/components/settings/CafeSettingsForm";
import StaffManagementPanel from "@/components/staff/StaffManagementPanel";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const {
    cafe,
    theme,
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
      <div className="min-w-0" style={{
        "--wallet-surface": theme.surface,
        "--wallet-raised": theme.surfaceRaised,
        "--wallet-border": theme.border,
        "--wallet-text": theme.textPrimary,
        "--wallet-secondary": theme.textSecondary,
        "--wallet-muted": theme.textMuted,
        "--wallet-accent": theme.accent,
        "--wallet-accent-text": theme.accentText,
        color: theme.textPrimary,
      } as React.CSSProperties}>
        <WalletNotificationSettings cafeId={cafe.id} />
      </div>
      <BirthdayRewardsSettings />
      <StaffManagementPanel
        endpoint="/api/cafe/staff"
        title="Staff & cashier activity"
      />
    </div>
  );
}
