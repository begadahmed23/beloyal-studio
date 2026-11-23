"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";

import JoinQRCode from "@/components/dashboard/JoinQRCode";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { ActionButton } from "@/components/ui/action-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Location = { id: string; name: string };

export default function StoreLocations() {
  const { t } = useBeLoyalLanguage();
  const { theme } = useCafeTheme();
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
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

  async function removeLocation() {
    if (!location || removing) return;
    setRemoving(true);
    setRemoveError("");
    try {
      const response = await fetch("/api/cafe/locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: location.id }),
      });
      if (!response.ok && response.status !== 404) throw new Error();
      setConfirmRemoval(false);
      setLocations(current => current?.filter(item => item.id !== location.id) ?? null);
      setLocationId(current => current === location.id ? "" : current);
    } catch {
      setRemoveError("Could not remove the store. Try again.");
    } finally {
      setRemoving(false);
    }
  }

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
          {location && (
            <>
              <JoinQRCode key={location.id} location={location} />
              <AlertDialog open={confirmRemoval} onOpenChange={open => {
                if (removing) return;
                setRemoveError("");
                setConfirmRemoval(open);
              }}>
                <AlertDialogTrigger className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium"
                  disabled={saving} style={{ color: theme.danger, borderColor: theme.border }}>
                  <Trash2 size={16} aria-hidden="true" />{t("Remove store")}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("Remove store")} · <bdi>{location.name}</bdi></AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("This removes the store from active use. Existing member and stamp history is kept. Add the same store name again to restore it.")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {removeError && <p role="alert" className="text-sm" style={{ color: theme.danger }}>{t(removeError)}</p>}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={removing}>{t("Cancel")}</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={removing} onClick={() => void removeLocation()}>
                      {t(removing ? "Removing…" : "Remove store")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </>
      )}
      {error && <p role="alert" className="text-sm">{t(error)}</p>}
    </section>
  );
}
