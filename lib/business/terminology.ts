import type { BusinessType } from "@prisma/client";

export type BusinessTerminology = {
  businessSingular: string;
  businessPlural: string;
  staffSingular: string;
  staffPlural: string;
  loyaltyUnitSingular: string;
  loyaltyUnitPlural: string;
  qualifyingAction: string;
  defaultRewardName: string;
};

const terminologyByBusinessType = {
  CAFE: {
    businessSingular: "café",
    businessPlural: "cafés",
    staffSingular: "cashier",
    staffPlural: "cashiers",
    loyaltyUnitSingular: "stamp",
    loyaltyUnitPlural: "stamps",
    qualifyingAction: "eligible purchase",
    defaultRewardName: "Free Drink",
  },
  BARBERSHOP: {
    businessSingular: "barbershop",
    businessPlural: "barbershops",
    staffSingular: "barber",
    staffPlural: "barbers",
    loyaltyUnitSingular: "visit",
    loyaltyUnitPlural: "visits",
    qualifyingAction: "eligible service",
    defaultRewardName: "Free Haircut",
  },
  VAPE: {
    businessSingular: "vape shop",
    businessPlural: "vape shops",
    staffSingular: "cashier",
    staffPlural: "cashiers",
    loyaltyUnitSingular: "stamp",
    loyaltyUnitPlural: "stamps",
    qualifyingAction: "eligible purchase",
    defaultRewardName: "Member Reward",
  },
  RESTAURANT: {
    businessSingular: "restaurant", businessPlural: "restaurants", staffSingular: "cashier", staffPlural: "cashiers",
    loyaltyUnitSingular: "stamp", loyaltyUnitPlural: "stamps", qualifyingAction: "eligible order", defaultRewardName: "Restaurant Reward",
  },
  OTHER: {
    businessSingular: "business",
    businessPlural: "businesses",
    staffSingular: "staff member",
    staffPlural: "staff",
    loyaltyUnitSingular: "stamp",
    loyaltyUnitPlural: "stamps",
    qualifyingAction: "eligible purchase",
    defaultRewardName: "Member Reward",
  },
} satisfies Record<
  BusinessType,
  BusinessTerminology
>;

export function getBusinessTerminology(
  businessType: BusinessType,
): BusinessTerminology {
  return terminologyByBusinessType[businessType];
}
// Older accounts could inherit the café reward from the database default.
export function getRewardName(business: { businessType: BusinessType; rewardName?: string | null }) {
  const name = business.rewardName?.trim();
  if (!name || (business.businessType !== "CAFE" && name.toLowerCase() === "free drink")) {
    return getBusinessTerminology(business.businessType).defaultRewardName;
  }
  // Format the display label consistently on web cards and both Wallets.
  // The database value is unchanged; e.g. "50%off" displays as "50% off".
  return name.replace(/(\d+)\s*%\s*off/gi, "$1% off");
}

export const businessTypeLabels: Record<BusinessType, string> = {
  CAFE: "Café",
  BARBERSHOP: "Barbershop",
  VAPE: "Vape shop",
  OTHER: "Other business",
  RESTAURANT: "Restaurant",
};
