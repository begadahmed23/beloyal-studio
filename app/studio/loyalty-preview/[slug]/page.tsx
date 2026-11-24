import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { branchQuote } from "@/lib/business/points";
import QRCode from "react-qr-code";
import PointsCardPreview from "./points-card-preview";

export default async function StudioPointsPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await prisma.cafe.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, businessType: true, loyaltyMode: true, pointsPerHundred: true,
      logoUrl: true, instagramUrl: true, primaryColor: true, backgroundColor: true, storeLimit: true, isActive: true,
      user: { select: { id: true } },
      locations: { where: { archivedAt: null }, orderBy: { name: "asc" },
        select: { id: true, name: true, cashiers: { where: { isEnabled: true }, select: { id: true } } } } },
  });
  if (!cafe || cafe.loyaltyMode !== "POINTS") notFound();

  return <main className="mx-auto grid min-h-screen max-w-5xl gap-6 p-4 sm:p-8 lg:grid-cols-2">
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{cafe.name} loyalty preview</h1>
      <p>{cafe.isActive ? "Registration enabled" : "Registration pending activation"}</p>
      <p>{cafe.user ? "Owner login configured" : "Owner login pending"}</p>
      <p>{cafe.storeLimit} subscribed branches · EGP {branchQuote(cafe.storeLimit, "MONTHLY").toLocaleString()} monthly or EGP {branchQuote(cafe.storeLimit, "YEARLY").toLocaleString()} yearly</p>
      {cafe.instagramUrl && <a href={cafe.instagramUrl} className="inline-block underline">{cafe.name} on Instagram</a>}
      <div className="grid gap-3 sm:grid-cols-2">
        {cafe.locations.map(location => {
          const href = `https://getbeloyal.app/join/${cafe.slug}?location=${location.id}`;
          return <div key={location.id} className="space-y-2 rounded-xl border p-3">
            <h2 className="font-semibold">{location.name}</h2>
            <p className="text-sm">{location.cashiers.length ? "Cashier configured" : "Cashier pending"}</p>
            <div className="w-fit rounded-lg bg-white p-3"><QRCode value={href} size={128} /></div>
            <a className="inline-block text-sm underline" href={href}>Registration link</a>
          </div>;
        })}
      </div>
      <Link href={`/studio/cafes/${cafe.id}`} className="underline">Manage business</Link>
    </div>
    <PointsCardPreview brand={{ name: cafe.name, slug: cafe.slug, businessType: cafe.businessType }}
      logoUrl={cafe.logoUrl} rate={cafe.pointsPerHundred.toFixed()} background={cafe.backgroundColor} />
  </main>;
}
