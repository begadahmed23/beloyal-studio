import { z } from "zod";

export const purchaseAmountSchema = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/).refine(value => Number(value) > 0);
export const earningRateSchema = z.string().regex(/^\d{1,6}(\.\d{1,4})?$/).refine(value => Number(value) > 0);
export const rewardCostSchema = z.string().regex(/^\d{1,12}(\.\d{1,6})?$/).refine(value => Number(value) > 0);

export function normalizePointsInput(value: string) {
  return value.trim()
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace("٫", ".");
}

function scaledInteger(value: string, scale: number) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole + fraction.padEnd(scale, "0"));
}

export function earnedPoints(amount: string, rate: string) {
  const cents = scaledInteger(amount, 2);
  const rateUnits = scaledInteger(rate, 4);
  // 100 EGP is 10,000 cents. Round once to six decimal places, half up.
  const micros = (cents * rateUnits + BigInt(50)) / BigInt(100);
  const result = micros.toString().padStart(7, "0");
  return (result.slice(0, -6) + "." + result.slice(-6)).replace(/\.?0+$/, "");
}

export const restaurantCategories = {
  SUSHI: { en: "Sushi", ar: "سوشي", reward: "Sushi Roll" },
  PIZZA: { en: "Pizza", ar: "بيتزا", reward: "Pizza Reward" },
  FRIED_CHICKEN: { en: "Fried Chicken", ar: "فراخ مقلية", reward: "Chicken Sandwich" },
  BURGER: { en: "Burger", ar: "برجر", reward: "Burger Reward" },
  HEALTHY_FOOD: { en: "Healthy Food", ar: "أكل صحي", reward: "Healthy Bowl" },
  OTHER: { en: "Other", ar: "أخرى", reward: "Restaurant Reward" },
} as const;

export const branchPrices = { MONTHLY: 700, YEARLY: 7000 } as const;
export const branchQuote = (branches: number, period: keyof typeof branchPrices) => branches * branchPrices[period];

export const fireyNashBrand = {
  slug: "firey-nash",
  logo: "/brand/firey-nash/logo.png",
  flame: "/brand/firey-nash/flame.png",
  instagramUrl: "https://www.instagram.com/firey_nash/",
  branches: [
    { id: "fireynashsidigaber", name: "Sidi Gaber" },
    { id: "fireynashelna2al", name: "El Na2al w El Hanadasa — النقل والهندسة" },
  ],
} as const;

export function isFireyNashName(value: string) {
  const name = value.toLowerCase().replace(/[^a-z]/g, "");
  return name === "fireynash" || name === "fierynash" || name === "firynash";
}

export function walletPointsValue(value: { toFixed(): string } | string | undefined, fallback: string) {
  return typeof value === "string" ? value : value?.toFixed() ?? fallback;
}
