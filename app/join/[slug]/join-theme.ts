import { getBusinessTheme, getBusinessThemeColors, type CafeThemeName } from "@/lib/cafe-theme";
import { getReadableText, isLightColor, mixColors, normalizeHex } from "@/app/card/[token]/card-theme-utils";
import { withAlpha } from "@/app/card/[token]/card-utils";

type JoinCafe = {
  name: string;
  slug: string;
  theme: CafeThemeName;
  businessType: "CAFE" | "BARBERSHOP";
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundColor?: string | null;
};

export function getJoinTheme(cafe: JoinCafe) {
  const name = cafe.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matches = (brand: string) => cafe.slug.toLowerCase().includes(brand) || name.includes(brand);
  const isLoretto = matches("loretto");
  const isKeka = !isLoretto && matches("keka");
  const isKato = !isLoretto && !isKeka && matches("kato");
  const base = getBusinessTheme(cafe.theme, cafe.businessType);
  const mapped = getBusinessThemeColors(cafe.theme, cafe.businessType);
  const barber = cafe.businessType === "BARBERSHOP";
  let primary = normalizeHex(barber ? mapped[0] : cafe.primaryColor, "#2563EB");
  let secondary = normalizeHex(barber ? mapped[1] : cafe.secondaryColor, "#60A5FA");
  const background = normalizeHex(barber ? mapped[2] : cafe.backgroundColor, "#0B1220");
  let surface = barber && cafe.theme === "COFFEE_CLASSIC" ? "#211D1A" : mixColors(background, primary, isLightColor(background) ? 0.78 : 0.7);
  let pageBackground = `radial-gradient(circle at top,${withAlpha(primary, barber ? 0.2 : 0.42)} 0%,transparent 42%),${background}`;
  let shellBackground = surface;
  let foreground = getReadableText(surface);

  if (isLoretto) {
    const heritage = cafe.theme === "DARK_LUXURY";
    primary = secondary = "#4A3D34";
    surface = heritage ? "#E9DFC9" : "#F3EBDD";
    foreground = "#2E2A27";
    pageBackground = heritage
      ? "linear-gradient(180deg,#F1E7D4 0%,#E9DFC9 55%,#E4D7BD 100%)"
      : "linear-gradient(180deg,#F8F3EA 0%,#F3EBDD 55%,#ECE2D1 100%)";
    shellBackground = surface;
  } else if (isKeka) {
    const cream = cafe.theme === "MODERN_MINIMAL";
    primary = secondary = cream ? "#741A1D" : "#F4E5C6";
    surface = cream ? "#FFF6E6" : "#741A1D";
    foreground = cream ? "#4A0D10" : "#FFF6E6";
    pageBackground = "linear-gradient(180deg,#F5E7D2 0%,#E8D2B8 100%)";
    shellBackground = cream
      ? "linear-gradient(155deg,#FFF6E6 0%,#F4E5C6 100%)"
      : "radial-gradient(circle at 85% 5%,rgba(255,220,180,.09),transparent 28%),linear-gradient(150deg,#8A2426 0%,#741A1D 48%,#4A0D10 100%)";
  } else if (isKato) {
    const dark = cafe.theme === "DARK_LUXURY";
    primary = secondary = dark ? "#E9E6D8" : "#102B49";
    surface = dark ? "#071A33" : "#FFFFFF";
    foreground = dark ? "#F5F3EC" : "#102B49";
    pageBackground = dark ? "linear-gradient(180deg,#06172B 0%,#0A223E 100%)" : "linear-gradient(180deg,#F7F9FB 0%,#EEF3F7 100%)";
    shellBackground = surface;
  }

  const light = isLightColor(surface);
  const ink = light ? foreground : "#FFFFFF";
  const inputBackground = light ? "rgba(255,255,255,.38)" : "rgba(0,0,0,.16)";
  return {
    ...base,
    isLoretto, isKeka, isKato, light,
    primary, secondary, pageBackground, shellBackground,
    surface,
    surfaceRaised: light ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.12)",
    textPrimary: foreground,
    textSecondary: withAlpha(ink, 0.72),
    textMuted: withAlpha(ink, 0.57),
    border: withAlpha(ink, 0.14),
    inputBorder: withAlpha(ink, 0.17),
    inputBackground,
    accent: primary,
    accentSoft: withAlpha(primary, 0.1),
    buttonText: isKeka ? light ? "#FFF6E6" : "#4A0D10" : isLoretto ? "#F8F3EA" : getReadableText(primary),
    cardShadow: light ? "0 28px 90px rgba(57,48,41,.15)" : "0 28px 90px rgba(0,0,0,.28)",
    ...(isKato ? {
      inputBorder: light ? "rgba(16,43,73,0.12)" : "rgba(233,230,216,0.12)",
      inputBackground: light ? "#F7F9FB" : "#0D2744",
      textSecondary: light ? "#43536A" : "#C1C8CF",
      textMuted: light ? "#7F8DA0" : "#8F9AA6",
    } : {}),
  };
}
