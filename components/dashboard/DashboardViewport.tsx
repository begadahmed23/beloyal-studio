"use client";

import { useEffect, useRef, type ReactNode } from "react";

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

  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = viewportRef.current;
    const viewport = window.visualViewport;
    if (!node || !viewport) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (viewport.scale === 1) node.style.setProperty("--dashboard-visible-height", `${Math.round(viewport.height)}px`);
      });
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("pageshow", sync);
      node.style.removeProperty("--dashboard-visible-height");
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      data-dashboard-viewport=""
      dir={dir}
      lang={lang}
      className={`flex h-[var(--dashboard-visible-height,100dvh)] min-w-0 flex-col overflow-hidden lg:block lg:h-auto lg:min-h-screen lg:overflow-visible ${className}`}
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
