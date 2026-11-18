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

export const cafeThemeOptions: BusinessThemeOption[] = [
  {
    value: "COFFEE_CLASSIC",
    label: "Coffee Classic",
    description:
      "Warm cream and walnut tones for a timeless coffee-house atmosphere.",
  },
  {
    value: "MODERN_MINIMAL",
    label: "Modern Minimal",
    description:
      "Soft ivory, stone, and charcoal for bright contemporary cafés.",
  },
  {
    value: "DARK_LUXURY",
    label: "Dark Luxury",
    description:
      "Deep espresso and bronze for an intimate, high-end experience.",
  },
  {
    value: "MEDITERRANEAN_BLUE",
    label: "Mediterranean Blue",
    description:
      "Calm coastal blues, warm ivory, and an airy Mediterranean feeling.",
  },
  {
    value: "ORGANIC",
    label: "Organic",
    description:
      "Sage, oat, and natural tones for calm wellness-focused cafés.",
  },
];

export const barberThemeOptions: BusinessThemeOption[] = [
  {
    value: "DARK_LUXURY",
    label: "Forest & Walnut",
    description:
      "Deep forest charcoal, walnut leather, and warm ivory.",
  },
  {
    value: "MODERN_MINIMAL",
    label: "Concrete & Chrome",
    description:
      "Pale concrete, graphite, and brushed silver for a clean studio look.",
  },
  {
    value: "COFFEE_CLASSIC",
    label: "Brick & Black",
    description:
      "Industrial charcoal, warm brick, and soft sandstone highlights.",
  },
];

const retailThemeOptions: BusinessThemeOption[] = [
  { value: "MODERN_MINIMAL", label: "Soft Ivory", description: "Clean ivory, ink, and warm neutrals." },
  { value: "ORGANIC", label: "Soft Sage", description: "Sage green with oat and cream." },
  { value: "MEDITERRANEAN_BLUE", label: "Mist Blue", description: "Dusty blue with pale stone." },
  { value: "DARK_LUXURY", label: "Charcoal", description: "Deep charcoal with warm accents." },
  { value: "COFFEE_CLASSIC", label: "Warm Sand", description: "Sand and muted terracotta." },
];

export function getDefaultBusinessTheme(businessType: ThemeBusinessType): CafeThemeName {
  switch (businessType) {
    case "BARBERSHOP": return "DARK_LUXURY";
    case "VAPE": return "MODERN_MINIMAL";
    case "OTHER": return "ORGANIC";
    default: return "COFFEE_CLASSIC";
  }
}

export function getBusinessThemeOptions(businessType: ThemeBusinessType) {
  if (businessType === "BARBERSHOP") return barberThemeOptions;
  if (businessType === "VAPE") return [
    { value: "MODERN_MINIMAL", label: "Ivory & Walnut", description: "White surfaces with warm walnut accents." } as const,
    ...retailThemeOptions.slice(1),
  ];
  return businessType === "OTHER" ? retailThemeOptions : cafeThemeOptions;
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
  const [accent, secondary, background] = getBusinessBrandColors(themeName, businessType, saved);
  const defaults = getBusinessThemeColors(themeName, businessType);
  const retail = businessType === "VAPE" || businessType === "OTHER";
  if (!retail && [accent, secondary, background].every((value, i) => value.toLowerCase() === defaults[i].toLowerCase())) return base;

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

    return ["#9B6546", "#D7CAB8", "#0E1513"];
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
