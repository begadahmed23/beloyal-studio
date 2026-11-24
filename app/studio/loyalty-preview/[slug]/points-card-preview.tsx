"use client";

import type { BusinessType } from "@prisma/client";
import FireyCardFace from "@/components/loyalty/FireyCardFace";
import { CardBrandHeader, cardFrame } from "@/components/loyalty/CardBrand";
import { fireyNashBrand } from "@/lib/business/points";

export default function PointsCardPreview({ brand, logoUrl, background }: {
  brand: { name: string; slug: string; businessType: BusinessType };
  logoUrl: string | null; background: string;
}) {
  const firey = brand.slug === fireyNashBrand.slug;
  const foreground = /^#(17|0)/i.test(background) ? "#fff8f3" : "#171717";
  return <article className={cardFrame + " h-fit max-w-md"} style={{ backgroundColor: background, color: foreground }}>
    {firey ? <FireyCardFace balance="0" label="Flame balance" /> : <CardBrandHeader business={brand} logoUrl={logoUrl} balance={{ value: "0", label: "Points balance" }} />}
    <div className="space-y-2 p-4">
      <h2 className="font-semibold">Rewards</h2>
      <p className="text-sm">No rewards available yet.</p>
    </div>
  </article>;
}
