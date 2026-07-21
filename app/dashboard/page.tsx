import Link from "next/link";
import {
  ArrowRight,
  Monitor,
  Smartphone,
  Users,
} from "lucide-react";

import JoinQRCode from "@/components/dashboard/JoinQRCode";
import SimpleAnalytics from "@/components/dashboard/SimpleAnalytics";

export default function DashboardPage() {
  return (
    <div>
      <div>
        <p className="text-sm opacity-60">
          Business overview
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Dashboard
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
          Scan customers, manage members, and review your
          café activity.
        </p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <Link
          href="/dashboard/scanner"
          className="group flex min-h-32 items-center justify-between rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-current/[0.04]">
              <Monitor size={22} />
            </div>

            <div>
              <p className="font-semibold">
                USB scanner
              </p>

              <p className="mt-1 text-xs leading-5 opacity-55">
                Scan from the cashier computer
              </p>
            </div>
          </div>

          <ArrowRight
            size={18}
            className="transition group-hover:translate-x-1"
          />
        </Link>

        <Link
          href="/dashboard/scanner/phone"
          className="group flex min-h-32 items-center justify-between rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-current/[0.04]">
              <Smartphone size={22} />
            </div>

            <div>
              <p className="font-semibold">
                Phone scanner
              </p>

              <p className="mt-1 text-xs leading-5 opacity-55">
                Scan using a phone camera
              </p>
            </div>
          </div>

          <ArrowRight
            size={18}
            className="transition group-hover:translate-x-1"
          />
        </Link>

        <Link
          href="/dashboard/members"
          className="group flex min-h-32 items-center justify-between rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-current/[0.04]">
              <Users size={22} />
            </div>

            <div>
              <p className="font-semibold">
                Manage members
              </p>

              <p className="mt-1 text-xs leading-5 opacity-55">
                Search and review customer cards
              </p>
            </div>
          </div>

          <ArrowRight
            size={18}
            className="transition group-hover:translate-x-1"
          />
        </Link>
      </div>

      <div className="mt-8">
        <JoinQRCode />
      </div>

      <div className="mt-8">
        <SimpleAnalytics />
      </div>
    </div>
  );
}