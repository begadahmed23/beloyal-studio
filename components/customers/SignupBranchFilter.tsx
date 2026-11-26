"use client";

import { useEffect, useState } from "react";

import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { isGourmeal } from "@/lib/business/gourmeal";

export default function SignupBranchFilter({ value, onChange }: { value: string; onChange: (branch: string) => void }) {
  const { t } = useBeLoyalLanguage();
  const { cafe, theme } = useCafeTheme();
  const activeBranchesOnly = isGourmeal(cafe);
  const [result, setResult] = useState<{ cafeId: string; names: string[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = activeBranchesOnly ? "/api/cafe/locations" : "/api/cafe/locations?includeArchived=1";
    void fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) return;
        const body: { locations: { name: string }[] } = await response.json();
        if (!controller.signal.aborted) setResult({ cafeId: cafe.id, names: body.locations.map(location => location.name) });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [cafe.id, activeBranchesOnly]);

  if (result?.cafeId !== cafe.id || (!activeBranchesOnly && !result.names.length)) return null;

  return (
    <label className="flex min-h-11 min-w-0 items-center gap-2 border px-3 text-xs font-medium" style={{
      borderColor: theme.inputBorder, backgroundColor: theme.inputBackground,
      borderRadius: theme.radiusMedium, color: theme.textSecondary,
    }}>
      <span className="shrink-0">{t("Signup branch")}</span>
      <select value={value} onChange={event => onChange(event.target.value)}
        className="min-h-11 min-w-0 flex-1 bg-transparent text-base sm:text-sm" style={{ color: theme.textPrimary }}>
        <option value="">{t("All branches")}</option>
        {result.names.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>
  );
}
