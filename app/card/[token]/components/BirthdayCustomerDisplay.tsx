"use client";

import { Cake, CheckCircle2, ChevronRight, Gift, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { Customer } from "./LoyaltyCard";

type Props = {
  customer: Customer;
  birthdayText: string;
  daysUntilBirthday: number;
  cardBorder: string;
  surfaceColor: string;
  surfaceRaised: string;
  primaryColor: string;
  primarySoft: string;
  primaryBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function calendarDateInTimezone(timezone: string, date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function birthdayForYear(birthday: string, year: number): CalendarDate | null {
  const date = new Date(birthday);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = date.getUTCMonth() + 1;
  const storedDay = date.getUTCDate();
  const day = month === 2 && storedDay === 29 && !isLeapYear(year) ? 28 : storedDay;

  return { year, month, day };
}

function calendarNumber(date: CalendarDate) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function getBirthdayState(customer: Customer) {
  const timezone = customer.cafe.timezone?.trim() || "Africa/Cairo";
  const today = calendarDateInTimezone(timezone);
  const birthdayThisYear = birthdayForYear(customer.birthday, today.year);

  if (!birthdayThisYear) {
    return null;
  }

  const dayDifference = Math.round(
    (calendarNumber(today) - calendarNumber(birthdayThisYear)) / 86_400_000,
  );

  const validityDays = Math.max(
    1,
    Math.min(7, customer.cafe.birthdayValidityDays ?? 2),
  );

  const reminderDaysBefore = Math.max(
    0,
    Math.min(30, customer.cafe.birthdayReminderDaysBefore ?? 2),
  );

  const isActive = dayDifference >= 0 && dayDifference < validityDays;
  const isBirthday = dayDifference === 0;
  const activeDay = isActive ? dayDifference + 1 : null;
  const isLastDay = isActive && dayDifference === validityDays - 1;
  const daysBefore = dayDifference < 0 ? Math.abs(dayDifference) : 0;

  return {
    today,
    isActive,
    isBirthday,
    isLastDay,
    activeDay,
    daysBefore,
    reminderDaysBefore,
    validityDays,
  };
}

function validityText(days: number) {
  if (days <= 1) {
    return "Valid on your birthday only.";
  }

  if (days === 2) {
    return "Valid on your birthday and the following day.";
  }

  return `Valid from your birthday for ${days} days.`;
}

export default function BirthdayCustomerDisplay({
  customer,
  birthdayText,
  daysUntilBirthday,
  cardBorder,
  surfaceColor,
  surfaceRaised,
  primaryColor,
  primarySoft,
  primaryBorder,
  textPrimary,
  textSecondary,
  textMuted,
}: Props) {
  const [open, setOpen] = useState(false);
  const state = useMemo(() => getBirthdayState(customer), [customer]);

  const enabled = customer.cafe.birthdayRewardsEnabled;
  const redeemed = Boolean(customer.birthdayRewardRedeemedAt);
  const rewardName =
    customer.cafe.birthdayRewardName?.trim() || "Birthday reward";

  let title = "Birthday";
  let subtitle = birthdayText;
  let highlighted = false;

  if (enabled && state) {
    if (state.isActive && redeemed) {
      title = "Birthday gift redeemed";
      subtitle = rewardName;
      highlighted = true;
    } else if (state.isBirthday) {
      title = "Happy Birthday!";
      subtitle = `Your ${rewardName.toLowerCase()} is ready`;
      highlighted = true;
    } else if (state.isLastDay && state.isActive) {
      title = "Birthday treat";
      subtitle = "Last day today";
      highlighted = true;
    } else if (state.isActive) {
      title = "Birthday treat";
      subtitle = `${rewardName} is ready`;
      highlighted = true;
    } else if (state.daysBefore === 1) {
      title = "Birthday treat tomorrow";
      subtitle = rewardName;
      highlighted = true;
    } else if (
      state.daysBefore > 1 &&
      state.daysBefore <= state.reminderDaysBefore
    ) {
      title = "Birthday treat soon";
      subtitle = `Available in ${state.daysBefore} days`;
      highlighted = true;
    } else {
      title = `Birthday in ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`;
      subtitle = birthdayText;
    }
  } else if (daysUntilBirthday === 0) {
    title = "Happy Birthday!";
    subtitle = birthdayText;
  } else {
    title = `Birthday in ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`;
    subtitle = birthdayText;
  }

  const interactive = enabled;

  return (
    <>
      <button
        type="button"
        onClick={() => interactive && setOpen(true)}
        disabled={!interactive}
        className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:opacity-90 disabled:cursor-default"
        style={{
          borderColor: highlighted ? primaryBorder : cardBorder,
          backgroundColor: highlighted ? primarySoft : surfaceColor,
          color: textPrimary,
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: highlighted ? surfaceRaised : primarySoft,
            color: primaryColor,
          }}
        >
          {redeemed && state?.isActive ? (
            <CheckCircle2 size={19} />
          ) : (
            <Cake size={19} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold"
            style={{ color: textPrimary }}
          >
            {title}
          </p>
          <p
            className="mt-1 truncate text-xs"
            style={{ color: textMuted }}
          >
            {subtitle}
          </p>
        </div>

        {interactive ? (
          <ChevronRight
            size={17}
            className="shrink-0"
            style={{ color: primaryColor }}
          />
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Birthday offer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-[28px] border p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
            style={{
              borderColor: primaryBorder,
              backgroundColor: surfaceRaised,
              color: textPrimary,
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close birthday offer"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-75"
              style={{
                borderColor: cardBorder,
                backgroundColor: surfaceColor,
                color: textSecondary,
              }}
            >
              <X size={17} />
            </button>

            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: primarySoft,
                color: primaryColor,
              }}
            >
              {redeemed ? <CheckCircle2 size={23} /> : <Gift size={23} />}
            </div>

            <p
              className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: primaryColor }}
            >
              Birthday offer
            </p>

            <h3 className="mt-2 pr-10 text-2xl font-semibold tracking-tight">
              {redeemed && state?.isActive
                ? "Birthday gift redeemed"
                : rewardName}
            </h3>

            {customer.cafe.birthdayRewardDescription ? (
              <p
                className="mt-3 text-sm leading-6"
                style={{ color: textSecondary }}
              >
                {customer.cafe.birthdayRewardDescription}
              </p>
            ) : null}

            <div className="mt-5 space-y-3">
              {customer.cafe.birthdayPurchaseRequirement ? (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: surfaceColor,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: textMuted }}>
                    Purchase
                  </p>
                  <p className="mt-1 text-sm" style={{ color: textSecondary }}>
                    {customer.cafe.birthdayPurchaseRequirement}
                  </p>
                </div>
              ) : null}

              {customer.cafe.birthdayFriendDiscountEnabled ? (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: surfaceColor,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: textMuted }}>
                    Celebrating together
                  </p>
                  <p className="mt-2 text-sm" style={{ color: textSecondary }}>
                    With 1 friend — {customer.cafe.birthdayOneFriendDiscount}% off your total bill.
                  </p>
                  <p className="mt-1 text-sm" style={{ color: textSecondary }}>
                    With 2 or more — {customer.cafe.birthdayGroupDiscount}% off your total bill.
                  </p>
                </div>
              ) : null}

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: cardBorder,
                  backgroundColor: surfaceColor,
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: textMuted }}>
                  Availability
                </p>
                <p className="mt-1 text-sm" style={{ color: textSecondary }}>
                  {validityText(state?.validityDays ?? customer.cafe.birthdayValidityDays ?? 2)}
                </p>
                <p className="mt-2 text-xs" style={{ color: textMuted }}>
                  Present your B-LO card when ordering. Birthday gift available once per year.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: primaryColor,
                color: "#ffffff",
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
