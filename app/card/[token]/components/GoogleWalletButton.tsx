"use client";
import { useState } from "react";

export default function GoogleWalletButton({ token, enabled }: { token: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!enabled) return null;
  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/wallet/google/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Please try again.");
      const url = new URL(data.url);
      if (url.origin !== "https://pay.google.com" || !url.pathname.startsWith("/gp/v/save/")) throw new Error("Invalid Wallet link.");
      window.location.assign(url.href);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally { setBusy(false); }
  }
  return <div className="mx-auto mt-3 text-center">
    <button type="button" onClick={() => void save()} disabled={busy} aria-busy={busy}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
      {busy ? "Preparing your card…" : "Add to Google Wallet"}
    </button>
    {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}
  </div>;
}
