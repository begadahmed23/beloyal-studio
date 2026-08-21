"use client";

import MemberList from "@/components/customers/MemberList";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function MembersPage() {
  const { cafe } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm opacity-60">
            {isBarbershop
              ? "Barbershop loyalty"
              : "Customer loyalty"}
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {isBarbershop ? "Clients" : "Members"}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
            {isBarbershop
              ? "Search clients, manage digital cards, record visits, and redeem completed rewards."
              : "Search members, manage digital cards, add stamps, and redeem completed rewards."}
          </p>
        </div>

        <NewCustomerDialog />
      </div>

      <MemberList />
    </div>
  );
}
