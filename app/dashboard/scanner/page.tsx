"use client";

import {
  CheckCircle2,
  Gift,
  LoaderCircle,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ScannerStatus =
  | "waiting"
  | "processing"
  | "success"
  | "reward"
  | "error";

type ScanResult = {
  customer: {
    id: string;
    memberNumber: string;
    publicToken: string;
    name: string;
    stamps: number;
  };
  previousStamps: number;
  stamps: number;
  rewardTarget: number;
  rewardEarned: boolean;
  rewardName: string;
  message: string;
};

const RESET_DELAY = 3000;
const SAME_CUSTOMER_COOLDOWN = 5000;
const AUTO_SCAN_DELAY = 1000;
function playSuccessSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(
      0.12,
      audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.18
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);

    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    console.error("Scanner sound error:", error);
  }
}
export default function ScannerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoScanTimeoutRef =
  useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastScanRef = useRef<{
  token: string;
  time: number;
} | null>(null);
  const resetTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const [scanValue, setScanValue] = useState("");
  const [status, setStatus] =
    useState<ScannerStatus>("waiting");

  const [result, setResult] =
    useState<ScanResult | null>(null);

  const [error, setError] = useState("");

  function focusScannerInput() {
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function resetScanner() {
    setScanValue("");
    setResult(null);
    setError("");
    setStatus("waiting");
    focusScannerInput();
  }

  useEffect(() => {
    focusScannerInput();

    function keepScannerFocused(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (
        target instanceof HTMLButtonElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      focusScannerInput();
    }

    document.addEventListener(
      "click",
      keepScannerFocused
    );

   return () => {
  document.removeEventListener(
    "click",
    keepScannerFocused
  );

  if (resetTimeoutRef.current) {
    clearTimeout(resetTimeoutRef.current);
  }

  if (autoScanTimeoutRef.current) {
    clearTimeout(autoScanTimeoutRef.current);
  }
};
  }, []);
  function handleScannerChange(value: string) {
  setScanValue(value);

  if (autoScanTimeoutRef.current) {
    clearTimeout(autoScanTimeoutRef.current);
  }

  if (!value.trim() || status === "processing") {
    return;
  }

  autoScanTimeoutRef.current = setTimeout(() => {
    submitScan(value);
  }, AUTO_SCAN_DELAY);
}
  async function submitScan(value: string) {
    const cleanedValue = value.trim();
    const now = Date.now();

if (
  lastScanRef.current &&
  lastScanRef.current.token === cleanedValue &&
  now - lastScanRef.current.time <
    SAME_CUSTOMER_COOLDOWN
) {
  setScanValue("");
  focusScannerInput();
  return;
}
if (autoScanTimeoutRef.current) {
    clearTimeout(autoScanTimeoutRef.current);
    autoScanTimeoutRef.current = null;
  }
    if (!cleanedValue || status === "processing") {
      return;
    }

    if (!cleanedValue.startsWith("BL:")) {
      setStatus("error");
      setError(
        "This is not a valid BeLoyal member code."
      );
      setScanValue("");

      resetTimeoutRef.current = setTimeout(
        resetScanner,
        RESET_DELAY
      );

      return;
    }

    try {
      setStatus("processing");
      setError("");
      setResult(null);

      const response = await fetch(
        "/api/customers/stamp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: cleanedValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "The stamp could not be added."
        );
      }

      const scanResult = data as ScanResult;

lastScanRef.current = {
  token: cleanedValue,
  time: Date.now(),
};

playSuccessSound();
      setResult(scanResult);
      setStatus(
        scanResult.rewardEarned
          ? "reward"
          : "success"
      );

      setScanValue("");

      resetTimeoutRef.current = setTimeout(
        resetScanner,
        RESET_DELAY
      );
    } catch (error) {
      console.error("Scanner error:", error);

      setStatus("error");
      setError(
        error instanceof Error
          ? error.message
          : "The stamp could not be added."
      );

      setScanValue("");

      resetTimeoutRef.current = setTimeout(
        resetScanner,
        RESET_DELAY
      );
    }
  }

  function handleSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (autoScanTimeoutRef.current) {
    clearTimeout(autoScanTimeoutRef.current);
    autoScanTimeoutRef.current = null;
  }

  submitScan(scanValue);
}

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div>
        <p className="text-sm opacity-60">
          Counter scanner
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Scan customer
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
          Scan the customer&apos;s Apple Wallet pass or
          BeLoyal QR code. One scan automatically adds
          one stamp.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8"
      >
        <input
          ref={inputRef}
          value={scanValue}
          onChange={(event) =>
        handleScannerChange(event.target.value)
            }
          disabled={status === "processing"}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="USB scanner input"
          className="absolute left-[-9999px] h-px w-px opacity-0"
        />

        <section className="relative overflow-hidden rounded-[30px] border p-6 shadow-sm sm:p-10">
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current opacity-[0.05] blur-3xl" />

          <div className="relative flex min-h-[410px] flex-col items-center justify-center text-center">
            {status === "waiting" && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border bg-current/[0.04]">
                  <ScanLine size={42} />
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  Ready to scan
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 opacity-60">
                  The USB scanner is active. Ask the
                  customer to open their Wallet pass or
                  tap Show Scan Code.
                </p>

                <div className="mt-8 flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />

                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>

                  Waiting for customer
                </div>
              </>
            )}

            {status === "processing" && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border bg-current/[0.04]">
                  <LoaderCircle
                    size={42}
                    className="animate-spin"
                  />
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  Adding stamp
                </h3>

                <p className="mt-3 text-sm opacity-60">
                  Please wait a moment.
                </p>
              </>
            )}

            {status === "success" && result && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 size={46} />
                </div>

                <p className="mt-7 text-sm font-medium text-emerald-500">
                  Stamp added
                </p>

                <h3 className="mt-2 text-3xl font-semibold">
                  {result.customer.name}
                </h3>

                <p className="mt-3 text-base opacity-65">
                  {result.stamps} /{" "}
                  {result.rewardTarget} stamps
                </p>

                <div className="mt-7 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-current/10">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${
                        (result.stamps /
                          result.rewardTarget) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-7 text-xs opacity-45">
                  Ready for the next customer in a few
                  seconds.
                </p>
              </>
            )}

            {status === "reward" && result && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-500/15 text-amber-500">
                  <Gift size={46} />
                </div>

                <p className="mt-7 text-sm font-medium text-amber-500">
                  Reward earned
                </p>

                <h3 className="mt-2 text-3xl font-semibold">
                  {result.customer.name}
                </h3>

                <p className="mt-3 text-lg font-medium">
                  {result.rewardName}
                </p>

                <p className="mt-3 max-w-md text-sm leading-6 opacity-60">
                  The final stamp was added and the
                  customer&apos;s new card has started at
                  0 / {result.rewardTarget}.
                </p>

                <p className="mt-7 text-xs opacity-45">
                  Ready for the next customer in a few
                  seconds.
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-red-500/15 text-red-500">
                  <TriangleAlert size={44} />
                </div>

                <p className="mt-7 text-sm font-medium text-red-500">
                  Scan failed
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  Unable to add stamp
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 opacity-60">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={resetScanner}
                  className="mt-7 h-11 rounded-xl border px-5 text-sm font-medium transition hover:opacity-75"
                >
                  Scan again
                </button>
              </>
            )}
          </div>
        </section>
      </form>

      <div className="mt-5 rounded-2xl border p-4">
        <p className="text-sm font-medium">
          USB scanner setup
        </p>

        <p className="mt-2 text-xs leading-5 opacity-60">
          Configure the scanner to send Enter after each
          QR code. Keep this page open while serving
          customers.
        </p>
      </div>
    </div>
  );
}