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
  getBusinessTheme,
} from "@/lib/cafe-theme";

export type CafeSettings = {
  id: string;
  name: string;
  slug: string;
  businessType: "CAFE" | "BARBERSHOP";
  logoUrl: string | null;

  rewardTarget: number;
  rewardName: string;
  rewardDescription: string | null;
  eligiblePurchaseDescription: string | null;
  minimumPurchaseAmount: string | null;

  feedbackEnabled: boolean;
  feedbackRewardEnabled: boolean;
  googleReviewUrl: string | null;

  timezone: string;
  birthdayRewardsEnabled: boolean;
  birthdayRewardName: string | null;
  birthdayRewardDescription: string | null;
  birthdayPurchaseRequirement: string | null;
  birthdayValidityDays: number;
  birthdayReminderEnabled: boolean;
  birthdayReminderDaysBefore: number;
  birthdayDayMessageEnabled: boolean;
  birthdayFriendDiscountEnabled: boolean;
  birthdayOneFriendDiscount: number;
  birthdayGroupDiscount: number;

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
  userRole: "CAFE_ADMIN" | "CASHIER";
  accountEmail: string;
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

const KATO_DASHBOARD_THEME: CafeThemeConfig = {
  pageBackground: "#F4F7FA",
  surface: "#FFFFFF",
  surfaceRaised: "#EEF3F7",
  border: "rgba(16, 43, 73, 0.12)",

  textPrimary: "#0A223E",
  textSecondary: "#43536A",
  textMuted: "#7F8DA0",

  accent: "#102B49",
  accentHover: "#16395C",
  accentSoft: "rgba(16, 43, 73, 0.08)",
  accentText: "#FFFFFF",

  success: "#497563",
  warning: "#B48749",
  danger: "#B95E58",

  inputBackground: "#FFFFFF",
  inputBorder: "rgba(16, 43, 73, 0.14)",

  buttonText: "#FFFFFF",
  cardShadow: "0 22px 60px rgba(16, 43, 73, 0.10)",

  radiusLarge: "30px",
  radiusMedium: "18px",
};

function isKatoCafe(cafe: CafeSettings) {
  const normalizedName = cafe.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    cafe.slug.toLowerCase().includes("kato") ||
    normalizedName.includes("kato")
  );
}

const DASHBOARD_REFRESH_AFTER_HIDDEN_MS = 30_000;
const DASHBOARD_REFRESH_THROTTLE_MS = 10_000;

type Props = {
  themeName: CafeThemeName;
  cafe: CafeSettings;
  userRole: "CAFE_ADMIN" | "CASHIER";
  accountEmail: string;
  children: ReactNode;
};

export default function CafeThemeProvider({
  themeName,
  cafe,
  userRole,
  accountEmail,
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

      if (
        now - lastRefreshAtRef.current <
        DASHBOARD_REFRESH_THROTTLE_MS
      ) {
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

        if (
          hiddenAt &&
          Date.now() - hiddenAt >=
            DASHBOARD_REFRESH_AFTER_HIDDEN_MS
        ) {
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
    () =>
      isKatoCafe(currentCafe)
        ? KATO_DASHBOARD_THEME
        : getBusinessTheme(
            previewThemeName,
            currentCafe.businessType,
          ),
    [
      previewThemeName,
      currentCafe,
    ],
  );

  const contextValue = useMemo(
    () => ({
      themeName: previewThemeName,
      userRole,
      accountEmail,
      savedThemeName,
      theme,
      cafe: currentCafe,
      setPreviewTheme,
      resetPreviewTheme,
      applySavedSettings,
    }),
    [
      previewThemeName,
      userRole,
      accountEmail,
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

export function useOptionalCafeTheme() {
  return useContext(CafeThemeContext);
}

export function useCafeTheme() {
  const context = useOptionalCafeTheme();

  if (!context) {
    throw new Error(
      "useCafeTheme must be used inside CafeThemeProvider",
    );
  }

  return context;
}
