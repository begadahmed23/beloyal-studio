import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AdminCustomerDatabase from "@/components/customers/AdminCustomerDatabase";
import { requireAuth } from "@/lib/require-auth";

export default async function CustomersPage() {
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

  return <AdminCustomerDatabase />;
}
