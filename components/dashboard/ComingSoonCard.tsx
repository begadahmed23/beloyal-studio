"use client";

import {
  Gift,
  ReceiptText,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type ComingSoonType =
  | "transactions"
  | "rewards"
  | "settings";

type Props = {
  type: ComingSoonType;
  title: string;
  description: string;
};

const icons: Record<ComingSoonType, LucideIcon> = {
  transactions: ReceiptText,
  rewards: Gift,
  settings: Settings,
};

export default function ComingSoonCard({
  type,
  title,
  description,
}: Props) {
  const { theme } = useCafeTheme();
  const Icon = icons[type];

  return (
    <div
      className="flex min-h-[440px] items-center justify-center border p-8 text-center"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        borderRadius: theme.radiusLarge,
        boxShadow: theme.cardShadow,
      }}
    >
      <div className="max-w-md">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center"
          style={{
            backgroundColor: theme.accentSoft,
            color: theme.accent,
            borderRadius: theme.radiusMedium,
          }}
        >
          <Icon size={24} />
        </div>

        <h2
          className="mt-5 text-2xl font-semibold tracking-tight"
          style={{
            color: theme.textPrimary,
          }}
        >
          {title}
        </h2>

        <p
          className="mt-3 text-sm leading-6"
          style={{
            color: theme.textMuted,
          }}
        >
          {description}
        </p>

        <div
          className="mx-auto mt-6 inline-flex border px-3 py-1.5 text-xs font-medium"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surfaceRaised,
            color: theme.textSecondary,
            borderRadius: "999px",
          }}
        >
          Coming next
        </div>
      </div>
    </div>
  );
}