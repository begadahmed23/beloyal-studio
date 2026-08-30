import { CafeTheme } from "@prisma/client";

export type CafeSettingsInput = {
  name: string;
  logoUrl: string | null;
  theme: CafeTheme;

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;

  minimumPurchaseAmount: number | null;

  googleReviewUrl: string | null;

  timezone: string;
  birthdayRewardsEnabled: boolean;
  birthdayRewardName: string | null;
  birthdayRewardDescription: string | null;
  birthdayPurchaseRequirement: string | null;
  birthdayValidityDays: number;
  birthdayReminderEnabled: boolean;
  birthdayReminderDaysBefore: number;
  birthdayDayMessageEnabled: boolean;
  birthdayFriendDiscountEnabled: boolean;
  birthdayOneFriendDiscount: number;
  birthdayGroupDiscount: number;
};

function validateColor(
  value: unknown,
  fallback: string,
) {
  if (
    typeof value === "string" &&
    /^#[0-9A-Fa-f]{6}$/.test(value.trim())
  ) {
    return value.trim();
  }

  return fallback;
}

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

function booleanValue(
  value: unknown,
  fallback: boolean,
) {
  return typeof value === "boolean" ? value : fallback;
}

function wholeNumber(
  value: unknown,
  options: {
    fallback: number;
    min: number;
    max: number;
    label: string;
  },
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return options.fallback;
  }

  const parsedValue =
    typeof value === "number" ? value : Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < options.min ||
    parsedValue > options.max
  ) {
    throw new Error(
      `${options.label} must be a whole number between ${options.min} and ${options.max}.`,
    );
  }

  return parsedValue;
}

function validateTimezone(value: unknown) {
  const timezone =
    typeof value === "string" && value.trim()
      ? value.trim()
      : "Africa/Cairo";

  if (timezone.length > 100) {
    throw new Error("Timezone is too long.");
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    }).format(new Date());
  } catch {
    throw new Error("Please select a valid timezone.");
  }

  return timezone;
}

function validateGoogleReviewUrl(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error(
      "Please enter a valid Google review URL.",
    );
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:"
  ) {
    throw new Error(
      "Google review URL must start with http:// or https://.",
    );
  }

  return parsedUrl.toString();
}

export function validateCafeSettings(
  body: Record<string, unknown>,
): CafeSettingsInput {
  if (
    typeof body.name !== "string" ||
    body.name.trim().length < 2
  ) {
    throw new Error(
      "Café name must contain at least 2 characters.",
    );
  }

  if (
    typeof body.rewardName !== "string" ||
    body.rewardName.trim().length < 1
  ) {
    throw new Error("Reward name is required.");
  }

  const rewardTarget =
    typeof body.rewardTarget === "number"
      ? body.rewardTarget
      : Number(body.rewardTarget);

  if (
    !Number.isInteger(rewardTarget) ||
    rewardTarget < 1 ||
    rewardTarget > 100
  ) {
    throw new Error(
      "Reward target must be a whole number between 1 and 100.",
    );
  }

  if (typeof body.theme !== "string") {
    throw new Error("Theme is required.");
  }

  const validThemes = Object.values(CafeTheme);

  if (!validThemes.includes(body.theme as CafeTheme)) {
    throw new Error("Invalid café theme.");
  }

  let minimumPurchaseAmount: number | null = null;

  if (
    body.minimumPurchaseAmount !== null &&
    body.minimumPurchaseAmount !== undefined &&
    body.minimumPurchaseAmount !== ""
  ) {
    const parsedAmount =
      typeof body.minimumPurchaseAmount === "number"
        ? body.minimumPurchaseAmount
        : Number(body.minimumPurchaseAmount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0
    ) {
      throw new Error(
        "Minimum purchase amount must be zero or more.",
      );
    }

    minimumPurchaseAmount = parsedAmount;
  }

  const birthdayRewardsEnabled = booleanValue(
    body.birthdayRewardsEnabled,
    false,
  );

  const birthdayRewardName = optionalText(
    body.birthdayRewardName,
  );

  if (birthdayRewardsEnabled && !birthdayRewardName) {
    throw new Error(
      "Birthday reward name is required when Birthday Rewards are enabled.",
    );
  }

  const birthdayValidityDays = wholeNumber(
    body.birthdayValidityDays,
    {
      fallback: 2,
      min: 1,
      max: 7,
      label: "Birthday offer validity",
    },
  );

  const birthdayReminderDaysBefore = wholeNumber(
    body.birthdayReminderDaysBefore,
    {
      fallback: 2,
      min: 0,
      max: 30,
      label: "Birthday reminder timing",
    },
  );

  const birthdayOneFriendDiscount = wholeNumber(
    body.birthdayOneFriendDiscount,
    {
      fallback: 10,
      min: 0,
      max: 100,
      label: "One-friend discount",
    },
  );

  const birthdayGroupDiscount = wholeNumber(
    body.birthdayGroupDiscount,
    {
      fallback: 20,
      min: 0,
      max: 100,
      label: "Group discount",
    },
  );

  if (
    booleanValue(body.birthdayFriendDiscountEnabled, false) &&
    birthdayGroupDiscount < birthdayOneFriendDiscount
  ) {
    throw new Error(
      "Group birthday discount cannot be lower than the one-friend discount.",
    );
  }

  return {
    name: body.name.trim(),

    logoUrl: optionalText(body.logoUrl),

    theme: body.theme as CafeTheme,

    primaryColor: validateColor(
      body.primaryColor,
      "#8e6045",
    ),

    secondaryColor: validateColor(
      body.secondaryColor,
      "#d6b08c",
    ),

    backgroundColor: validateColor(
      body.backgroundColor,
      "#0c0c0c",
    ),

    rewardTarget,

    rewardName: body.rewardName.trim(),

    rewardDescription: optionalText(
      body.rewardDescription,
    ),

    eligiblePurchaseDescription: optionalText(
      body.eligiblePurchaseDescription,
    ),

    minimumPurchaseAmount,

    googleReviewUrl: validateGoogleReviewUrl(
      body.googleReviewUrl,
    ),

    timezone: validateTimezone(body.timezone),

    birthdayRewardsEnabled,

    birthdayRewardName,

    birthdayRewardDescription: optionalText(
      body.birthdayRewardDescription,
    ),

    birthdayPurchaseRequirement: optionalText(
      body.birthdayPurchaseRequirement,
    ),

    birthdayValidityDays,

    birthdayReminderEnabled: booleanValue(
      body.birthdayReminderEnabled,
      true,
    ),

    birthdayReminderDaysBefore,

    birthdayDayMessageEnabled: booleanValue(
      body.birthdayDayMessageEnabled,
      true,
    ),

    birthdayFriendDiscountEnabled: booleanValue(
      body.birthdayFriendDiscountEnabled,
      false,
    ),

    birthdayOneFriendDiscount,

    birthdayGroupDiscount,
  };
}
