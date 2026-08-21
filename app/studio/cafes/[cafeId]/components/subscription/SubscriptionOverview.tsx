import { formatSubscriptionDate } from "./subscription-date-utils";
import type {
  SubscriptionDraft,
  SubscriptionStatus,
} from "./subscription-types";

type Props = {
  value: SubscriptionDraft;
};

function statusClass(status: SubscriptionStatus) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "TRIAL") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "PAST_DUE") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "SUSPENDED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}

export default function SubscriptionOverview({ value }: Props) {
  const periodEnd =
    value.subscriptionStatus === "TRIAL"
      ? value.trialEndsAt
      : value.subscriptionEndsAt;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <OverviewItem
        label="Current status"
        value={value.subscriptionStatus.replace("_", " ")}
        valueClass={statusClass(value.subscriptionStatus)}
      />
      <OverviewItem
        label={
          value.subscriptionStatus === "TRIAL"
            ? "Trial ends"
            : "Next renewal"
        }
        value={formatSubscriptionDate(periodEnd)}
      />
      <OverviewItem
        label="Last payment"
        value={formatSubscriptionDate(value.lastPaymentAt)}
      />
      <OverviewItem
        label="Business access"
        value={value.isActive ? "Enabled" : "Disabled"}
        valueClass={
          value.isActive
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }
      />
    </div>
  );
}

function OverviewItem({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.07] bg-[#F7F7F8] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#929298]">
        {label}
      </p>
      <span
        className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
          valueClass ||
          "border-black/[0.07] bg-white text-[#45454A]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
