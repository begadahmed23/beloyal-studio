import { ChevronDown } from "lucide-react";

import type {
  SubscriptionChangeHandler,
  SubscriptionDraft,
  SubscriptionStatus,
} from "./subscription-types";

type Props = {
  value: SubscriptionDraft;
  onChange: SubscriptionChangeHandler;
};

const statuses: {
  value: SubscriptionStatus;
  label: string;
}[] = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAST_DUE", label: "Past due" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function SubscriptionAdvancedSettings({
  value,
  onChange,
}: Props) {
  return (
    <details className="group rounded-[20px] border border-black/[0.07] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-[#45454A] sm:px-5">
        Advanced subscription settings
        <ChevronDown
          size={17}
          className="text-[#8A8A91] transition group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-black/[0.07] p-4 sm:p-5">
        <p className="mb-4 text-xs leading-5 text-[#85858C]">
          Only use these fields when you need to correct a date
          manually.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            value={value.subscriptionStatus}
            onChange={(subscriptionStatus) =>
              onChange({ subscriptionStatus })
            }
          />
          <DateField
            label="Trial started"
            value={value.trialStartedAt}
            onChange={(trialStartedAt) =>
              onChange({ trialStartedAt })
            }
          />
          <DateField
            label="Trial ends"
            value={value.trialEndsAt}
            onChange={(trialEndsAt) =>
              onChange({ trialEndsAt })
            }
          />
          <DateField
            label="Last payment"
            value={value.lastPaymentAt}
            onChange={(lastPaymentAt) =>
              onChange({ lastPaymentAt })
            }
          />
          <DateField
            label="Subscription started"
            value={value.subscriptionStartedAt}
            onChange={(subscriptionStartedAt) =>
              onChange({ subscriptionStartedAt })
            }
          />
          <DateField
            label="Subscription ends"
            value={value.subscriptionEndsAt}
            onChange={(subscriptionEndsAt) =>
              onChange({ subscriptionEndsAt })
            }
          />
        </div>

        <label className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-black/[0.07] bg-[#F8F8F9] px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-[#45454A]">
              Business access enabled
            </span>
            <span className="mt-0.5 block text-xs text-[#85858C]">
              Disabled businesses cannot use their dashboard.
            </span>
          </span>
          <input
            type="checkbox"
            checked={value.isActive}
            onChange={(event) =>
              onChange({ isActive: event.target.checked })
            }
            className="h-5 w-5 accent-[#1D1D1F]"
          />
        </label>
      </div>
    </details>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#45454A]">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 text-sm text-[#171719] outline-none transition focus:border-[#8E9197] focus:ring-2 focus:ring-black/[0.04]"
      />
    </div>
  );
}

function SelectField({
  value,
  onChange,
}: {
  value: SubscriptionStatus;
  onChange: (value: SubscriptionStatus) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#45454A]">
        Subscription status
      </label>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as SubscriptionStatus)
        }
        className="h-12 w-full rounded-xl border border-black/[0.09] bg-[#FAFAFB] px-4 text-sm text-[#171719] outline-none transition focus:border-[#8E9197] focus:ring-2 focus:ring-black/[0.04]"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
}
