"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";

import JoinQRCode from "@/components/dashboard/JoinQRCode";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { ActionButton } from "@/components/ui/action-button";

type Location = { id: string; name: string };

export default function StoreLocations() {
  const { t } = useBeLoyalLanguage();
  const { theme } = useCafeTheme();
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/cafe/locations", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data: { locations: Location[] } = await response.json();
        setLocations(data.locations);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load store locations.");
      });
    return () => controller.abort();
  }, [request]);

  async function addLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/cafe/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error();
      const { location }: { location: Location } = await response.json();
      setLocations(current => [...(current ?? []).filter(item => item.id !== location.id), location]
        .sort((first, second) => first.name.localeCompare(second.name)));
      setLocationId(location.id);
      setName("");
    } catch {
      setError("Could not save the store location. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const location = locations?.find(item => item.id === locationId);
  const fieldStyle = { borderColor: theme.border, background: theme.surfaceRaised, color: theme.textPrimary };

  return (
    <section className="space-y-4 rounded-2xl border p-4 sm:p-6"
      style={{ borderColor: theme.border, background: theme.surface, color: theme.textPrimary }}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MapPin size={18} aria-hidden="true" />{t("Store locations")}
      </h2>
      <p className="text-sm" style={{ color: theme.textSecondary }}>
        {t("Give each store a QR and NFC join link. The store appears on the new member’s profile.")}
      </p>
      {locations === null ? (
        error ? <button type="button" className="min-h-11 underline" onClick={() => {
          setError("");
          setRequest(current => current + 1);
        }}>{t("Try again")}</button> : <p role="status" className="text-sm">{t("Loading store locations…")}</p>
      ) : (
        <>
          <form className="flex flex-col items-start gap-2 sm:flex-row sm:items-end" onSubmit={addLocation}>
            <label className="grid w-full gap-1 text-sm sm:max-w-sm">
              {t("Store name")}
              <input className="min-h-11 rounded-xl border px-3" style={fieldStyle}
                value={name} maxLength={80} required disabled={saving} onChange={event => setName(event.target.value)} />
            </label>
            <ActionButton type="submit" icon={<Plus size={16} />} className="min-h-11 rounded-xl px-4 text-sm font-medium disabled:opacity-60"
              style={{ background: theme.accent, color: theme.accentText }} pending={saving} disabled={saving || !name.trim()}>
              {t("Add store")}
            </ActionButton>
          </form>
          {locations.length > 0 && (
            <label className="grid max-w-sm gap-1 text-sm">
              {t("Store QR and NFC link")}
              <select className="min-h-11 rounded-xl border px-3" style={fieldStyle}
                value={locationId} onChange={event => setLocationId(event.target.value)}>
                <option value="">{t("Select a store")}</option>
                {locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          {location && <JoinQRCode key={location.id} location={location} />}
        </>
      )}
      {error && <p role="alert" className="text-sm">{t(error)}</p>}
    </section>
  );
}
