"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSupported = () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
const getServerSupported = () => false;

export default function AppleWalletButton({ token, enabled }: { token: string; enabled: boolean }) {
  const supported = useSyncExternalStore(subscribe, getSupported, getServerSupported);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!enabled || !supported) return null;

  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/wallet/apple/${encodeURIComponent(token)}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Could not create your Wallet card.");
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "BeLoyal.pkpass";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mb-6 mt-4 w-full max-w-sm px-4 text-center">
      <button type="button" onClick={() => void download()} disabled={busy}
        className="min-h-12 rounded-xl border border-white/30 bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Preparing your card…" : "Add to Apple Wallet"}
      </button>
      <p className="mt-2 text-xs opacity-70">Keep your loyalty card and QR in Apple Wallet.</p>
      {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}
    </div>
  );
}
