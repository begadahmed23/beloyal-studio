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
};

function optionalText(
  value: unknown,
  maxLength: number,
  fieldName: string,
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be text.`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > maxLength) {
    throw new Error(
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmedValue;
}

function validateColour(
  value: unknown,
  fallback: string,
): string {
  if (
    typeof value === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value.trim())
  ) {
    return value.trim();
  }

  return fallback;
}

function validateGoogleReviewUrl(
  value: unknown,
): string | null {
  const reviewUrl = optionalText(
    value,
    1000,
    "Google review URL",
  );

  if (!reviewUrl) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(reviewUrl);
  } catch {
    throw new Error(
      "Enter a valid Google review URL.",
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

  if (body.name.trim().length > 80) {
    throw new Error(
      "Café name must be 80 characters or fewer.",
    );
  }

  if (
    typeof body.rewardName !== "string" ||
    !body.rewardName.trim()
  ) {
    throw new Error("Reward name is required.");
  }

  if (body.rewardName.trim().length > 80) {
    throw new Error(
      "Reward name must be 80 characters or fewer.",
    );
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

  return {
    name: body.name.trim(),

    logoUrl: optionalText(
      body.logoUrl,
      500,
      "Logo URL",
    ),

    theme: body.theme as CafeTheme,

    primaryColor: validateColour(
      body.primaryColor,
      "#7b4f35",
    ),

    secondaryColor: validateColour(
      body.secondaryColor,
      "#6f4a35",
    ),

    backgroundColor: validateColour(
      body.backgroundColor,
      "#f3ede5",
    ),

    rewardTarget,

    rewardName: body.rewardName.trim(),

    rewardDescription: optionalText(
      body.rewardDescription,
      300,
      "Reward description",
    ),

    eligiblePurchaseDescription: optionalText(
      body.eligiblePurchaseDescription,
      300,
      "Eligible purchase description",
    ),

    minimumPurchaseAmount,

    googleReviewUrl: validateGoogleReviewUrl(
      body.googleReviewUrl,
    ),
  };
}