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
      recordPayment: false,
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
      subscriptionEndsAt: toInputDate(
        addOneMonth(today)
      ),
      lastPaymentAt: todayValue,
      recordPayment: false,
    });
  }

  function recordPayment() {
    const today = new Date();

    const currentEnd = fromInputDate(
      value.subscriptionEndsAt
    );

    const renewalBase =
      currentEnd && currentEnd > today
        ? currentEnd
        : today;

    const todayValue = toInputDate(today);

    prepare("Payment ready to record", {
      subscriptionStatus: "ACTIVE",
      isActive: true,

      subscriptionStartedAt:
        value.subscriptionStartedAt || todayValue,

      subscriptionEndsAt: toInputDate(
        addOneMonth(renewalBase)
      ),

      lastPaymentAt: todayValue,

      paymentAmount:
        value.paymentAmount ||
        value.monthlyPrice ||
        "",

      recordPayment: true,
    });
  }

  function suspendAccess() {
    prepare("Suspension prepared", {
      subscriptionStatus: "SUSPENDED",
      isActive: false,
      recordPayment: false,
    });
  }

  const preparingPayment =
    value.recordPayment &&
    preparedAction === "Payment ready to record";

  return (
    <div>
      <p className="text-sm font-semibold text-[#343438]">
        Quick actions
      </p>

      <p className="mt-1 text-xs leading-5 text-[#85858C]">
        Choose what happened. BeLoyal will prepare the
        dates automatically.
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
          description="Records amount + adds one month"
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

      {preparingPayment && (
        <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CreditCard size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                Record received payment
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700/75">
                Enter the actual amount you received.
                Saving will also extend the subscription
                by one month.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold text-emerald-800">
                  Amount received (EGP)
                </label>

                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={value.paymentAmount}
                    onChange={(event) =>
                      onChange({
                        paymentAmount:
                          event.target.value,
                      })
                    }
                    placeholder="e.g. 1500"
                    className="h-11 w-full rounded-xl border border-emerald-200 bg-white px-4 pr-14 text-sm text-[#171719] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#85858C]">
                    EGP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {preparedAction && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />

            <p>
              {preparedAction}. Save it to apply the
              change.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            onClick={() =>
              setPreparedAction("")
            }
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
            danger
              ? "text-red-700"
              : "text-[#343438]"
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