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

  whatsappBusinessNumber: string | null;
  whatsappEnabled: boolean;
};

function validateColor(value: unknown, fallback: string) {
  if (
    typeof value === "string" &&
    /^#[0-9A-Fa-f]{6}$/.test(value.trim())
  ) {
    return value.trim();
  }

  return fallback;
}

export function validateCafeSettings(
  body: Record<string, unknown>,
): CafeSettingsInput {
  if (typeof body.name !== "string") {
    throw new Error("Cafe name is required.");
  }

  if (typeof body.rewardName !== "string") {
    throw new Error("Reward name is required.");
  }

  if (typeof body.rewardTarget !== "number") {
    throw new Error("Reward target is required.");
  }

  if (typeof body.theme !== "string") {
    throw new Error("Theme is required.");
  }

  return {
    name: body.name.trim(),

    logoUrl:
      typeof body.logoUrl === "string"
        ? body.logoUrl.trim()
        : null,

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

    rewardTarget: body.rewardTarget,

    rewardName: body.rewardName.trim(),

    rewardDescription:
      typeof body.rewardDescription === "string"
        ? body.rewardDescription.trim()
        : null,

    eligiblePurchaseDescription:
      typeof body.eligiblePurchaseDescription === "string"
        ? body.eligiblePurchaseDescription.trim()
        : null,

    minimumPurchaseAmount:
      typeof body.minimumPurchaseAmount === "number"
        ? body.minimumPurchaseAmount
        : null,

    whatsappBusinessNumber:
      typeof body.whatsappBusinessNumber === "string"
        ? body.whatsappBusinessNumber.trim()
        : null,

    whatsappEnabled: body.whatsappEnabled === true,
  };
}