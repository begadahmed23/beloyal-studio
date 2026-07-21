"use client";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Gift,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type ScannerStatus =
  | "starting"
  | "scanning"
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
  stamps: number;
  rewardTarget: number;
  rewardEarned: boolean;
  rewardName: string;
  message: string;
};

const SCANNER_ELEMENT_ID = "phone-qr-reader";
const SAME_CUSTOMER_COOLDOWN = 5000;
const RESULT_DISPLAY_TIME = 1500;

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

export default function PhoneScannerPage() {
  const scannerRef = useRef<
    import("html5-qrcode").Html5Qrcode | null
  >(null);

  const processingRef = useRef(false);

  const lastScanRef = useRef<{
    token: string;
    time: number;
  } | null>(null);

  const resetTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] =
    useState<ScannerStatus>("starting");

  const [result, setResult] =
    useState<ScanResult | null>(null);

  const [error, setError] = useState("");

  const processScan = useCallback(
    async (decodedText: string) => {
      const cleanedValue = decodedText.trim();
      const now = Date.now();

      if (processingRef.current) {
        return;
      }

      if (!cleanedValue.startsWith("BL:")) {
        setError(
          "This QR code is not a valid BeLoyal member code."
        );
        return;
      }

      if (
        lastScanRef.current &&
        lastScanRef.current.token === cleanedValue &&
        now - lastScanRef.current.time <
          SAME_CUSTOMER_COOLDOWN
      ) {
        return;
      }

      processingRef.current = true;
      setStatus("processing");
      setError("");
      setResult(null);

      try {
        await scannerRef.current?.pause(true);

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

        setResult(scanResult);

        setStatus(
          scanResult.rewardEarned
            ? "reward"
            : "success"
        );

        playSuccessSound();

        resetTimeoutRef.current = setTimeout(
          async () => {
            setResult(null);
            setError("");
            setStatus("scanning");
            processingRef.current = false;

            try {
              scannerRef.current?.resume();
            } catch (resumeError) {
              console.error(
                "Resume scanner error:",
                resumeError
              );
            }
          },
          RESULT_DISPLAY_TIME
        );
      } catch (scanError) {
        console.error(
          "Phone scanner processing error:",
          scanError
        );

        setStatus("error");

        setError(
          scanError instanceof Error
            ? scanError.message
            : "The stamp could not be added."
        );

        resetTimeoutRef.current = setTimeout(
          () => {
            setStatus("scanning");
            setError("");
            processingRef.current = false;

            try {
              scannerRef.current?.resume();
            } catch (resumeError) {
              console.error(
                "Resume scanner error:",
                resumeError
              );
            }
          },
          RESULT_DISPLAY_TIME
        );
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      try {
        const {
          Html5Qrcode,
          Html5QrcodeSupportedFormats,
        } = await import("html5-qrcode");

        if (!isMounted) {
          return;
        }

        const scanner = new Html5Qrcode(
  SCANNER_ELEMENT_ID,
  {
    verbose: false,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.QR_CODE,
    ],
    useBarCodeDetectorIfSupported: true,
  }
);

        scannerRef.current = scanner;

       await scanner.start(
  {
    facingMode: "environment",
  },
          {
            fps: 10,
            qrbox: (
              viewfinderWidth,
              viewfinderHeight
            ) => {
              const smallestSide = Math.min(
                viewfinderWidth,
                viewfinderHeight
              );

              const boxSize = Math.floor(
                smallestSide * 0.72
              );

              return {
                width: boxSize,
                height: boxSize,
              };
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            void processScan(decodedText);
          },
          () => {
            // Normal scan misses are ignored.
          }
        );

        if (isMounted) {
          setStatus("scanning");
        }
      } catch (scannerError) {
        console.error(
          "Camera scanner start error:",
          scannerError
        );

        if (isMounted) {
          setStatus("error");
          setError(
            "Camera access failed. Allow camera permission and open this page using HTTPS."
          );
        }
      }
    }

    void startScanner();

    return () => {
      isMounted = false;

      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }

      const scanner = scannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            scanner.clear();
          });
      }
    };
  }, [processScan]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Link
        href="/dashboard/scanner"
        className="inline-flex items-center gap-2 text-sm opacity-60 transition hover:opacity-100"
      >
        <ArrowLeft size={16} />
        Back to scanner
      </Link>

      <div className="mt-6">
        <p className="text-sm opacity-60">
          Mobile camera
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Scan customer
        </h2>

        <p className="mt-2 text-sm leading-6 opacity-60">
          Point the phone camera at the customer&apos;s
          BeLoyal QR code.
        </p>
      </div>

      <section className="mt-8 overflow-hidden rounded-[28px] border shadow-sm">
        <div className="relative min-h-[420px] bg-black">
          <div
            id={SCANNER_ELEMENT_ID}
            className="min-h-[420px] w-full"
          />

          {status !== "scanning" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6 text-center text-white">
              {status === "starting" && (
                <div>
                  <LoaderCircle
                    size={42}
                    className="mx-auto animate-spin"
                  />

                  <h3 className="mt-5 text-xl font-semibold">
                    Starting camera
                  </h3>

                  <p className="mt-2 text-sm text-white/60">
                    Allow camera permission when asked.
                  </p>
                </div>
              )}

              {status === "processing" && (
                <div>
                  <LoaderCircle
                    size={42}
                    className="mx-auto animate-spin"
                  />

                  <h3 className="mt-5 text-xl font-semibold">
                    Adding stamp
                  </h3>
                </div>
              )}

              {status === "success" && result && (
                <div>
                  <CheckCircle2
                    size={54}
                    className="mx-auto text-emerald-400"
                  />

                  <p className="mt-5 text-sm font-medium text-emerald-400">
                    Stamp added
                  </p>

                  <h3 className="mt-2 text-3xl font-semibold">
                    {result.customer.name}
                  </h3>

                  <p className="mt-3 text-lg text-white/70">
                    {result.stamps} /{" "}
                    {result.rewardTarget} stamps
                  </p>
                </div>
              )}

              {status === "reward" && result && (
                <div>
                  <Gift
                    size={54}
                    className="mx-auto text-amber-400"
                  />

                  <p className="mt-5 text-sm font-medium text-amber-400">
                    Reward earned
                  </p>

                  <h3 className="mt-2 text-3xl font-semibold">
                    {result.customer.name}
                  </h3>

                  <p className="mt-3 text-lg text-white/70">
                    {result.rewardName}
                  </p>
                </div>
              )}

              {status === "error" && (
                <div>
                  <TriangleAlert
                    size={50}
                    className="mx-auto text-red-400"
                  />

                  <h3 className="mt-5 text-xl font-semibold">
                    Scanner unavailable
                  </h3>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      window.location.reload()
                    }
                    className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "scanning" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                <Camera size={14} />
                Ready to scan
              </div>
            </div>
          )}
        </div>
      </section>

      <p className="mt-4 text-center text-xs leading-5 opacity-50">
        The same customer cannot receive another stamp
        from this scanner for five seconds. Different
        customers can scan immediately.
      </p>
    </div>
  );
}