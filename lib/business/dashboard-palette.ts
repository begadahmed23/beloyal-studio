import type { CafeTheme } from "@prisma/client";
import { getMbVapeBrandColors, isMbVape } from "./mb-vape";

export const dashboardPaletteSelect = {
  dashboardTheme: true,
  dashboardPrimaryColor: true,
  dashboardSecondaryColor: true,
  dashboardBackgroundColor: true,
} as const;

type DashboardPalette = {
  dashboardTheme: CafeTheme | null;
  dashboardPrimaryColor: string | null;
  dashboardSecondaryColor: string | null;
  dashboardBackgroundColor: string | null;
};

export function getDashboardPalette(cafe: DashboardPalette & Parameters<typeof getMbVapeBrandColors>[0] & {
  theme: CafeTheme;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
}) {
  const legacy = isMbVape(cafe) ? getMbVapeBrandColors(cafe) : cafe;
  return {
    theme: cafe.dashboardTheme ?? cafe.theme,
    primaryColor: cafe.dashboardPrimaryColor ?? legacy.primaryColor,
    secondaryColor: cafe.dashboardSecondaryColor ?? legacy.secondaryColor,
    backgroundColor: cafe.dashboardBackgroundColor ?? legacy.backgroundColor,
    hasDashboardPalette: [cafe.dashboardTheme, cafe.dashboardPrimaryColor,
      cafe.dashboardSecondaryColor, cafe.dashboardBackgroundColor].some((value) => value !== null),
  };
}

export function dashboardPaletteUpdate({ theme, primaryColor, secondaryColor, backgroundColor }: {
  theme?: CafeTheme;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
} = {}) {
  return {
    ...(theme !== undefined && { dashboardTheme: theme }),
    ...(primaryColor !== undefined && { dashboardPrimaryColor: primaryColor }),
    ...(secondaryColor !== undefined && { dashboardSecondaryColor: secondaryColor }),
    ...(backgroundColor !== undefined && { dashboardBackgroundColor: backgroundColor }),
  };
}
