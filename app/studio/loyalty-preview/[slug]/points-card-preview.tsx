"use client";

import type { BusinessType } from "@prisma/client";
import Image from "next/image";
import { CardBrandHeader, cardFrame } from "@/components/loyalty/CardBrand";
import { fireyNashBrand } from "@/lib/business/points";

export default function PointsCardPreview({ brand, logoUrl, background }: {
  brand: { name: string; slug: string; businessType: BusinessType };
  logoUrl: string | null; background: string;
}) {
  const firey = brand.slug === fireyNashBrand.slug;
  const foreground = /^#(17|0)/i.test(background) ? "#fff8f3" : "#171717";
  return <article className={cardFrame + " h-fit max-w-md"} style={{ backgroundColor: background, color: foreground }}>
    <CardBrandHeader business={brand} logoUrl={logoUrl} balance={{ value: "0", label: firey ? "Flames" : "Points balance" }} />
    <div className="flex items-center justify-center gap-3 border-y border-current/15 p-4 text-sm font-semibold">
      {firey && <Image src={fireyNashBrand.flame} width={16} height={28} alt="" />}
      {firey ? "Collect flames with your orders" : "Collect points with your purchases"}
    </div>
    <div className="space-y-2 p-4">
      <h2 className="font-semibold">Rewards</h2>
      <p className="text-sm">No rewards available yet.</p>
    </div>
  </article>;
}
