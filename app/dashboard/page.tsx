import { UserRound } from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import SimpleAnalytics from "@/components/dashboard/SimpleAnalytics";
import MemberList from "@/components/customers/MemberList";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/5 pb-7">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#e2bea0]">
              Loretto
            </h1>

            <p className="mt-1 text-sm text-[#8d827a]">
              Loyalty management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LogoutButton />

            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#d7c4b4]">
              <UserRound size={19} />
            </div>
          </div>
        </header>

        <SimpleAnalytics />

        <section className="py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#a67a5d]">
                Member management
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Members
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#8d827a]">
                Find members, manage loyalty cards, and add
                stamps after every eligible drink purchase.
              </p>
            </div>

            <NewCustomerDialog />
          </div>

          <MemberList />
        </section>
      </div>
    </main>
  );
}