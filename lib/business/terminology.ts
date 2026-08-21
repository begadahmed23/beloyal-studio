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
} satisfies Record<
  BusinessType,
  BusinessTerminology
>;

export function getBusinessTerminology(
  businessType: BusinessType,
): BusinessTerminology {
  return terminologyByBusinessType[businessType];
}