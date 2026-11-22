"use client";

import { Cake, CheckCircle2, ChevronDown, Gift } from "lucide-react";
import { useMemo, useState } from "react";

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
  primaryColor,
  textPrimary,
  textSecondary,
  textMuted,
}: Props) {
  const { t, arabic } = useBeLoyalLanguage();
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

  const countdown = `Birthday in ${daysUntilBirthday} ${daysUntilBirthday === 1 ? "day" : "days"}`;
  const label = arabic && title === countdown ? `عيد ميلادك بعد ${daysUntilBirthday} يوم` : t(title);
  const BirthdayIcon = redeemed && state?.isActive ? CheckCircle2 : Cake;

  return (
    <div className="border-t" style={{ borderColor: cardBorder }}>
      <button type="button" aria-expanded={open} aria-controls="birthday-card-details"
        onClick={() => setOpen(value => !value)}
        className="flex min-h-11 w-full items-center gap-2 rounded-md py-2 text-start transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2">
        <BirthdayIcon size={15} strokeWidth={1.7} aria-hidden="true" className="shrink-0"
          style={{ color: highlighted ? primaryColor : textMuted }} />
        <span className="min-w-0 flex-1 break-words text-[0.75rem] font-medium leading-4">{label}</span>
        <bdi className="max-w-[40%] break-words text-end text-[0.7rem] leading-4" style={{ color: textMuted }}>{t(subtitle)}</bdi>
        <ChevronDown size={14} aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: textMuted }} />
      </button>
      {open && (
        <div id="birthday-card-details" className="space-y-3 border-t px-1 pb-4 pt-3 text-sm" style={{ borderColor: cardBorder, color: textSecondary }}>
          <div className="flex items-center gap-2">
            <Gift size={16} style={{ color: primaryColor }} />
            <strong style={{ color: textPrimary }}>{t(enabled ? "Birthday reward" : "Birthday information")}</strong>
          </div>
          <p>{t(birthdayText)}</p>
          {enabled && (
            <>
              <p className="font-semibold" style={{ color: textPrimary }}>{t(rewardName)}{redeemed ? ` · ${t("Redeemed")}` : ""}</p>
              {customer.cafe.birthdayRewardDescription && <p>{t(customer.cafe.birthdayRewardDescription)}</p>}
              {customer.cafe.birthdayPurchaseRequirement && <p><strong>{t("Purchase requirement")}:</strong> {t(customer.cafe.birthdayPurchaseRequirement)}</p>}
              {customer.cafe.birthdayFriendDiscountEnabled && (
                <p>{t("Bring a friend")}: 1 guest {customer.cafe.birthdayOneFriendDiscount}% off; 2+ guests {customer.cafe.birthdayGroupDiscount}% off.</p>
              )}
              <p>{t(validityText(state?.validityDays ?? customer.cafe.birthdayValidityDays ?? 2))}</p>
              <p className="text-xs" style={{ color: textMuted }}>{t("Present your loyalty card to redeem your birthday gift once per year.")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
