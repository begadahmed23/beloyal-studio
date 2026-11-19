"use client";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import CashierMemberList from "@/components/customers/CashierMemberList";
import MemberList from "@/components/customers/MemberList";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function MembersPage() {
  const { t } = useBeLoyalLanguage();
  const { cafe, userRole } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";

  if (userRole === "CASHIER") {
    return (
      <div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm opacity-60">{t("Counter loyalty")}</p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {isBarbershop ? t("Clients") : t("Members")}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
              Search by name, create {isBarbershop ? "clients" : "members"},
              add {isBarbershop ? "visits" : "stamps"}, and redeem earned rewards.
            </p>
          </div>

          <NewCustomerDialog />
        </div>

        <div className="mt-8">
          <CashierMemberList />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm opacity-60">
            {isBarbershop
              ? t("Barbershop loyalty")
              : t("Customer loyalty")}
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {isBarbershop ? t("Clients") : t("Members")}
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
