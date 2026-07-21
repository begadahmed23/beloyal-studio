import { CafeTheme, Prisma } from "@prisma/client";

export type CafeSettingsInput = {
  name: string;
  logoUrl: string | null;
  theme: CafeTheme;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
  minimumPurchaseAmount: Prisma.Decimal | null;

  whatsappBusinessNumber: string | null;
  whatsappEnabled: boolean;
};

const allowedThemes = new Set<CafeTheme>([
  CafeTheme.COFFEE_CLASSIC,
  CafeTheme.MODERN_MINIMAL,
  CafeTheme.DARK_LUXURY,
  CafeTheme.SOFT_PASTEL,
  CafeTheme.ORGANIC,
]);

function optionalText(
  value: unknown,
  maximumLength: number,
  fieldName: string,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be text.`);
  }

  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return null;
  }

  if (cleanedValue.length > maximumLength) {
    throw new Error(`${fieldName} cannot exceed ${maximumLength} characters.`);
  }

  return cleanedValue;
}

function requiredText(
  value: unknown,
  minimumLength: number,
  maximumLength: number,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required.`);
  }

  const cleanedValue = value.trim();

  if (
    cleanedValue.length < minimumLength ||
    cleanedValue.length > maximumLength
  ) {
    throw new Error(
      `${fieldName} must contain between ${minimumLength} and ${maximumLength} characters.`,
    );
  }

  return cleanedValue;
}

function validateLogoUrl(value: unknown): string | null {
  const logoUrl = optionalText(value, 500, "Logo URL");

  if (!logoUrl) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(logoUrl);
  } catch {
    throw new Error("Please enter a valid logo URL.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Logo URL must begin with http:// or https://.");
  }

  return logoUrl;
}

function validateTheme(value: unknown): CafeTheme {
  if (typeof value !== "string" || !allowedThemes.has(value as CafeTheme)) {
    throw new Error("Please select a valid café theme.");
  }

  return value as CafeTheme;
}

function validateRewardTarget(value: unknown): number {
  const rewardTarget = Number(value);

  if (
    !Number.isInteger(rewardTarget) ||
    rewardTarget < 1 ||
    rewardTarget > 100
  ) {
    throw new Error("Reward target must be a whole number between 1 and 100.");
  }

  return rewardTarget;
}

function validateMinimumPurchaseAmount(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    throw new Error("Minimum purchase amount must be a valid positive number.");
  }

  return new Prisma.Decimal(amount.toFixed(2));
}

function validateWhatsAppNumber(value: unknown): string | null {
  const number = optionalText(value, 25, "WhatsApp business number");

  if (!number) {
    return null;
  }

  const cleanedNumber = number.replace(/[\s\-().]/g, "");

  if (!/^\+?[1-9]\d{7,14}$/.test(cleanedNumber)) {
    throw new Error(
      "Enter a valid international WhatsApp number, such as +201001234567.",
    );
  }

  return cleanedNumber;
}

export function validateCafeSettings(
  body: Record<string, unknown>,
): CafeSettingsInput {
  const name = requiredText(body.name, 2, 80, "Café name");

  const theme = validateTheme(body.theme);

  const rewardTarget = validateRewardTarget(body.rewardTarget);

  const rewardName = requiredText(body.rewardName, 2, 80, "Reward name");

  const logoUrl = validateLogoUrl(body.logoUrl);

  const rewardDescription = optionalText(
    body.rewardDescription,
    300,
    "Reward description",
  );

  const eligiblePurchaseDescription = optionalText(
    body.eligiblePurchaseDescription,
    300,
    "Eligible purchase description",
  );

  const minimumPurchaseAmount = validateMinimumPurchaseAmount(
    body.minimumPurchaseAmount,
  );

  const whatsappBusinessNumber = validateWhatsAppNumber(
    body.whatsappBusinessNumber,
  );

  if (typeof body.whatsappEnabled !== "boolean") {
    throw new Error("Invalid WhatsApp setting.");
  }

  if (body.whatsappEnabled && !whatsappBusinessNumber) {
    throw new Error("Add a WhatsApp business number before enabling WhatsApp.");
  }

  return {
    name,
    logoUrl,
    theme,

    rewardTarget,
    rewardName,
    rewardDescription,
    eligiblePurchaseDescription,
    minimumPurchaseAmount,

    whatsappBusinessNumber,
    whatsappEnabled: body.whatsappEnabled,
  };
}
