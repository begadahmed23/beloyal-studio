import { CardBrandHeader, cardFrame } from "@/components/loyalty/CardBrand";
import { getMbVapeBrandColors } from "@/lib/business/mb-vape";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getJoinTheme } from "./join-theme";
import JoinForm from "./join-form";

type JoinPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getCardCookieName(cafeSlug: string) {
  return `beloyal_card_${cafeSlug}`;
}

export default async function JoinPage({
  params,
}: JoinPageProps) {
  const { slug } = await params;

  const cafe = await prisma.cafe.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      theme: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      backgroundColor: true,
      rewardTarget: true,
      rewardName: true,
      isActive: true,
    },
  });

  if (!cafe || !cafe.isActive) {
    notFound();
  }

  const brand = getMbVapeBrandColors(cafe);
  const businessTheme = getJoinTheme(brand);
  const { isKato } = businessTheme;
  const primaryColor = businessTheme.primary;
  const secondaryColor = businessTheme.secondary;

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
    <main className="min-h-dvh px-3 py-4 min-[380px]:px-4 sm:px-6 sm:py-10"
      style={{ background: businessTheme.pageBackground }}>
      <div className="mx-auto max-w-md">
        <section className={cardFrame} style={{
          borderColor: businessTheme.border,
          background: businessTheme.shellBackground,
          color: businessTheme.textPrimary,
        }}>
          <CardBrandHeader business={cafe} logoUrl={cafe.logoUrl} />
          <div className="border-t px-4 pb-6 pt-5 min-[380px]:px-5 sm:px-6"
            style={{ borderColor: businessTheme.border }}>
            <JoinForm
              cafeSlug={cafe.slug}
              cafeName={cafe.name}
              businessType={cafe.businessType}
              themeName={cafe.theme}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              backgroundColor={brand.backgroundColor}
              rewardTarget={cafe.rewardTarget}
              rewardName={cafe.rewardName}
              isKato={isKato}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
