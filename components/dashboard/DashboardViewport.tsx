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
    if (!node) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        const editing = active instanceof HTMLElement && node.contains(active) &&
          (active.matches('textarea, select, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="hidden"])') || active.isContentEditable);
        node.toggleAttribute("data-dashboard-editing", editing);
        const keyboardVisible = viewport && viewport.scale === 1 && window.innerHeight - viewport.height > 120;
        node.toggleAttribute("data-dashboard-keyboard", Boolean(keyboardVisible));
        if (viewport && viewport.scale === 1 && keyboardVisible) {
          node.style.setProperty("--dashboard-visible-height", `${Math.round(viewport.height)}px`);
        } else {
          node.style.removeProperty("--dashboard-visible-height");
        }
      });
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
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
          [data-dashboard-viewport][data-dashboard-editing] nav[data-dashboard-mobile-nav],
          [data-dashboard-viewport][data-dashboard-keyboard] nav[data-dashboard-mobile-nav] { display: none; }
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
