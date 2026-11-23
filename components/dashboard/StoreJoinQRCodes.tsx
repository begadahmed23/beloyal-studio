"use client";

import { useEffect, useState } from "react";

import JoinQRCode from "@/components/dashboard/JoinQRCode";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { GOURMEAL_MAIN_STORE, isGourmeal } from "@/lib/business/gourmeal";

type Location = { id: string; name: string };

export default function StoreJoinQRCodes() {
  const { t } = useBeLoyalLanguage();
  const { cafe, theme } = useCafeTheme();
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/cafe/locations", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Could not load store locations.");
        const body: { locations: Location[] } = await response.json();
        if (!controller.signal.aborted) setLocations(body.locations);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [version]);

  if (error) {
    return <div className="flex flex-wrap items-center gap-3 text-sm" role="alert">
      {t("Could not load store locations.")}
      <button type="button" className="min-h-11 underline" onClick={() => {
        setError(false);
        setVersion(value => value + 1);
      }}>{t("Try again")}</button>
    </div>;
  }
  if (!locations) return <p role="status" className="text-sm">{t("Loading store locations…")}</p>;

  const mainStore = isGourmeal(cafe)
    ? locations.find(item => item.name.toLowerCase() === GOURMEAL_MAIN_STORE.toLowerCase())
    : undefined;
  const location = locations.find(item => item.id === locationId) ?? mainStore ?? locations[0];

  return (
    <div className="space-y-3">
      {locations.length > 1 && (
        <label className="grid max-w-sm gap-1 text-sm font-medium">
          {t("Store QR and NFC link")}
          <select className="min-h-11 rounded-xl border px-3"
            style={{ borderColor: theme.border, background: theme.surface, color: theme.textPrimary }}
            value={location?.id ?? ""}
            onChange={event => setLocationId(event.target.value)}>
            {locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      )}
      <JoinQRCode key={location?.id ?? "general"} location={location} />
    </div>
  );
}
