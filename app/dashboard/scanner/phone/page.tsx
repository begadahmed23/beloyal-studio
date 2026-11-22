"use client";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

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
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import PurchaseConfirmation from "@/components/dashboard/PurchaseConfirmation";
import { isSpendingTrackingEnabled } from "@/lib/business/spending-tracking";

type ScannerStatus =
  | "starting"
  | "scanning"
  | "confirm"
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
  stamps?: number;
  rewardTarget: number;
  rewardReady: boolean;
  rewardName: string;
  message: string;
};

const SCANNER_ELEMENT_ID = "phone-qr-reader";
const SAME_CUSTOMER_COOLDOWN = 5000;
const RESULT_DISPLAY_TIME = 7000; // 7 seconds

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
  const { t } = useBeLoyalLanguage();
  const { cafe, theme } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const spendingEnabled = isSpendingTrackingEnabled(cafe);
  const personLabel = isBarbershop ? "client" : "customer";
  const scannerRef = useRef<
    import("html5-qrcode").Html5Qrcode | null
  >(null);

  const processingRef = useRef(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

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
    async (decodedText: string, confirmed = false, amount: number | null = null) => {
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

      if (spendingEnabled && !confirmed) {
        processingRef.current = true;
        setPendingToken(cleanedValue);
        setStatus("confirm");
        try { await scannerRef.current?.pause(true); } catch (error) { console.error("Pause scanner", error); }
        return;
      }
      processingRef.current = true;
      setPendingToken(null);
      setStatus("processing");
      setError("");
      setResult(null);

      try {
        if (!confirmed) await scannerRef.current?.pause(true);

        const response = await fetch(
          "/api/customers/stamp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: cleanedValue,
              ...(spendingEnabled ? { purchaseAmount: amount } : {}),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `The ${isBarbershop ? "visit" : "stamp"} could not be recorded.`
          );
        }

        const scanResult = data as ScanResult;

        lastScanRef.current = {
          token: cleanedValue,
          time: Date.now(),
        };

        setResult(scanResult);

        setStatus(
          scanResult.rewardReady
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
            : `The ${isBarbershop ? "visit" : "stamp"} could not be recorded.`
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
    [isBarbershop, spendingEnabled]
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

        const scannerConfig = {
          fps: 10,
          qrbox: (
            viewfinderWidth: number,
            viewfinderHeight: number
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
        };

        const onScanSuccess = (decodedText: string) => {
          void processScan(decodedText);
        };

        const onScanFailure = () => {
          // Normal scan misses are ignored.
        };

        try {
          await scanner.start(
            {
              facingMode: "environment",
            },
            scannerConfig,
            onScanSuccess,
            onScanFailure
          );
        } catch (preferredCameraError) {
          console.warn(
            "Preferred rear camera could not start. Falling back to available cameras.",
            preferredCameraError
          );

          const cameras =
            await Html5Qrcode.getCameras();

          if (!cameras.length) {
            throw preferredCameraError;
          }

          const preferredCamera =
            cameras.find((camera) =>
              /back|rear|environment|world/i.test(
                camera.label
              )
            ) ?? cameras[0];

          await scanner.start(
            preferredCamera.id,
            scannerConfig,
            onScanSuccess,
            onScanFailure
          );
        }

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

          if (
            typeof window !== "undefined" &&
            !window.isSecureContext
          ) {
            setError(
              "Camera scanning requires a secure HTTPS page."
            );
          } else if (
            typeof navigator !== "undefined" &&
            !navigator.mediaDevices?.getUserMedia
          ) {
            setError(
              "This browser does not provide camera access. Try the latest Chrome, Safari, or Samsung Internet."
            );
          } else {
            setError(
              "Camera access failed. Allow camera permission, then try again. If your browser blocks the camera, open this page in Chrome, Safari, or Samsung Internet."
            );
          }
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
      {status === "confirm" && pendingToken && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 py-5 backdrop-blur-sm"><div className="w-full max-w-sm"><PurchaseConfirmation onConfirm={(amount) => { processingRef.current = false; void processScan(pendingToken, true, amount); }} onCancel={() => { setPendingToken(null); setStatus("scanning"); processingRef.current = false; try { scannerRef.current?.resume(); } catch (error) { console.error("Resume scanner", error); } }} /></div></div>}
      <Link
        href="/dashboard/scanner"
        prefetch={false}
        className="hidden lg:inline-flex items-center gap-2 text-sm opacity-60 transition hover:opacity-100"
      >
        <ArrowLeft size={16} />{t("USB scanner")}</Link>

      <div className="mt-6">
        <p className="text-sm opacity-60">{t("Mobile camera")}</p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("Scan")} {t(personLabel)}
        </h2>

        <p className="mt-2 text-sm leading-6 opacity-60">
          Point the phone camera at the {personLabel}&apos;s
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

                  <h3 className="mt-5 text-xl font-semibold">{t("Starting camera")}</h3>

                  <p className="mt-2 text-sm text-white/60">{t("Allow camera permission when asked.")}</p>
                </div>
              )}

              {status === "processing" && (
                <div>
                  <LoaderCircle
                    size={42}
                    className="mx-auto animate-spin"
                  />

                  <h3 className="mt-5 text-xl font-semibold">
                    {isBarbershop ? t("Recording visit") : t("Adding stamp")}
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
                    {isBarbershop ? t("Visit recorded") : t("Stamp added")}
                  </p>

                  <h3 className="mt-2 text-3xl font-semibold">
                    {result.customer.name}
                  </h3>

                  <p className="mt-3 text-lg text-white/70">
                    {result.stamps ??
                      result.customer.stamps}{" "}
                    /{" "}
                    {result.rewardTarget}{" "}
                    {isBarbershop ? "visits" : "stamps"}
                  </p>
                </div>
              )}

              {status === "reward" && result && (
                <div>
                  <Gift
                    size={54}
                    className="mx-auto text-amber-400"
                  />

                  <p className="mt-5 text-sm font-medium text-amber-400">{t("Reward earned")}</p>

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

                  <h3 className="mt-5 text-xl font-semibold">{t("Scanner unavailable")}</h3>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
                    {t(error)}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      window.location.reload()
                    }
                    className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold"
                    style={{ backgroundColor: theme.accent, color: theme.buttonText }}
                  >{t("Try again")}</button>
                </div>
              )}
            </div>
          )}

          {status === "scanning" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                <Camera size={14} />{t("Ready to scan")}</div>
            </div>
          )}
        </div>
      </section>

      <p className="mt-4 text-center text-xs leading-5 opacity-50">
        The same {personLabel} cannot receive another {isBarbershop
          ? "visit"
          : "stamp"}{" "}
        from this scanner for five seconds. Different
        {" "}{isBarbershop ? "clients" : "customers"} can scan immediately.
      </p>
    </div>
  );
}
