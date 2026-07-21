export type CafeThemeName =
  | "COFFEE_CLASSIC"
  | "MODERN_MINIMAL"
  | "DARK_LUXURY"
  | "SOFT_PASTEL"
  | "ORGANIC";

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
   * The database value remains SOFT_PASTEL so we do not need
   * a Prisma migration. In the interface, it will be displayed
   * as “Mediterranean Blue”.
   */
  SOFT_PASTEL: {
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

export function getCafeTheme(
  themeName: CafeThemeName | string
): CafeThemeConfig {
  if (themeName in themes) {
    return themes[themeName as CafeThemeName];
  }

  return themes.COFFEE_CLASSIC;
}