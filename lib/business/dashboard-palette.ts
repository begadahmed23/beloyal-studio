import { Prisma, type CafeTheme } from "@prisma/client";
import {
  APPLE_GREEN_DASHBOARD_THEME,
  getDashboardThemeColors,
  type DashboardThemeName,
} from "../cafe-theme";
import { getMbVapeBrandColors, isMbVape } from "./mb-vape";

export const baseDashboardPaletteSelect = {
  dashboardTheme: true,
  dashboardPrimaryColor: true,
  dashboardSecondaryColor: true,
  dashboardBackgroundColor: true,
} as const;

export const dashboardPaletteSelect = {
  ...baseDashboardPaletteSelect,
  dashboardPaletteOverride: true,
} as const;

type DashboardPalette = {
  dashboardTheme: CafeTheme | null;
  dashboardPrimaryColor: string | null;
  dashboardSecondaryColor: string | null;
  dashboardBackgroundColor: string | null;
};

export function getBaseDashboardPalette(cafe: DashboardPalette & Parameters<typeof getMbVapeBrandColors>[0] & {
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

function getAppleGreenPalette(value: Prisma.JsonValue | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.theme !== APPLE_GREEN_DASHBOARD_THEME) {
    return null;
  }

  const [primary, secondary, background] = getDashboardThemeColors(APPLE_GREEN_DASHBOARD_THEME);
  return {
    theme: APPLE_GREEN_DASHBOARD_THEME,
    primaryColor: typeof value.primaryColor === "string" ? value.primaryColor : primary,
    secondaryColor: typeof value.secondaryColor === "string" ? value.secondaryColor : secondary,
    backgroundColor: typeof value.backgroundColor === "string" ? value.backgroundColor : background,
  } as const;
}

export function getDashboardPalette(cafe: Parameters<typeof getBaseDashboardPalette>[0] & {
  dashboardPaletteOverride?: Prisma.JsonValue;
}) {
  const override = getAppleGreenPalette(cafe.dashboardPaletteOverride);
  if (override) return { ...override, hasDashboardPalette: true };
  return getBaseDashboardPalette(cafe);
}

export function dashboardPaletteUpdate({ theme, primaryColor, secondaryColor, backgroundColor }: {
  theme?: DashboardThemeName;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
} = {}, previousOverride?: Prisma.JsonValue) {
  const colors = {
    ...(primaryColor !== undefined && { primaryColor }),
    ...(secondaryColor !== undefined && { secondaryColor }),
    ...(backgroundColor !== undefined && { backgroundColor }),
  };
  const existingOverride = getAppleGreenPalette(previousOverride);
  if (theme === APPLE_GREEN_DASHBOARD_THEME || (theme === undefined && existingOverride && Object.keys(colors).length)) {
    return {
      dashboardPaletteOverride: { ...existingOverride, theme: APPLE_GREEN_DASHBOARD_THEME, ...colors },
    };
  }

  return {
    ...(theme !== undefined && { dashboardTheme: theme, dashboardPaletteOverride: Prisma.DbNull }),
    ...(primaryColor !== undefined && { dashboardPrimaryColor: primaryColor }),
    ...(secondaryColor !== undefined && { dashboardSecondaryColor: secondaryColor }),
    ...(backgroundColor !== undefined && { dashboardBackgroundColor: backgroundColor }),
  };
}
