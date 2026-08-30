"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type CardSyncResponse = {
  birthdayRewardRedeemedAt?: string | null;
};

const POLL_MS = 2000;
const CONFETTI_MS = 2200;

export default function BirthdayRedemptionConfetti() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const previousRedemption = useRef<string | null | undefined>(undefined);
  const [visible, setVisible] = useState(false);

  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        delay: `${(index % 8) * 55}ms`,
        duration: `${1200 + (index % 6) * 140}ms`,
        rotate: `${(index * 47) % 360}deg`,
      })),
    [],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let stopped = false;
    let timeout: number | null = null;
    let confettiTimeout: number | null = null;

    async function checkBirthdayRedemption() {
      try {
        const response = await fetch(
          `/api/customers/card/${encodeURIComponent(token)}?birthdaySync=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as CardSyncResponse;
        const incoming = data.birthdayRewardRedeemedAt ?? null;

        if (previousRedemption.current === undefined) {
          previousRedemption.current = incoming;
          return;
        }

        if (
          incoming &&
          incoming !== previousRedemption.current
        ) {
          previousRedemption.current = incoming;
          setVisible(true);

          if (confettiTimeout !== null) {
            window.clearTimeout(confettiTimeout);
          }

          confettiTimeout = window.setTimeout(() => {
            setVisible(false);
          }, CONFETTI_MS);
        }
      } catch {
        // The normal card refresh remains the source of truth.
      }
    }

    function schedule() {
      if (stopped) {
        return;
      }

      timeout = window.setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await checkBirthdayRedemption();
        }

        schedule();
      }, POLL_MS);
    }

    void checkBirthdayRedemption();
    schedule();

    return () => {
      stopped = true;

      if (timeout !== null) {
        window.clearTimeout(timeout);
      }

      if (confettiTimeout !== null) {
        window.clearTimeout(confettiTimeout);
      }
    };
  }, [token]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute -top-5 h-3 w-2 rounded-[2px] bg-current animate-[birthday-confetti_fall_linear_forwards]"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            transform: `rotate(${piece.rotate})`,
            color:
              piece.id % 4 === 0
                ? "#F59E0B"
                : piece.id % 4 === 1
                  ? "#EC4899"
                  : piece.id % 4 === 2
                    ? "#22C55E"
                    : "#3B82F6",
          }}
        />
      ))}

      <style jsx global>{`
        @keyframes birthday-confetti_fall {
          0% {
            transform: translate3d(0, -24px, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(40px, 110vh, 0) rotate(720deg);
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}
