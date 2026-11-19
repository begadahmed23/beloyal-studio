"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import WalletButtonStatus from "./WalletButtonStatus";

const subscribe = () => () => {};
const getSupported = () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
const getServerSupported = () => false;

export default function AppleWalletButton({ token, enabled }: { token: string; enabled: boolean }) {
  const supported = useSyncExternalStore(subscribe, getSupported, getServerSupported);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);
  if (!enabled || !supported) return null;

  async function download() {
    setBusy(true);
    setError("");
    setOpened(false);
    try {
      const response = await fetch(`/api/wallet/apple/${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
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
      setOpened(true);
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (caught) {
      setError(caught instanceof Error && caught.name !== "TimeoutError" ? caught.message : "Apple Wallet took too long. Try again.");
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
      <WalletButtonStatus busy={busy} error={error}
        message={busy ? "Preparing Apple Wallet…" : opened ? "Tap Add in Apple Wallet." : ""} />
    </div>
  );
}
