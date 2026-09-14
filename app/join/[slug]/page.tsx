import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getBusinessTheme,
  getBusinessThemeColors,
} from "@/lib/cafe-theme";
import KatoMark from "@/components/brand/KatoMark";
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

  const businessTheme = getBusinessTheme(
    cafe.theme,
    cafe.businessType,
  );
  const [mappedPrimary, mappedSecondary, mappedBackground] =
    getBusinessThemeColors(
      cafe.theme,
      cafe.businessType,
    );
  const primaryColor =
    cafe.businessType === "BARBERSHOP"
      ? mappedPrimary
      : cafe.primaryColor;
  const secondaryColor =
    cafe.businessType === "BARBERSHOP"
      ? mappedSecondary
      : cafe.secondaryColor;
  const backgroundColor =
    cafe.businessType === "BARBERSHOP"
      ? mappedBackground
      : cafe.backgroundColor;
  const isBarbershop =
    cafe.businessType === "BARBERSHOP";
  const normalizedCafeName = cafe.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isKato =
    cafe.slug.toLowerCase().includes("kato") ||
    normalizedCafeName.includes("kato");
  const isKatoDark =
    isKato && cafe.theme === "DARK_LUXURY";

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
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-10"
      style={{
        background: isKato
          ? isKatoDark
            ? "linear-gradient(180deg,#06172B 0%,#0A223E 100%)"
            : "linear-gradient(180deg,#F7F9FB 0%,#EEF3F7 100%)"
          : `
              radial-gradient(
                circle at top,
                ${primaryColor}30 0%,
                transparent 42%
              ),
              ${backgroundColor}
            `,
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div
          className="w-full overflow-hidden border"
          style={{
            borderColor: isKato
              ? isKatoDark
                ? "rgba(233,230,216,0.12)"
                : "rgba(16,43,73,0.10)"
              : businessTheme.border,
            backgroundColor: isKato
              ? isKatoDark
                ? "#071A33"
                : "#FFFFFF"
              : businessTheme.surface,
            borderRadius: isKato ? "34px" : "32px",
            boxShadow: isKato
              ? isKatoDark
                ? "0 30px 90px rgba(0,0,0,0.34)"
                : "0 28px 90px rgba(16,43,73,0.12)"
              : businessTheme.cardShadow,
          }}
        >
          {isKato ? (
            <div className="px-6 pb-4 pt-7 text-center sm:px-8 sm:pt-8">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isKatoDark ? "#E9E6D8" : "#102B49",
                  color: isKatoDark ? "#0A223E" : "#E9E6D8",
                }}
              >
                <KatoMark size={40} />
              </div>

              <p
                className="mt-5 text-[2rem] font-light leading-none tracking-[-0.07em]"
                style={{ color: isKatoDark ? "#F5F3EC" : "#102B49" }}
              >
                KATŌ
              </p>

              <p
                className="mt-2 text-[9px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: isKatoDark ? "#9AA5AF" : "#7F8DA0" }}
              >
                Specialty Coffee
              </p>

              <h1
                className="mt-7 text-2xl font-semibold tracking-[-0.035em]"
                style={{ color: isKatoDark ? "#F5F3EC" : "#0A223E" }}
              >
                Join the loyalty club
              </h1>

              <p
                className="mx-auto mt-3 max-w-sm text-sm leading-6"
                style={{ color: isKatoDark ? "#A7B0BA" : "#7F8DA0" }}
              >
                Create your digital KATŌ card and start collecting stamps with every eligible purchase.
              </p>
            </div>
          ) : (
            <div className="px-6 pb-5 pt-8 text-center sm:px-8">
              {cafe.logoUrl ? (
                <img
                  src={cafe.logoUrl}
                  alt={`${cafe.name} logo`}
                  className="mx-auto mb-5 h-20 w-20 object-contain"
                />
              ) : (
                <div
                  className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    color: businessTheme.buttonText,
                  }}
                >
                  {cafe.name.charAt(0).toUpperCase()}
                </div>
              )}

              <p
                className="mb-2 text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: businessTheme.accent }}
              >
                {isBarbershop ? "Barber Loyalty" : "Loyalty Club"}
              </p>

              <h1
                className="text-3xl font-semibold tracking-tight"
                style={{ color: businessTheme.textPrimary }}
              >
                Join {cafe.name}
              </h1>

              <p
                className="mx-auto mt-3 max-w-sm text-sm leading-6"
                style={{ color: businessTheme.textMuted }}
              >
                {isBarbershop
                  ? "Create your digital loyalty card and start collecting visits with every eligible service."
                  : "Create your digital loyalty card and start collecting stamps with every eligible purchase."}
              </p>
            </div>
          )}

          <div
            className="mx-6 h-px sm:mx-8"
            style={{
              backgroundColor: isKato
                ? isKatoDark
                  ? "rgba(233,230,216,0.12)"
                  : "rgba(16,43,73,0.10)"
                : businessTheme.border,
            }}
          />

          <div className="px-6 pb-8 pt-6 sm:px-8">
            <JoinForm
              cafeSlug={cafe.slug}
              cafeName={cafe.name}
              businessType={cafe.businessType}
              themeName={cafe.theme}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              rewardTarget={cafe.rewardTarget}
              rewardName={cafe.rewardName}
              isKato={isKato}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
