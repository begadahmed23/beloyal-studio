"use client";

import { Check } from "lucide-react";

import { getBusinessTheme, getBusinessThemeOptions, type CafeThemeName } from "@/lib/cafe-theme";

type Props = {
  value: CafeThemeName;
  onChange: (value: CafeThemeName) => void;
  disabled?: boolean;
};

export default function BusinessThemeGallery({ value, onChange, disabled }: Props) {
  return (
    <div className="@container min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        role="group"
        aria-label="Theme palettes"
        className="grid grid-cols-1 gap-3 @min-[17rem]:grid-cols-2 @min-[38rem]:grid-cols-3"
      >
        {getBusinessThemeOptions().map((option) => {
          const palette = getBusinessTheme(option.value);
          const selected = value === option.value;
          const swatches = [palette.surface, palette.surfaceRaised, palette.border, palette.accentSoft, palette.accent];

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-description={option.description}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className="group relative flex min-h-28 min-w-0 flex-col justify-between gap-4 rounded-xl border p-3 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 @min-[38rem]:min-h-36 @min-[38rem]:p-4"
              style={{
                color: palette.textPrimary,
                backgroundColor: palette.pageBackground,
                borderColor: selected ? palette.accent : palette.border,
                outlineColor: palette.accent,
                boxShadow: selected ? `inset 0 0 0 1px ${palette.accent}` : palette.cardShadow,
              }}
            >
              <span className="flex items-start justify-between gap-1.5" aria-hidden="true">
                <span
                  className="grid size-5 shrink-0 place-items-center rounded-full"
                  style={selected ? { backgroundColor: palette.accent, color: palette.accentText } : undefined}
                >
                  {selected && <Check size={13} strokeWidth={2.5} />}
                </span>
                <span className="flex shrink-0 -space-x-2 group-hover:-space-x-1 motion-safe:[&>span]:transition-[margin] motion-safe:[&>span]:duration-150">
                  {swatches.map((color, index) => (
                    <span
                      key={index}
                      className="size-5 shrink-0 rounded-full border-2 @min-[38rem]:size-7"
                      style={{ backgroundColor: color, borderColor: palette.pageBackground }}
                    />
                  ))}
                </span>
              </span>
              <span className="text-sm font-semibold tracking-tight @min-[38rem]:text-lg">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
