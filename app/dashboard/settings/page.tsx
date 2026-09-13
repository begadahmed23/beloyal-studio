import { headers } from "next/headers";
import { redirect } from "next/navigation";

import BirthdayRewardsSettings from "@/components/settings/BirthdayRewardsSettings";
import CafeSettingsForm from "@/components/settings/CafeSettingsForm";
import StaffManagementPanel from "@/components/staff/StaffManagementPanel";
import { requireAuth } from "@/lib/require-auth";

export default async function SettingsPage() {
  const authData = await requireAuth(await headers());

  if (!authData) {
    redirect("/login");
  }

  if (authData.isCashier) {
    redirect("/dashboard");
  }

  if (
    authData.isSuperAdmin ||
    !authData.cafe ||
    !authData.cafeId
  ) {
    redirect("/studio");
  }

  return (
    <div className="space-y-7">
      <StaffManagementPanel
        endpoint="/api/cafe/staff"
        title="Staff & cashier activity"
      />
      <BirthdayRewardsSettings />
      <CafeSettingsForm
        accountEmail={authData.user.email}
      />
    </div>
  );
}
