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

export function CardBrandHeader({ business, target, stamps, ready, logoUrl, onLogoError }: {
  business: Brand;
  target: number;
  stamps: number;
  ready?: boolean;
  logoUrl?: string | null;
  onLogoError?: () => void;
}) {
  const mbVape = isMbVape(business);
  const identity = (business.slug + business.name).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const namedCafe = (name: string) => business.businessType === "CAFE" && identity.includes(name);

  return (
    <header className="flex min-h-24 items-center justify-between gap-3 px-4 py-3.5 min-[380px]:px-5"
      style={mbVape ? { backgroundColor: "#fff", color: "#432B1D" } : undefined}>
      <div className="min-w-0 flex-1">
        {mbVape ? (
          <MbVapeLogo className="h-auto w-[clamp(8.75rem,43vw,11.75rem)] max-w-full" />
        ) : logoUrl ? (
          // Logos can come from an existing business's external image host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={business.name} width={160} height={64} onError={onLogoError}
            className="h-auto max-h-16 w-auto max-w-full rounded-md object-contain object-left" />
        ) : namedCafe("loretto") ? (
          <span className="block font-serif text-[clamp(1.55rem,7vw,2rem)] font-bold leading-none" aria-label="Loretto">
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
      <div className="shrink-0 text-right">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.10em]">
          {ready ? "Reward ready" : business.businessType === "BARBERSHOP" ? "Visits" : "Stamps"}
        </p>
        <p className="mt-1 text-[1.7rem] font-semibold leading-none tabular-nums min-[380px]:text-3xl" aria-live="polite">
          {stamps}<span className="mx-0.5 opacity-50">/</span>{target}
        </p>
      </div>
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
  if (isMbVape(business)) {
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
