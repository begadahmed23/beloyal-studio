import { getRewardName } from "@/lib/business/terminology";
import { CardBrandHeader, cardFrame } from "@/components/loyalty/CardBrand";
import GourmealWordmark from "@/components/brand/GourmealWordmark";
import { dashboardPaletteSelect, getBaseDashboardPalette, getDashboardPalette } from "@/lib/business/dashboard-palette";
import { isGourmeal } from "@/lib/business/gourmeal";
import { dashboardThemeVariables } from "@/lib/cafe-theme";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getJoinTheme } from "./join-theme";
import JoinForm from "./join-form";

type JoinPageProps = {
  searchParams: Promise<{ location?: string | string[] }>;
  params: Promise<{
    slug: string;
  }>;
};

function getCardCookieName(cafeSlug: string) {
  return `beloyal_card_${cafeSlug}`;
}

export default async function JoinPage({
  params,
  searchParams,
}: JoinPageProps) {
  const [{ slug }, { location }] = await Promise.all([params, searchParams]);
  const locationId = typeof location === "string" && /^[a-z0-9]{1,40}$/.test(location) ? location : undefined;

  const cafe = await prisma.cafe.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      loyaltyMode: true,
      restaurantCategory: true,
      theme: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      backgroundColor: true,
      ...dashboardPaletteSelect,
      rewardTarget: true,
      rewardName: true,
      isActive: true,
    },
  });

  if (!cafe || !cafe.isActive) {
    notFound();
  }

  const gourmeal = isGourmeal(cafe);
  const palette = gourmeal ? getDashboardPalette(cafe) : getBaseDashboardPalette(cafe);
  const businessTheme = getJoinTheme({ ...cafe, ...palette });

  /*
   * Check whether this device already has a remembered
   * loyalty card for this specific café.
   */
  const cookieStore = await cookies();

  const savedToken = cookieStore.get(
    getCardCookieName(cafe.slug)
  )?.value;

  if (savedToken) {
    /*
     * Never trust the cookie blindly.
     *
     * Verify that:
     * 1. The customer still exists.
     * 2. The token is valid.
     * 3. The customer belongs to this café.
     */
    const rememberedCustomer =
      await prisma.customer.findFirst({
        where: {
          publicToken: savedToken,
          cafeId: cafe.id,
        },
        select: {
          publicToken: true,
        },
      });

    if (rememberedCustomer) {
      redirect(
        `/card/${rememberedCustomer.publicToken}`
      );
    }
  }

  return (
    <main data-loyalty-join className="min-h-dvh px-3 py-4 min-[380px]:px-4 sm:px-6 sm:py-10"
      style={{ ...dashboardThemeVariables(businessTheme), background: businessTheme.pageBackground, accentColor: businessTheme.accent }}>
      <div className="mx-auto max-w-md">
        <section className={cardFrame} style={{
          borderColor: businessTheme.border,
          background: businessTheme.shellBackground,
          color: businessTheme.textPrimary,
        }}>
          {gourmeal ? (
            <header className="grid aspect-[2.6] w-full place-items-center border-b-8"
              style={{ backgroundColor: businessTheme.primary, borderColor: businessTheme.accentSoft, color: businessTheme.buttonText }}>
              <GourmealWordmark name={cafe.name} className="block h-auto w-[78%] max-w-[275px]" />
            </header>
          ) : (
            <CardBrandHeader business={cafe} logoUrl={cafe.logoUrl} inheritColors />
          )}
          <div className={`px-4 pb-6 pt-5 min-[380px]:px-5 sm:px-6 ${gourmeal ? "" : "border-t"}`}
            style={{ borderColor: businessTheme.border }}>
            <JoinForm
              cafeSlug={cafe.slug}
              locationId={locationId}
              cafeName={cafe.name}
              businessType={cafe.businessType}
              pointsMode={cafe.loyaltyMode === "POINTS"}
              restaurantCategory={cafe.restaurantCategory ?? undefined}
              theme={businessTheme}
              rewardTarget={cafe.rewardTarget}
              rewardName={getRewardName(cafe)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
