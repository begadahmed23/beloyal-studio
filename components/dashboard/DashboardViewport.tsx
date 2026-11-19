"use client";

import type { ReactNode } from "react";

import { isLightColor, normalizeHex } from "@/app/card/[token]/card-theme-utils";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { dashboardThemeVariables } from "@/lib/cafe-theme";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function DashboardViewport({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { theme } = useCafeTheme();
  const { dir, lang } = useBeLoyalLanguage();
  const chromeColor = normalizeHex(theme.surface, "#fffefa");
  const pageColor = normalizeHex(theme.pageBackground, chromeColor);
  const colorScheme = isLightColor(chromeColor) ? "light" : "dark";

  return (
    <div
      data-dashboard-viewport=""
      dir={dir}
      lang={lang}
      className={`flex h-dvh min-w-0 flex-col overflow-hidden lg:block lg:h-auto lg:min-h-screen lg:overflow-visible ${className}`}
      style={{ ...dashboardThemeVariables(theme), backgroundColor: theme.pageBackground, color: theme.textPrimary }}
    >
      {/* Safari can extend the document background into the area around its controls. */}
      <style>{`
        html:has([data-dashboard-viewport]) {
          --dashboard-chrome: ${chromeColor};
          --dashboard-desktop-header: ${pageColor}e8;
        }
        @media (width < 64rem) {
          html:has([data-dashboard-viewport]),
          html:has([data-dashboard-viewport]) > body {
            background-color: var(--dashboard-chrome);
            color-scheme: ${colorScheme};
          }
        }
      `}</style>
      {children}
    </div>
  );
}
