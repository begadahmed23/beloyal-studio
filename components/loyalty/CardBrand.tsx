import type { BusinessType } from "@prisma/client";
import { Check, Coffee, Layers, Scissors, Store } from "lucide-react";
import Image from "next/image";

import GourmealWordmark from "@/components/brand/GourmealWordmark";
import KatoMark from "@/components/brand/KatoMark";
import MbVapeLogo from "@/components/brand/MbVapeLogo";
import { fireyNashBrand } from "@/lib/business/points";
import { businessCardBackground } from "@/lib/business/card-artwork";
import { isMbVape, MB_VAPE_ARTWORK_PATH, MB_VAPE_WALNUT } from "@/lib/business/mb-vape";
import { GOURMEAL, gourmealStripPath, isGourmeal } from "@/lib/business/gourmeal";

export const cardFrame = "w-full overflow-hidden rounded-[26px] border shadow-[0_22px_56px_rgba(40,27,21,.16)]";

type Brand = { name: string; slug: string; businessType: BusinessType };
const stampIcons = { CAFE: Coffee, BARBERSHOP: Scissors, VAPE: Layers, OTHER: Store, RESTAURANT: Store };

export function CardBrandHeader({ business, progress, balance, logoUrl, onLogoError, inheritColors = false }: {
  business: Brand;
  balance?: { value: string; label: string };
  progress?: { target: number; stamps: number; label: string };
  logoUrl?: string | null;
  onLogoError?: () => void;
  inheritColors?: boolean;
}) {
  const mbVape = isMbVape(business);
  const gourmealCard = Boolean(progress && isGourmeal(business));
  const loretto = business.businessType === "CAFE" && /loretto/i.test(business.slug + business.name);
  const identity = (business.slug + business.name).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const namedCafe = (name: string) => business.businessType === "CAFE" && identity.includes(name);

  const hasBalance = Boolean(progress || balance);
  return (
    <header className={hasBalance
      ? "flex min-h-24 items-center justify-between gap-3 px-4 py-3.5 min-[380px]:px-5"
      : "grid min-h-20 place-items-center px-4 py-3 text-center"}
      style={gourmealCard ? { backgroundColor: GOURMEAL.green, color: GOURMEAL.stone } : loretto ? { backgroundColor: "#E9E4D8", color: "#2E2E2E", borderBottom: "1px solid rgba(82,79,71,.25)" } : !inheritColors && business.businessType === "VAPE" ? { backgroundColor: "#fff", color: "#432B1D" } : undefined}>
      <div className={hasBalance ? "min-w-0 flex-1" : "grid min-w-0 max-w-full place-items-center"}>
        {gourmealCard ? (
          <GourmealWordmark name={business.name} className="block h-auto w-44 max-w-full sm:w-48" />
        ) : mbVape ? (
          <MbVapeLogo className={progress
            ? "h-auto w-[clamp(8.75rem,43vw,11.75rem)] max-w-full"
            : "h-16 w-auto max-w-full"} />
        ) : logoUrl ? (
          // Logos can come from an existing business's external image host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={business.name} width={160} height={64} onError={onLogoError}
            className="h-auto max-h-16 w-auto max-w-full rounded-md object-contain object-left" />
        ) : namedCafe("loretto") ? (
          <span className="block font-serif text-[clamp(1.55rem,7vw,2rem)] font-bold leading-none tracking-[.11em]" aria-label="Loretto">
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
      {balance && <div className="shrink-0 text-end">
        <p className="text-xs font-semibold">{balance.label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums" aria-live="polite" dir="ltr">{balance.value}</p>
      </div>}
      {progress && (
        <div className="shrink-0 text-end" style={gourmealCard && progress.stamps >= progress.target ? { color: GOURMEAL.butter } : undefined}>
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
  if (business.slug === fireyNashBrand.slug) {
    const count = Math.min(target, 12);
    const filled = Math.floor(stamps / Math.max(1, target) * count);
    return <div aria-hidden="true" className="flex min-h-20 flex-wrap items-center justify-center gap-3 px-4 py-4" style={{ backgroundColor: background }}>
      {Array.from({ length: count }, (_, index) => <Image key={index} src={fireyNashBrand.flame} alt="" width={16} height={28}
        className={index === newStampIndex ? "motion-safe:animate-pulse" : undefined} style={{ opacity: index < filled ? 1 : .22 }} />)}
    </div>;
  }
  if (isGourmeal(business)) {
    const count = Math.min(target, 99);
    return <Image src={gourmealStripPath(Math.min(stamps, count), count)} alt=""
      width={1125} height={369} unoptimized loading="eager"
      className="block aspect-[375/123] h-auto w-full" style={{ backgroundColor: GOURMEAL.green }} />;
  }
  if (business.businessType === "CAFE" && /loretto/i.test(business.slug + business.name)) {
    const count = Math.min(12, Math.max(1, target));
    return <div aria-label={`${stamps} out of ${target} stamps`} className="flex min-h-[130px] flex-col items-center justify-center gap-4 border-y px-4 py-5" style={{ backgroundColor: "#E9E4D8", color: "#2E2E2E", borderColor: "rgba(82,79,71,.2)" }}><p className="text-[10px] font-semibold uppercase tracking-[.22em]" style={{ color: "#524F47" }}>A little closer to your reward</p><div className="flex flex-wrap items-center justify-center gap-2">{Array.from({ length: count }, (_, i) => <span key={i} className={`grid size-9 place-items-center rounded-full border ${i === newStampIndex ? "motion-safe:animate-pulse" : ""}`} style={{ backgroundColor: i < stamps ? "#2E2E2E" : "transparent", borderColor: "#2E2E2E", color: i < stamps ? "#E9E4D8" : "#524F47" }}>{i < stamps ? <Check size={16}/> : <Coffee size={14}/>}</span>)}</div><p className="text-xs font-semibold tracking-widest">{stamps} / {target} STAMPS</p></div>;
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
