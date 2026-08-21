"use client";

import SubscriptionAdvancedSettings from "./subscription/SubscriptionAdvancedSettings";
import SubscriptionOverview from "./subscription/SubscriptionOverview";
import SubscriptionQuickActions from "./subscription/SubscriptionQuickActions";
import type {
  SubscriptionChangeHandler,
  SubscriptionDraft,
} from "./subscription/subscription-types";

export type {
  SubscriptionDraft,
  SubscriptionStatus,
} from "./subscription/subscription-types";

type Props = {
  value: SubscriptionDraft;
  saving: boolean;
  onChange: SubscriptionChangeHandler;
};

export default function SubscriptionControlPanel({
  value,
  saving,
  onChange,
}: Props) {
  return (
    <div className="space-y-5">
      <SubscriptionOverview value={value} />

      <SubscriptionQuickActions
        value={value}
        saving={saving}
        onChange={onChange}
      />

      <div className="grid gap-4 rounded-[20px] border border-black/[0.07] bg-[#F7F7F8] p-4 sm:grid-cols-[1fr_220px] sm:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#45454A]">
            Monthly price
          </label>
          <input
            type="number"
            min={0}
            value={value.monthlyPrice}
            onChange={(event) =>
              onChange({ monthlyPrice: event.target.value })
            }
            className="h-12 w-full rounded-xl border border-black/[0.09] bg-white px-4 text-sm text-[#171719] outline-none transition focus:border-[#8E9197] focus:ring-2 focus:ring-black/[0.04]"
          />
        </div>

        <p className="rounded-xl border border-black/[0.07] bg-white px-4 py-3 text-xs leading-5 text-[#77777E]">
          Amount charged each month in EGP.
        </p>
      </div>

      <SubscriptionAdvancedSettings
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
