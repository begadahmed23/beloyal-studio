"use client";
import { Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WalletButtonStatus, { WalletButtonProgress } from "./WalletButtonStatus";

export default function GoogleWalletButton({ token, enabled }: { token: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const requestInFlight = useRef(false);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    function resume(event: PageTransitionEvent) {
      if (event.persisted) {
        requestInFlight.current = false;
        setBusy(false);
        setOpening(false);
      }
    }
    window.addEventListener("pageshow", resume);
    return () => window.removeEventListener("pageshow", resume);
  }, []);
  if (!enabled) return null;
  async function save() {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
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
      requestInFlight.current = false;
      setBusy(false);
    }
  }
  return <div className="mx-auto mt-3 text-center">
    <div className="inline-flex min-h-[54px] items-center">
      <button type="button" onClick={() => void save()} disabled={busy} aria-busy={busy} aria-label="Add to Google Wallet"
        className="relative inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[7px] border border-[#a6a6a6] bg-black px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6a6a6] disabled:cursor-wait">
        <Wallet size={18} strokeWidth={1.65} aria-hidden="true" className={busy ? "invisible" : undefined} />
        <span className={busy ? "invisible" : undefined}>Add to Google Wallet</span>
        {busy && <WalletButtonProgress />}
      </button>
    </div>
    <WalletButtonStatus busy={busy} error={error}
      message={opening ? "Opening Google Wallet…" : busy ? "Preparing Google Wallet…" : ""} />
  </div>;
}
