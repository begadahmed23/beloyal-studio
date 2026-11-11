"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";

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
    <div className="mx-auto mt-3 w-full text-center">
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        aria-label="Add to Apple Wallet"
        aria-busy={busy}
        className="inline-flex items-center justify-center rounded-lg border-0 bg-transparent p-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-wait"
      >
        <Image
          src="/wallet/add-to-apple-wallet.svg"
          alt="Add to Apple Wallet"
          width={111}
          height={35}
          unoptimized
          className="h-11 w-auto"
        />
      </button>
      <span role="status" className="sr-only">{busy ? "Preparing your Wallet card…" : ""}</span>
      {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}
    </div>
  );
}
