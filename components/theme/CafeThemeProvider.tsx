"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  CafeThemeConfig,
  CafeThemeName,
  getCafeTheme,
} from "@/lib/cafe-theme";

export type CafeSettings = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
  minimumPurchaseAmount: string | null;

  googleReviewUrl: string | null;

  subscriptionStatus:
    | "TRIAL"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED"
    | "CANCELLED";

  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;

  monthlyPrice: string | null;
  isActive: boolean;
};

type CafeThemeContextValue = {
  themeName: CafeThemeName;
  savedThemeName: CafeThemeName;
  theme: CafeThemeConfig;
  cafe: CafeSettings;

  setPreviewTheme: (themeName: CafeThemeName) => void;
  resetPreviewTheme: () => void;

  applySavedSettings: (
    cafe: CafeSettings,
    themeName: CafeThemeName,
  ) => void;
};

const CafeThemeContext =
  createContext<CafeThemeContextValue | null>(null);

type Props = {
  themeName: CafeThemeName;
  cafe: CafeSettings;
  children: ReactNode;
};

export default function CafeThemeProvider({
  themeName,
  cafe,
  children,
}: Props) {
  const router = useRouter();

  const hiddenAtRef = useRef<number | null>(null);
  const lastRefreshAtRef = useRef(0);

  const [currentCafe, setCurrentCafe] =
    useState<CafeSettings>(cafe);

  const [savedThemeName, setSavedThemeName] =
    useState<CafeThemeName>(themeName);

  const [previewThemeName, setPreviewThemeName] =
    useState<CafeThemeName>(themeName);

  useEffect(() => {
    setCurrentCafe(cafe);
  }, [cafe]);

  useEffect(() => {
    setSavedThemeName(themeName);
    setPreviewThemeName(themeName);
  }, [themeName]);

  useEffect(() => {
    const refreshAppData = () => {
      const now = Date.now();

      if (now - lastRefreshAtRef.current < 1000) {
        return;
      }

      lastRefreshAtRef.current = now;
      router.refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState === "visible") {
        const hiddenAt = hiddenAtRef.current;

        hiddenAtRef.current = null;

        if (hiddenAt && Date.now() - hiddenAt >= 1000) {
          refreshAppData();
        }
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshAppData();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [router]);

  const setPreviewTheme = useCallback(
    (newThemeName: CafeThemeName) => {
      setPreviewThemeName(newThemeName);
    },
    [],
  );

  const resetPreviewTheme = useCallback(() => {
    setPreviewThemeName(savedThemeName);
  }, [savedThemeName]);

  const applySavedSettings = useCallback(
    (
      updatedCafe: CafeSettings,
      updatedThemeName: CafeThemeName,
    ) => {
      setCurrentCafe(updatedCafe);
      setSavedThemeName(updatedThemeName);
      setPreviewThemeName(updatedThemeName);
    },
    [],
  );

  const theme = useMemo(
    () => getCafeTheme(previewThemeName),
    [previewThemeName],
  );

  const contextValue = useMemo(
    () => ({
      themeName: previewThemeName,
      savedThemeName,
      theme,
      cafe: currentCafe,
      setPreviewTheme,
      resetPreviewTheme,
      applySavedSettings,
    }),
    [
      previewThemeName,
      savedThemeName,
      theme,
      currentCafe,
      setPreviewTheme,
      resetPreviewTheme,
      applySavedSettings,
    ],
  );

  return (
    <CafeThemeContext.Provider value={contextValue}>
      {children}
    </CafeThemeContext.Provider>
  );
}

export function useCafeTheme() {
  const context = useContext(CafeThemeContext);

  if (!context) {
    throw new Error(
      "useCafeTheme must be used inside CafeThemeProvider.",
    );
  }

  return context;
}