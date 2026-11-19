"use client";
import { useEffect, useState } from "react";
import WalletButtonStatus from "./WalletButtonStatus";

export default function GoogleWalletButton({ token, enabled }: { token: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    function resume(event: PageTransitionEvent) {
      if (event.persisted) {
        setBusy(false);
        setOpening(false);
      }
    }
    window.addEventListener("pageshow", resume);
    return () => window.removeEventListener("pageshow", resume);
  }, []);
  if (!enabled) return null;
  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/wallet/google/${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(45000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Please try again.");
      const url = new URL(data.url);
      if (url.origin !== "https://pay.google.com" || !url.pathname.startsWith("/gp/v/save/")) throw new Error("Invalid Wallet link.");
      window.location.assign(url.href);
      setOpening(true);
    } catch (caught) {
      setError(caught instanceof Error && caught.name !== "TimeoutError" ? caught.message : "Google Wallet took too long. Try again.");
      setBusy(false);
    }
  }
  return <div className="mx-auto mt-3 text-center">
    <button type="button" onClick={() => void save()} disabled={busy} aria-busy={busy}
      aria-label="Add to Google Wallet"
      className="inline-flex min-h-12 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
      <img src="/wallet/add-to-google-wallet.svg" alt="Add to Google Wallet" className="h-12 w-auto" />
    </button>
    <WalletButtonStatus busy={busy} error={error}
      message={opening ? "Opening Google Wallet…" : busy ? "Preparing Google Wallet…" : ""} />
  </div>;
}
