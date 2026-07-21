import { headers } from "next/headers";
import { redirect } from "next/navigation";

import CafeSettingsForm from "@/components/settings/CafeSettingsForm";
import { requireAuth } from "@/lib/require-auth";

export default async function SettingsPage() {
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

  return (
    <CafeSettingsForm
      accountEmail={authData.user.email}
    />
  );
}