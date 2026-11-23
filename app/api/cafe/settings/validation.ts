import { isDashboardTheme, type DashboardThemeName } from "@/lib/cafe-theme";
import type { DashboardSettingsSection } from "@/lib/business/settings-sections";

export type CafeSettingsInput = {
  name: string;
  logoUrl: string | null;
  theme: DashboardThemeName;

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;

  minimumPurchaseAmount: number | null;

  feedbackEnabled: boolean;
  feedbackRewardEnabled: boolean;
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

type SettingsBody = Record<string, unknown>;

function validateGeneral(body: SettingsBody) {
  if (
    typeof body.name !== "string" ||
    body.name.trim().length < 2
  ) {
    throw new Error(
      "Business name must contain at least 2 characters.",
    );
  }

  return { name: (body.name as string).trim(), logoUrl: optionalText(body.logoUrl) };
}

function validateBranding(body: SettingsBody) {
  if (typeof body.theme !== "string") {
    throw new Error("Theme is required.");
  }

  if (!isDashboardTheme(body.theme)) {
    throw new Error("Invalid business theme.");
  }

  return {
    theme: body.theme,
    ...("primaryColor" in body ? { primaryColor: validateColor(body.primaryColor, "#8e6045") } : {}),
    ...("secondaryColor" in body ? { secondaryColor: validateColor(body.secondaryColor, "#d6b08c") } : {}),
    ...("backgroundColor" in body ? { backgroundColor: validateColor(body.backgroundColor, "#0c0c0c") } : {}),
  };
}

function validateLoyalty(body: SettingsBody) {
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
    rewardTarget < 2 ||
    rewardTarget > 100
  ) {
    throw new Error(
      "Reward target must be a whole number between 2 and 100.",
    );
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

  return {
    rewardTarget,
    rewardName: (body.rewardName as string).trim(),
    rewardDescription: optionalText(body.rewardDescription),
    eligiblePurchaseDescription: optionalText(body.eligiblePurchaseDescription),
    minimumPurchaseAmount,
  };
}

function validateFeedback(body: SettingsBody) {
  return {
    feedbackEnabled: booleanValue(body.feedbackEnabled, true),
    feedbackRewardEnabled: booleanValue(body.feedbackRewardEnabled, true),
  };
}

const validateSection = {
  general: validateGeneral,
  branding: validateBranding,
  loyalty: validateLoyalty,
  feedback: validateFeedback,
  reviews: (body: SettingsBody) => ({ googleReviewUrl: validateGoogleReviewUrl(body.googleReviewUrl) }),
} satisfies Record<DashboardSettingsSection, (body: SettingsBody) => Partial<CafeSettingsInput>>;

export function validateCafeSettingsPatch(body: SettingsBody): Partial<CafeSettingsInput> {
  if (body.section === undefined) {
    // Allow the form from an older BeLoyal tab to keep submitting the whole form.
    const settings = validateCafeSettings(body);
    return {
      name: settings.name,
      logoUrl: settings.logoUrl,
      theme: settings.theme,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,
      rewardTarget: settings.rewardTarget,
      rewardName: settings.rewardName,
      rewardDescription: settings.rewardDescription,
      eligiblePurchaseDescription: settings.eligiblePurchaseDescription,
      minimumPurchaseAmount: settings.minimumPurchaseAmount,
      feedbackEnabled: settings.feedbackEnabled,
      feedbackRewardEnabled: settings.feedbackRewardEnabled,
      googleReviewUrl: settings.googleReviewUrl,
    };
  }

  if (typeof body.section !== "string" || !Object.hasOwn(validateSection, body.section)) {
    throw new Error("Invalid settings section.");
  }

  return validateSection[body.section as DashboardSettingsSection](body);
}

function validateCafeSettings(body: SettingsBody): CafeSettingsInput {
  const general = validateGeneral(body);
  const branding = validateBranding(body);
  const loyalty = validateLoyalty(body);
  const feedback = validateFeedback(body);
  const reviews = validateSection.reviews(body);

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
    primaryColor: "#8e6045",
    secondaryColor: "#d6b08c",
    backgroundColor: "#0c0c0c",
    ...general,
    ...branding,
    ...loyalty,
    ...feedback,
    ...reviews,

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
