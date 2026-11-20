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
      className={`flex min-h-dvh min-w-0 flex-col lg:block lg:min-h-screen ${className}`}
      style={{ ...dashboardThemeVariables(theme), backgroundColor: theme.pageBackground, color: theme.textPrimary }}
    >
      {/* Safari can extend the document background into the area around its controls. */}
      <style>{`
        html:has([data-dashboard-viewport]) {
          --dashboard-chrome: ${chromeColor};
          --dashboard-desktop-header: ${pageColor}e8;
        }
        @media (width < 64rem) {
          [data-dashboard-viewport]:has(input:focus,textarea:focus,select:focus,[contenteditable="true"]:focus) nav[data-dashboard-mobile-nav] { visibility: hidden; pointer-events: none; }
          [data-dashboard-viewport] nav[data-dashboard-mobile-nav] { position: fixed; inset-inline: 0; bottom: 0; }
          [data-dashboard-viewport] [data-dashboard-content] { overflow: visible; padding-bottom: calc(5rem + env(safe-area-inset-bottom)); }
          html:has([data-dashboard-viewport]), html:has([data-dashboard-viewport]) > body { height: auto; overflow-y: visible; }
          [data-dashboard-viewport] input, [data-dashboard-viewport] textarea, [data-dashboard-viewport] select { font-size: max(16px, 1em); }
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
