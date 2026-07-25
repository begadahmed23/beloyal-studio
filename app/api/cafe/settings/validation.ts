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
  };
}