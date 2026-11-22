"use client";

import { useEffect, useState } from "react";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type CycleSpending = {
  cycleSpending: number;
  recordedPurchases: number;
  stampsInCycle: number;
  missingAmounts: number;
};

export default function RewardCycleSpending({ customerId, active }: { customerId: string; active: boolean }) {
  const { theme } = useCafeTheme();
  const [data, setData] = useState<CycleSpending | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!active) { setData(null); setError(""); return; }
    const controller = new AbortController();
    fetch("/api/spending/cycle/" + encodeURIComponent(customerId), {
      cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error("Unable to load reward spending.");
      return response.json() as Promise<CycleSpending>;
    }).then(result => { if (!controller.signal.aborted) { setData(result); setError(""); } })
      .catch(() => { if (!controller.signal.aborted) setError("Reward spending is unavailable."); });
    return () => controller.abort();
  }, [customerId, active]);

  return (
    <div aria-live="polite" className="rounded-xl border px-4 py-3" style={{ borderColor: theme.border, backgroundColor: theme.surfaceRaised }}>
      <p className="text-xs font-medium" style={{ color: theme.textMuted }}>Spent toward this reward</p>
      {data ? (
        <>
          <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: theme.textPrimary }}>
            {data.cycleSpending.toLocaleString("en-EG", { maximumFractionDigits: 2 })} <span className="text-sm font-medium">EGP</span>
          </p>
          <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
            {data.recordedPurchases} purchase {data.recordedPurchases === 1 ? "amount" : "amounts"} entered on this card.
          </p>
          {data.missingAmounts > 0 && (
            <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
              {data.missingAmounts} {data.missingAmounts === 1 ? "stamp has" : "stamps have"} no amount saved. Actual spending may be higher.
            </p>
          )}
        </>
      ) : <p className="mt-2 text-sm" style={{ color: error ? theme.danger : theme.textMuted }}>{error || "Loading spending..."}</p>}
      <p className="mt-2 text-[11px]" style={{ color: theme.textMuted }}>Only this reward cycle — not lifetime spending.</p>
    </div>
  );
}
