"use client";

import { MessageCircle, Star } from "lucide-react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { SlidingSelection } from "@/components/ui/sliding-selection";

const options = [
  { value: "ratings", label: "Ratings", icon: Star },
  { value: "comments", label: "Comments", icon: MessageCircle },
] as const;

type FeedbackTab = typeof options[number]["value"];

export default function FeedbackTabs({
  value,
  onChange,
  counts,
}: {
  value: FeedbackTab;
  onChange: (tab: FeedbackTab) => void;
  counts?: Record<FeedbackTab, number>;
}) {
  const { theme } = useCafeTheme();

  return (
    <SlidingSelection
      value={value}
      indicatorColor={theme.accentSoft}
      className="grid w-full grid-cols-2 gap-1 border p-1 sm:w-auto sm:min-w-60"
      role="group"
      aria-label="Feedback views"
      style={{ borderColor: theme.border, backgroundColor: theme.surfaceRaised, borderRadius: theme.radiusMedium }}
    >
      {options.map(({ value: tab, label, icon: Icon }) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={active}
            data-selection={active ? "active" : undefined}
            onClick={() => onChange(tab)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
            style={{ color: active ? theme.accent : theme.textSecondary, outlineColor: theme.accent }}
          >
            <Icon size={15} className="shrink-0" aria-hidden="true" />
            <span>{counts ? `${label} (${counts[tab]})` : label}</span>
          </button>
        );
      })}
    </SlidingSelection>
  );
}
