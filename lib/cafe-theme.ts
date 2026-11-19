import type { CSSProperties } from "react";
import type { BusinessType } from "@prisma/client";
export type CafeThemeName =
  | "COFFEE_CLASSIC"
  | "MODERN_MINIMAL"
  | "DARK_LUXURY"
  | "MEDITERRANEAN_BLUE"
  | "ORGANIC";

export type ThemeBusinessType = BusinessType;

export type BusinessThemeOption = {
  value: CafeThemeName;
  label: string;
  description: string;
};

export type CafeThemeConfig = {
  pageBackground: string;
  surface: string;
  surfaceRaised: string;
  border: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  accent: string;
  accentHover: string;
  accentSoft: string;
  accentText: string;

  success: string;
  warning: string;
  danger: string;

  inputBackground: string;
  inputBorder: string;

  buttonText: string;
  cardShadow: string;

  radiusLarge: string;
  radiusMedium: string;
};

const themes: Record<CafeThemeName, CafeThemeConfig> = {
  COFFEE_CLASSIC: {
    pageBackground: "#f3ede5",
    surface: "#fffaf4",
    surfaceRaised: "#eee3d7",
    border: "rgba(80, 54, 38, 0.14)",

    textPrimary: "#2f211a",
    textSecondary: "#6f4a35",
    textMuted: "#8f7868",

    accent: "#7b4f35",
    accentHover: "#68412b",
    accentSoft: "rgba(123, 79, 53, 0.13)",
    accentText: "#fffaf5",

    success: "#4f7a5c",
    warning: "#b98235",
    danger: "#b6534f",

    inputBackground: "#fffdf9",
    inputBorder: "rgba(80, 54, 38, 0.17)",

    buttonText: "#ffffff",
    cardShadow: "0 24px 70px rgba(74, 47, 31, 0.14)",

    radiusLarge: "28px",
    radiusMedium: "18px",
  },

  MODERN_MINIMAL: {
    pageBackground: "#f2f0eb",
    surface: "#fffefa",
    surfaceRaised: "#e8e5de",
    border: "rgba(31, 31, 29, 0.10)",

    textPrimary: "#1c1c1a",
    textSecondary: "#464641",
    textMuted: "#77756e",

    accent: "#20201e",
    accentHover: "#373733",
    accentSoft: "rgba(32, 32, 30, 0.07)",
    accentText: "#ffffff",

    success: "#42775d",
    warning: "#af7d2b",
    danger: "#b54d4d",

    inputBackground: "#fffefa",
    inputBorder: "rgba(31, 31, 29, 0.13)",

    buttonText: "#ffffff",
    cardShadow: "0 20px 60px rgba(33, 31, 27, 0.09)",

    radiusLarge: "24px",
    radiusMedium: "15px",
  },

  DARK_LUXURY: {
    pageBackground: "#0b0908",
    surface: "#14110f",
    surfaceRaised: "#1e1915",
    border: "rgba(192, 146, 93, 0.18)",

    textPrimary: "#f3eadf",
    textSecondary: "#cba477",
    textMuted: "#918276",

    accent: "#b98552",
    accentHover: "#c99a68",
    accentSoft: "rgba(185, 133, 82, 0.13)",
    accentText: "#160f0a",

    success: "#75b48f",
    warning: "#d6a85e",
    danger: "#d97870",

    inputBackground: "#181310",
    inputBorder: "rgba(192, 146, 93, 0.19)",

    buttonText: "#160f0a",
    cardShadow: "0 30px 100px rgba(0, 0, 0, 0.52)",

    radiusLarge: "30px",
    radiusMedium: "18px",
  },

  /*
   * The database value remains MEDITERRANEAN_BLUE so we do not need
   * a Prisma migration. In the interface, it will be displayed
   * as “Mediterranean Blue”.
   */
  MEDITERRANEAN_BLUE: {
    pageBackground: "#eaf3f5",
    surface: "#fbfdfc",
    surfaceRaised: "#dbe9eb",
    border: "rgba(50, 91, 103, 0.14)",

    textPrimary: "#18333a",
    textSecondary: "#426c77",
    textMuted: "#718b91",

    accent: "#5f8994",
    accentHover: "#4f7883",
    accentSoft: "rgba(95, 137, 148, 0.14)",
    accentText: "#f8fdfd",

    success: "#4e806d",
    warning: "#bd8c43",
    danger: "#bd625e",

    inputBackground: "#ffffff",
    inputBorder: "rgba(50, 91, 103, 0.16)",

    buttonText: "#ffffff",
    cardShadow: "0 24px 75px rgba(50, 91, 103, 0.13)",

    radiusLarge: "30px",
    radiusMedium: "18px",
  },

  ORGANIC: {
    pageBackground: "#edf0e5",
    surface: "#fafbf5",
    surfaceRaised: "#e1e6d6",
    border: "rgba(67, 83, 51, 0.14)",

    textPrimary: "#263122",
    textSecondary: "#556849",
    textMuted: "#7d8974",

    accent: "#758b64",
    accentHover: "#637856",
    accentSoft: "rgba(117, 139, 100, 0.14)",
    accentText: "#f9fbf5",

    success: "#4e7d5f",
    warning: "#b58943",
    danger: "#b65f59",

    inputBackground: "#fcfdf8",
    inputBorder: "rgba(67, 83, 51, 0.16)",

    buttonText: "#ffffff",
    cardShadow: "0 24px 70px rgba(63, 80, 48, 0.13)",

    radiusLarge: "28px",
    radiusMedium: "18px",
  },
};

const barberThemes: Partial<
  Record<CafeThemeName, CafeThemeConfig>
> = {
  DARK_LUXURY: {
    pageBackground: "#0E1513",
    surface: "#141B19",
    surfaceRaised: "#202725",
    border: "rgba(219, 207, 189, 0.14)",

    textPrimary: "#F2EEE7",
    textSecondary: "#CDC5B8",
    textMuted: "#89908B",

    accent: "#9B6546",
    accentHover: "#AC7554",
    accentSoft: "rgba(155, 101, 70, 0.17)",
    accentText: "#FEFAF3",

    success: "#668777",
    warning: "#C5905D",
    danger: "#C76E63",

    inputBackground: "#19201E",
    inputBorder: "rgba(219, 207, 189, 0.16)",

    buttonText: "#FEFAF3",
    cardShadow: "0 30px 90px rgba(0, 0, 0, 0.38)",

    radiusLarge: "26px",
    radiusMedium: "16px",
  },

  MODERN_MINIMAL: {
    pageBackground: "#E7E5E0",
    surface: "#F4F3F0",
    surfaceRaised: "#D8D6D1",
    border: "rgba(27, 29, 30, 0.12)",

    textPrimary: "#17191A",
    textSecondary: "#43484A",
    textMuted: "#7C8182",

    accent: "#343A3C",
    accentHover: "#24292B",
    accentSoft: "rgba(52, 58, 60, 0.10)",
    accentText: "#FFFFFF",

    success: "#527565",
    warning: "#A9773F",
    danger: "#B85E58",

    inputBackground: "#FAF9F7",
    inputBorder: "rgba(27, 29, 30, 0.15)",

    buttonText: "#FFFFFF",
    cardShadow: "0 24px 70px rgba(24, 28, 29, 0.12)",

    radiusLarge: "24px",
    radiusMedium: "14px",
  },

  COFFEE_CLASSIC: {
    pageBackground: "#1B1815",
    surface: "#24201C",
    surfaceRaised: "#312A24",
    border: "rgba(224, 184, 143, 0.17)",

    textPrimary: "#F4EDE5",
    textSecondary: "#D8C6B5",
    textMuted: "#9A8D82",

    accent: "#B8613C",
    accentHover: "#CA7149",
    accentSoft: "rgba(184, 97, 60, 0.15)",
    accentText: "#FFF8F1",

    success: "#708778",
    warning: "#C18755",
    danger: "#CC6B60",

    inputBackground: "#29231E",
    inputBorder: "rgba(224, 184, 143, 0.19)",

    buttonText: "#FFF7F0",
    cardShadow: "0 32px 100px rgba(0, 0, 0, 0.44)",

    radiusLarge: "26px",
    radiusMedium: "15px",
  },
};

export function getDefaultBusinessTheme(businessType: ThemeBusinessType): CafeThemeName {
  switch (businessType) {
    case "BARBERSHOP": return "DARK_LUXURY";
    case "VAPE": return "MODERN_MINIMAL";
    case "OTHER": return "ORGANIC";
    default: return "COFFEE_CLASSIC";
  }
}

type BrandColors = { primaryColor?: string | null; secondaryColor?: string | null; backgroundColor?: string | null };

export function getBusinessBrandColors(themeName: string, businessType: ThemeBusinessType, saved?: BrandColors): [string, string, string] {
  const defaults = getBusinessThemeColors(themeName, businessType);
  const color = (value: string | null | undefined, fallback: string) =>
    value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return [color(saved?.primaryColor, defaults[0]), color(saved?.secondaryColor, defaults[1]), color(saved?.backgroundColor, defaults[2])];
}

function colorLuma(hex: string) {
  return [0.2126, 0.7152, 0.0722].reduce(
    (sum, weight, i) => {
      const channel = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return sum + weight * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    },
    0,
  );
}

export function getBusinessTheme(
  themeName: CafeThemeName | string,
  businessType: ThemeBusinessType,
  saved?: BrandColors,
): CafeThemeConfig {
  const base = businessType === "BARBERSHOP"
    ? barberThemes[themeName as CafeThemeName] ?? barberThemes.DARK_LUXURY!
    : getCafeTheme(themeName);
  const defaults = getBusinessThemeColors(themeName, businessType);
  const retail = businessType === "VAPE" || businessType === "OTHER";
  if (!retail && getBusinessBrandColors(themeName, businessType, saved).every((color, i) => color.toLowerCase() === defaults[i].toLowerCase())) return base;
  return applyBrandColors(base, getBusinessBrandColors(themeName, businessType, saved));
}

function applyBrandColors(base: CafeThemeConfig, [accent, secondary, background]: [string, string, string]): CafeThemeConfig {
  const light = colorLuma(background) > 0.32;
  const ink = light ? "#23332c" : "#f7f4eb";
  const accentedText = ((Math.max(colorLuma(accent), colorLuma(background)) + 0.05) /
    (Math.min(colorLuma(accent), colorLuma(background)) + 0.05)) >= 4.5 ? accent : ink;
  const accentText = colorLuma(accent) > 0.179 ? "#111111" : "#ffffff";
  const surface = light ? "#fffefa" : "#242723";
  return {
    ...base,
    pageBackground: background,
    surface,
    surfaceRaised: light ? "#f0eee8" : "#30342d",
    border: light ? "#dedfd6" : "#464b40",
    textPrimary: ink,
    textSecondary: light ? "#46574d" : "#e0e2d8",
    textMuted: light ? "#58675e" : "#b9c0b6",
    accent: accentedText,
    accentHover: secondary,
    accentSoft: `${accent}1f`,
    accentText: accentedText === accent ? accentText : light ? "#ffffff" : "#161a15",
    buttonText: accentedText === accent ? accentText : light ? "#ffffff" : "#161a15",
    inputBackground: surface,
    inputBorder: light ? "#cbd0c5" : "#53594e",
    cardShadow: light ? "0 16px 44px rgba(39,49,38,.09)" : "0 18px 50px rgba(0,0,0,.25)",
  };
}

export function getBusinessThemeColors(
  themeName: CafeThemeName | string,
  businessType: ThemeBusinessType,
): [string, string, string] {
  if (businessType === "VAPE" && themeName === "MODERN_MINIMAL") {
    return ["#71523d", "#b49072", "#f8f5ef"];
  }
  if (businessType === "OTHER" && themeName === "ORGANIC") {
    return ["#426453", "#819788", "#eef1e9"];
  }
  if (businessType === "BARBERSHOP") {
    if (themeName === "MODERN_MINIMAL") {
      return ["#343A3C", "#A5AAAB", "#E7E5E0"];
    }

    if (themeName === "COFFEE_CLASSIC") {
      return ["#B8613C", "#E0B88F", "#1B1815"];
    }

    if (themeName === "DARK_LUXURY") return ["#9B6546", "#D7CAB8", "#0E1513"];
  }

  if (themeName === "MODERN_MINIMAL") {
    return ["#20201E", "#77756E", "#FFFEFA"];
  }

  if (themeName === "DARK_LUXURY") {
    return ["#B98552", "#CBA477", "#0B0908"];
  }

  if (themeName === "MEDITERRANEAN_BLUE") {
    return ["#5F8994", "#426C77", "#EAF3F5"];
  }

  if (themeName === "ORGANIC") {
    return ["#758B64", "#556849", "#EDF0E5"];
  }

  return ["#7B4F35", "#6F4A35", "#F3EDE5"];
}

export function getCafeTheme(
  themeName: CafeThemeName | string
): CafeThemeConfig {
  if (themeName in themes) {
    return themes[themeName as CafeThemeName];
  }

  return themes.COFFEE_CLASSIC;
}

const sharedTheme = {
  success: "#386249",
  warning: "#855416",
  danger: "#b91e1e",
  cardShadow: "0 1px 2px rgb(28 26 23 / 0.10), 0 4px 14px rgb(28 26 23 / 0.04)",
  radiusLarge: "16px",
  radiusMedium: "8px",
};

const dashboardThemes: Record<CafeThemeName, CafeThemeConfig> = {
  MODERN_MINIMAL: {
    ...sharedTheme,
    pageBackground: "#e9e4d8",
    surface: "#f4efe4",
    surfaceRaised: "#d8d2c4",
    border: "#d2cbbb",
    textPrimary: "#20201e",
    textSecondary: "#524f47",
    textMuted: "#625d53",
    accent: "#2e2e2e",
    accentHover: "#42413d",
    accentSoft: "#e6e4d7",
    accentText: "#f4efe4",
    buttonText: "#f4efe4",
    inputBackground: "#e9e4d8",
    inputBorder: "#8c8272",
  },
  COFFEE_CLASSIC: {
    ...sharedTheme,
    pageBackground: "#f9f9f9",
    surface: "#ffffff",
    surfaceRaised: "#ebebeb",
    border: "#dedede",
    textPrimary: "#080808",
    textSecondary: "#454545",
    textMuted: "#595959",
    accent: "#080808",
    accentHover: "#262626",
    accentSoft: "#eeeeee",
    accentText: "#ffffff",
    buttonText: "#ffffff",
    inputBackground: "#fafafa",
    inputBorder: "#777777",
  },
  ORGANIC: {
    ...sharedTheme,
    pageBackground: "#e4e7db",
    surface: "#f1f3e9",
    surfaceRaised: "#d5dccb",
    border: "#c6cebc",
    textPrimary: "#253129",
    textSecondary: "#465346",
    textMuted: "#546052",
    accent: "#395447",
    accentHover: "#2b4237",
    accentSoft: "#e0e8d9",
    accentText: "#f3f6ee",
    buttonText: "#f3f6ee",
    inputBackground: "#e8ecdf",
    inputBorder: "#7d8976",
  },
  MEDITERRANEAN_BLUE: {
    ...sharedTheme,
    pageBackground: "#ffffff",
    surface: "#ffffff",
    surfaceRaised: "#f1f2f4",
    border: "#dce1e8",
    textPrimary: "#252830",
    textSecondary: "#485362",
    textMuted: "#566173",
    accent: "#2468df",
    accentHover: "#1956bf",
    accentSoft: "#e0f0fb",
    accentText: "#ffffff",
    buttonText: "#ffffff",
    inputBackground: "#ffffff",
    inputBorder: "#707c90",
  },
  DARK_LUXURY: {
    ...sharedTheme,
    pageBackground: "#0b0b0d",
    surface: "#121214",
    surfaceRaised: "#19191d",
    border: "#2d2d32",
    textPrimary: "#fafafa",
    textSecondary: "#d1d1d8",
    textMuted: "#aaaab4",
    accent: "#fafafa",
    accentHover: "#dedee5",
    accentSoft: "#252529",
    accentText: "#101012",
    buttonText: "#101012",
    success: "#9bd4ae",
    warning: "#f1cd86",
    danger: "#ff7c7d",
    inputBackground: "#0c0c0e",
    inputBorder: "#73737c",
    cardShadow: "0 1px 2px rgb(0 0 0 / 0.26), 0 4px 14px rgb(0 0 0 / 0.12)",
  },
};

export const DEFAULT_DASHBOARD_THEME = "COFFEE_CLASSIC";

export const dashboardThemeOptions: BusinessThemeOption[] = [
  { value: "COFFEE_CLASSIC", label: "Black and White", description: "Black accents on white." },
  { value: "MEDITERRANEAN_BLUE", label: "Blue and White", description: "Blue accents on white." },
  { value: "DARK_LUXURY", label: "Black", description: "White accents on black." },
  { value: "MODERN_MINIMAL", label: "Beige", description: "Beige with charcoal accents." },
  { value: "ORGANIC", label: "Green", description: "Green accents on light green." },
];

export function getDashboardThemeColors(themeName: CafeThemeName): [string, string, string] {
  const theme = dashboardThemes[themeName];
  return [theme.accent, theme.accentHover, theme.pageBackground];
}

export function getDashboardTheme(themeName: CafeThemeName, saved?: BrandColors): CafeThemeConfig {
  const base = dashboardThemes[themeName];
  const defaults = getDashboardThemeColors(themeName);
  const values = [saved?.primaryColor, saved?.secondaryColor, saved?.backgroundColor].map((color, i) =>
    color && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : defaults[i],
  ) as [string, string, string];
  if (values.every((color, i) => color === defaults[i])) return base;
  return applyBrandColors(base, values);
}


export function dashboardThemeVariables(theme: CafeThemeConfig): CSSProperties {
  return {
    "--background": theme.pageBackground,
    "--foreground": theme.textPrimary,
    "--card": theme.surface,
    "--card-foreground": theme.textPrimary,
    "--popover": theme.surface,
    "--popover-foreground": theme.textPrimary,
    "--primary": theme.accent,
    "--primary-foreground": theme.buttonText,
    "--secondary": theme.surfaceRaised,
    "--secondary-foreground": theme.textSecondary,
    "--muted": theme.surfaceRaised,
    "--muted-foreground": theme.textMuted,
    "--accent": theme.accentSoft,
    "--accent-foreground": theme.textPrimary,
    "--destructive": theme.danger,
    "--border": theme.border,
    "--input": theme.inputBorder,
    "--ring": theme.accent,
  } as CSSProperties;
}
