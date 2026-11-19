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

const sharedTheme = {
  success: "#386249",
  warning: "#855416",
  danger: "#b91e1e",
  cardShadow: "0 1px 2px rgb(28 26 23 / 0.10), 0 4px 14px rgb(28 26 23 / 0.04)",
  radiusLarge: "16px",
  radiusMedium: "8px",
};

const themes: Record<CafeThemeName, CafeThemeConfig> = {
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
    pageBackground: "#efe2d7",
    surface: "#faf0e7",
    surfaceRaised: "#e5d0bf",
    border: "#d9beaa",
    textPrimary: "#31231f",
    textSecondary: "#5b4035",
    textMuted: "#6a5147",
    accent: "#784c41",
    accentHover: "#633d35",
    accentSoft: "#eddacf",
    accentText: "#fff6ef",
    buttonText: "#fff6ef",
    inputBackground: "#f4e7dc",
    inputBorder: "#9b7c6a",
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
    pageBackground: "#e1e7eb",
    surface: "#eff3f5",
    surfaceRaised: "#d4dfe6",
    border: "#c4d1da",
    textPrimary: "#23333f",
    textSecondary: "#425867",
    textMuted: "#4e626e",
    accent: "#3c596e",
    accentHover: "#324c5f",
    accentSoft: "#dfe8ed",
    accentText: "#f3f7fa",
    buttonText: "#f3f7fa",
    inputBackground: "#e6edf1",
    inputBorder: "#788d9c",
  },
  DARK_LUXURY: {
    ...sharedTheme,
    pageBackground: "#282521",
    surface: "#302d28",
    surfaceRaised: "#403a32",
    border: "#524a40",
    textPrimary: "#f4ece0",
    textSecondary: "#ddd2c2",
    textMuted: "#c4b8a6",
    accent: "#debb93",
    accentHover: "#efcba2",
    accentSoft: "#4a3e32",
    accentText: "#29231c",
    buttonText: "#29231c",
    success: "#a9c9ab",
    warning: "#ebc486",
    danger: "#f1a19a",
    inputBackground: "#27241f",
    inputBorder: "#948773",
    cardShadow: "0 1px 2px rgb(0 0 0 / 0.26), 0 4px 14px rgb(0 0 0 / 0.12)",
  },
};

const themeOptions: BusinessThemeOption[] = [
  { value: "MODERN_MINIMAL", label: "Zen Linen", description: "Warm linen, stone, and charcoal." },
  { value: "COFFEE_CLASSIC", label: "Clay & Oat", description: "Soft oat with muted terracotta." },
  { value: "ORGANIC", label: "Soft Sage", description: "Pale sage with eucalyptus green." },
  { value: "MEDITERRANEAN_BLUE", label: "Mist Blue", description: "Cool stone with slate blue." },
  { value: "DARK_LUXURY", label: "Smoked Bronze", description: "Warm charcoal with brushed bronze." },
];

export function getDefaultBusinessTheme(businessType: ThemeBusinessType): CafeThemeName {
  switch (businessType) {
    case "BARBERSHOP": return "DARK_LUXURY";
    case "VAPE": return "MODERN_MINIMAL";
    case "OTHER": return "ORGANIC";
    default: return "COFFEE_CLASSIC";
  }
}

export function getBusinessThemeOptions() {
  return themeOptions;
}

type BrandColors = { primaryColor?: string | null; secondaryColor?: string | null; backgroundColor?: string | null };

export function getBusinessBrandColors(themeName: string, saved?: BrandColors): [string, string, string] {
  const defaults = getBusinessThemeColors(themeName);
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
  saved?: BrandColors,
): CafeThemeConfig {
  const base = getCafeTheme(themeName);
  const [accent, secondary, background] = getBusinessBrandColors(themeName, saved);
  const defaults = getBusinessThemeColors(themeName);
  if ([accent, secondary, background].every((value, i) => value.toLowerCase() === defaults[i].toLowerCase())) return base;

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
    buttonText: accentText,
    inputBackground: surface,
    inputBorder: light ? "#cbd0c5" : "#53594e",
    cardShadow: light ? "0 16px 44px rgba(39,49,38,.09)" : "0 18px 50px rgba(0,0,0,.25)",
  };
}

export function getBusinessThemeColors(themeName: CafeThemeName | string): [string, string, string] {
  const theme = getCafeTheme(themeName);
  return [theme.accent, theme.textSecondary, theme.pageBackground];
}

export function getCafeTheme(themeName: CafeThemeName | string): CafeThemeConfig {
  return Object.hasOwn(themes, themeName) ? themes[themeName as CafeThemeName] : themes.COFFEE_CLASSIC;
}
