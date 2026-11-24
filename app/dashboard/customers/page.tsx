"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import PointsMemberDirectory from "@/components/customers/PointsMemberDirectory";
import AdminCustomerDatabase from "@/components/customers/AdminCustomerDatabase";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function CustomersPage() {
  const router = useRouter();
  const { cafe, userRole } = useCafeTheme();

  useEffect(() => {
    if (userRole === "CASHIER") {
      router.replace("/dashboard");
    }
  }, [router, userRole]);

  if (userRole === "CASHIER") {
    return null;
  }

  return cafe.loyaltyMode === "POINTS" ? <PointsMemberDirectory database /> : <AdminCustomerDatabase />;
}
