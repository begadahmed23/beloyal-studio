"use client";

import { Cake, CheckCircle2, ChevronRight, Gift, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
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
  const { t, dir, arabic } = useBeLoyalLanguage();
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

  const interactive = true;

  const modal = open ? (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={t("Birthday offer")}
      dir={dir}
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
          {enabled ? "Birthday offer" : "Birthday information"}
        </p>

        <h3 className="mt-2 pr-10 text-2xl font-semibold tracking-tight">
          {!enabled ? birthdayText : redeemed && state?.isActive
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

        {enabled && <div className="mt-5 space-y-3">
          {customer.cafe.birthdayPurchaseRequirement ? (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: cardBorder,
                backgroundColor: surfaceColor,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ color: textMuted }}
              >
                Purchase requirement
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
              <p
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ color: textMuted }}
              >
                Celebrating together
              </p>
              <p className="mt-2 text-sm" style={{ color: textSecondary }}>
                Birthday customer + 1 guest — {customer.cafe.birthdayOneFriendDiscount}% off the total bill.
              </p>
              <p className="mt-1 text-sm" style={{ color: textSecondary }}>
                Birthday customer + 2 or more guests — {customer.cafe.birthdayGroupDiscount}% off the total bill.
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
            <p
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: textMuted }}
            >
              Availability
            </p>
            <p className="mt-1 text-sm" style={{ color: textSecondary }}>
              {validityText(
                state?.validityDays ?? customer.cafe.birthdayValidityDays ?? 2,
              )}
            </p>
            <p className="mt-2 text-xs" style={{ color: textMuted }}>
              Present your BeLoyal card when ordering. Birthday gift available once per year.
            </p>
          </div>
        </div>}

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
  ) : null;

  const countdown = `Birthday in ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`;
  const label = arabic && title === countdown ? `عيد ميلادك بعد ${daysUntilBirthday} يوم` : t(title);
  const BirthdayIcon = redeemed && state?.isActive ? CheckCircle2 : Cake;
  const row = (
    <>
      <BirthdayIcon size={15} strokeWidth={1.7} aria-hidden="true" className="shrink-0"
        style={{ color: highlighted ? primaryColor : textMuted }} />
      <span className="min-w-0 flex-1 break-words text-[0.75rem] font-medium leading-4">{label}</span>
      <bdi className="max-w-[46%] break-words text-end text-[0.7rem] leading-4" style={{ color: textMuted }}>{t(subtitle)}</bdi>
      {interactive && <ChevronRight size={13} aria-hidden="true" className="shrink-0 rtl:rotate-180" style={{ color: textMuted }} />}
    </>
  );

  return (
    <div className="border-t" style={{ borderColor: cardBorder }}>
      {interactive ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-11 w-full items-center gap-2 rounded-md py-2 text-start transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {row}
        </button>
      ) : (
        <div className="flex min-h-9 items-center gap-2 py-2 text-start">{row}</div>
      )}
      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </div>
  );
}
