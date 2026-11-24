import Image from "next/image";
import { FIREY_NASH_COLORS } from "@/lib/cafe-theme";
import { fireyNashBrand } from "@/lib/business/points";

export default function FireyCardFace({ balance, label }: { balance: string; label: string }) {
  return (
    <div className="relative isolate overflow-hidden border-b border-[#3c2922] bg-[#101012] px-5 py-6 text-[#fbf8f4] sm:px-7 sm:py-7">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_40%,#57220f,transparent_68%)]" />
      <div className="flex min-w-0 items-center justify-between gap-4">
        <Image src={fireyNashBrand.wordmark} alt="Firey Nash" width={145} height={41} priority className="h-auto w-28 shrink-0 sm:w-36" />
        <div className="min-w-0 text-end">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#e5dcd4]">{label}</p>
          <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
            <Image src={fireyNashBrand.flame} alt="" width={16} height={28} className="h-6 w-auto shrink-0" />
            <p dir="ltr" aria-live="polite" style={{ color: FIREY_NASH_COLORS[1] }} className="wrap-anywhere text-3xl font-semibold leading-tight tracking-tight tabular-nums sm:text-4xl">{balance}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
