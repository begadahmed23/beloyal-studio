"use client";

import { Check } from "lucide-react";
import { dashboardThemeOptions, getDashboardTheme, type CafeThemeName } from "@/lib/cafe-theme";

export default function ThemeGallery({ value, onChange, disabled }: {
  value: string;
  onChange: (theme: CafeThemeName) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {dashboardThemeOptions.map((option) => {
        const palette = getDashboardTheme(option.value);
        const selected = value === option.value;
        return (
          <button key={option.value} type="button" disabled={disabled}
            aria-pressed={selected} aria-description={option.description} onClick={() => onChange(option.value)}
            className="min-w-0 touch-manipulation rounded-2xl border p-4 text-start transition-opacity active:opacity-75 disabled:opacity-60"
            style={{
              backgroundColor: palette.pageBackground, color: palette.textPrimary,
              borderColor: selected ? palette.accent : palette.border,
              boxShadow: selected ? `inset 0 0 0 1px ${palette.accent}` : undefined,
            }}>
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{option.label}</span>
              {selected && <Check size={16} className="shrink-0" aria-hidden />}
            </span>
            <span aria-hidden className="mt-3 flex -space-x-1.5 rtl:space-x-reverse">
              {[palette.pageBackground, palette.surface, palette.border, palette.textPrimary, palette.accent].map((color, index) => (
                <span key={index} className="size-6 rounded-full border" style={{ backgroundColor: color, borderColor: palette.surfaceRaised }} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
