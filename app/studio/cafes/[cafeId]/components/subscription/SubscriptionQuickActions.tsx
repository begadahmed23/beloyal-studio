"use client";

import { useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  PauseCircle,
} from "lucide-react";

import {
  addDays,
  addOneMonth,
  fromInputDate,
  toInputDate,
} from "./subscription-date-utils";
import type {
  SubscriptionChangeHandler,
  SubscriptionDraft,
} from "./subscription-types";

type Props = {
  value: SubscriptionDraft;
  saving: boolean;
  onChange: SubscriptionChangeHandler;
};

export default function SubscriptionQuickActions({
  value,
  saving,
  onChange,
}: Props) {
  const [preparedAction, setPreparedAction] = useState("");

  function prepare(
    message: string,
    patch: Partial<SubscriptionDraft>
  ) {
    onChange(patch);
    setPreparedAction(message);
  }

  function startTrial() {
    const today = new Date();

    prepare("14-day trial prepared", {
      subscriptionStatus: "TRIAL",
      isActive: true,
      trialStartedAt: toInputDate(today),
      trialEndsAt: toInputDate(addDays(today, 14)),
    });
  }

  function activateSubscription() {
    const today = new Date();
    const todayValue = toInputDate(today);

    prepare("Monthly subscription prepared", {
      subscriptionStatus: "ACTIVE",
      isActive: true,
      subscriptionStartedAt:
        value.subscriptionStartedAt || todayValue,
      subscriptionEndsAt: toInputDate(addOneMonth(today)),
      lastPaymentAt: todayValue,
    });
  }

  function recordPayment() {
    const today = new Date();
    const currentEnd = fromInputDate(value.subscriptionEndsAt);
    const renewalBase =
      currentEnd && currentEnd > today ? currentEnd : today;
    const todayValue = toInputDate(today);

    prepare("Payment recorded and one month added", {
      subscriptionStatus: "ACTIVE",
      isActive: true,
      subscriptionStartedAt:
        value.subscriptionStartedAt || todayValue,
      subscriptionEndsAt: toInputDate(
        addOneMonth(renewalBase)
      ),
      lastPaymentAt: todayValue,
    });
  }

  function suspendAccess() {
    prepare("Suspension prepared", {
      subscriptionStatus: "SUSPENDED",
      isActive: false,
    });
  }

  return (
    <div>
      <p className="text-sm font-semibold text-[#343438]">
        Quick actions
      </p>
      <p className="mt-1 text-xs leading-5 text-[#85858C]">
        Choose what happened. BeLoyal will prepare the dates
        automatically.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActionButton
          icon={CalendarPlus}
          label="Start 14-day trial"
          description="Starts today"
          onClick={startTrial}
        />
        <ActionButton
          icon={CheckCircle2}
          label="Activate monthly plan"
          description="Paid from today"
          onClick={activateSubscription}
        />
        <ActionButton
          icon={CreditCard}
          label="Record payment"
          description="Adds one month"
          onClick={recordPayment}
        />
        <ActionButton
          icon={PauseCircle}
          label="Suspend access"
          description="Stops business login"
          onClick={suspendAccess}
          danger
        />
      </div>

      {preparedAction && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            <p>{preparedAction}. Save it to apply the change.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            onClick={() => setPreparedAction("")}
            className="h-10 shrink-0 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save now"}
          </button>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  danger = false,
}: {
  icon: typeof CreditCard;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[18px] border p-4 text-left transition active:scale-[0.99] ${
        danger
          ? "border-red-200 bg-red-50 hover:bg-red-100"
          : "border-black/[0.08] bg-white hover:border-black/[0.14] hover:bg-[#F8F8F9]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          danger
            ? "bg-red-100 text-red-700"
            : "bg-[#EFEFF1] text-[#55585E]"
        }`}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span
          className={`block text-sm font-semibold ${
            danger ? "text-red-700" : "text-[#343438]"
          }`}
        >
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-[#85858C]">
          {description}
        </span>
      </span>
    </button>
  );
}
