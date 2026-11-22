import type { BusinessType } from "@prisma/client";
import { Check, Coffee, Layers, Scissors, Store } from "lucide-react";
import Image from "next/image";

import KatoMark from "@/components/brand/KatoMark";
import MbVapeLogo from "@/components/brand/MbVapeLogo";
import { businessCardBackground } from "@/lib/business/card-artwork";
import { isMbVape, MB_VAPE_ARTWORK_PATH, MB_VAPE_WALNUT } from "@/lib/business/mb-vape";

export const cardFrame = "w-full overflow-hidden rounded-[26px] border shadow-[0_22px_56px_rgba(40,27,21,.16)]";

type Brand = { name: string; slug: string; businessType: BusinessType };
const stampIcons = { CAFE: Coffee, BARBERSHOP: Scissors, VAPE: Layers, OTHER: Store };

export function CardBrandHeader({ business, progress, logoUrl, onLogoError, inheritColors = false }: {
  business: Brand;
  progress?: { target: number; stamps: number; label: string };
  logoUrl?: string | null;
  onLogoError?: () => void;
  inheritColors?: boolean;
}) {
  const mbVape = isMbVape(business);
  const loretto = business.businessType === "CAFE" && /loretto/i.test(business.slug + business.name);
  const identity = (business.slug + business.name).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const namedCafe = (name: string) => business.businessType === "CAFE" && identity.includes(name);

  return (
    <header className={progress
      ? "flex min-h-24 items-center justify-between gap-3 px-4 py-3.5 min-[380px]:px-5"
      : "grid min-h-20 place-items-center px-4 py-3 text-center"}
      style={loretto ? { backgroundColor: "#193A32", color: "#F8F5ED", borderBottom: "1px solid rgba(210,186,138,.4)" } : !inheritColors && business.businessType === "VAPE" ? { backgroundColor: "#fff", color: "#432B1D" } : undefined}>
      <div className={progress ? "min-w-0 flex-1" : "grid min-w-0 max-w-full place-items-center"}>
        {mbVape ? (
          <MbVapeLogo className={progress
            ? "h-auto w-[clamp(8.75rem,43vw,11.75rem)] max-w-full"
            : "h-16 w-auto max-w-full"} />
        ) : logoUrl ? (
          // Logos can come from an existing business's external image host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={business.name} width={160} height={64} onError={onLogoError}
            className="h-auto max-h-16 w-auto max-w-full rounded-md object-contain object-left" />
        ) : namedCafe("loretto") ? (
          <span className="block font-serif text-[clamp(1.55rem,7vw,2rem)] font-bold leading-none tracking-[.13em]" aria-label="Loretto">
            LO<span aria-hidden="true" className="inline-block -scale-x-100">R</span>ETTO
          </span>
        ) : namedCafe("keka") ? (
          <span aria-label={business.name} className="text-4xl leading-none" lang="ar">كيكة</span>
        ) : (
          <span className="flex items-center gap-2 break-words text-xl font-semibold leading-tight [overflow-wrap:anywhere]">
            {namedCafe("kato") && <KatoMark size={32} className="shrink-0" />}
            {business.name}
          </span>
        )}
      </div>
      {progress && (
        <div className="shrink-0 text-end">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.10em]">
            {progress.label}
          </p>
          <p className="mt-1 text-[1.7rem] font-semibold leading-none tabular-nums min-[380px]:text-3xl" aria-live="polite" dir="ltr">
            {progress.stamps}<span className="mx-0.5 opacity-50">/</span>{progress.target}
          </p>
        </div>
      )}
    </header>
  );
}

export function CardStampStrip({ business, target, stamps, accent, ink, background, newStampIndex }: {
  business: Brand;
  target: number;
  stamps: number;
  accent: string;
  ink: string;
  background: string;
  newStampIndex?: number | null;
}) {
  if (business.businessType === "CAFE" && /loretto/i.test(business.slug + business.name)) {
    const count = Math.min(12, Math.max(1, target));
    return <div aria-label={`${stamps} out of ${target} stamps`} className="relative flex min-h-[142px] flex-col items-center justify-center gap-4 border-y px-5 py-5" style={{ background: "linear-gradient(145deg,#193A32 0%,#244E41 100%)", borderColor: "rgba(210,186,138,.34)" }}><p className="text-[.64rem] font-semibold uppercase tracking-[.25em] text-[#D2BA8A]">The little things add up</p><div className="flex w-full flex-wrap items-center justify-center gap-2">{Array.from({ length: count }, (_, i) => <span key={i} className={`grid size-9 place-items-center rounded-full border sm:size-10 ${i === newStampIndex ? "motion-safe:animate-pulse" : ""}`} style={{ borderColor: "#D2BA8A", backgroundColor: i < stamps ? "#D2BA8A" : "transparent", color: i < stamps ? "#193A32" : "#D2BA8A" }}>{i < stamps ? <Check size={17} strokeWidth={2.5} /> : <Coffee size={15} strokeWidth={1.5} />}</span>)}</div><p className="text-xs font-medium tracking-[.12em] text-[#F8F5ED]">{stamps} / {target} STAMPS</p></div>;
  }
  if (business.businessType === "VAPE") {
    const count = Math.min(target, 99);
    return <Image
      src={`${MB_VAPE_ARTWORK_PATH}?asset=strip&stamps=${Math.min(stamps, count)}&target=${count}`}
      alt="" width={1125} height={432} unoptimized loading="eager"
      className="block aspect-[375/144] h-auto w-full" style={{ backgroundColor: MB_VAPE_WALNUT }} />;
  }

  const Icon = stampIcons[business.businessType] ?? Store;
  const slots = Math.min(target, 12);
  const filled = target > slots ? Math.floor(stamps * slots / target) : stamps;
  return (
    <div aria-hidden="true" className="flex min-h-[110px] flex-wrap items-center justify-center gap-2 bg-cover px-4 py-5"
      style={{ backgroundColor: background, color: ink, backgroundImage: businessCardBackground(business.businessType, accent) }}>
      {Array.from({ length: slots }, (_, index) => (
        <span key={index} className={`grid size-8 place-items-center rounded-xl border sm:size-9 ${index === newStampIndex && target <= slots ? "motion-safe:animate-pulse" : ""}`}
          style={index < filled ? { backgroundColor: ink, borderColor: ink, color: background } : { borderColor: "currentColor", opacity: 0.68 }}>
          {index < filled && business.businessType !== "BARBERSHOP" ? <Check size={16} /> : <Icon size={16} />}
        </span>
      ))}
    </div>
  );
}
