import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getJoinTheme } from "./join-theme";
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

  const businessTheme = getJoinTheme(cafe);
  const { isLoretto, isKeka, isKato } = businessTheme;
  const primaryColor = businessTheme.primary;
  const secondaryColor = businessTheme.secondary;
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const isKatoDark = isKato && cafe.theme === "DARK_LUXURY";

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
        background: businessTheme.pageBackground,
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
            background: isKato
              ? isKatoDark
                ? "#071A33"
                : "#FFFFFF"
              : businessTheme.shellBackground,
            borderRadius: isKato ? "34px" : "32px",
            boxShadow: isKato
              ? isKatoDark
                ? "0 30px 90px rgba(0,0,0,0.34)"
                : "0 28px 90px rgba(16,43,73,0.12)"
              : businessTheme.cardShadow,
          }}
        >
          {isLoretto ? (
            <div className="px-6 pb-5 pt-8 text-center sm:px-8" style={{ color: "#2E2A27" }}>
              <div className="inline-flex flex-col items-end" aria-label="LORETTO">
                <div className="flex items-baseline font-serif text-[2.55rem] font-bold uppercase leading-none tracking-[.02em]">
                  <span>L</span><span>O</span><span className="inline-block" style={{ transform: "scaleX(-1)" }} aria-hidden="true">R</span><span>E</span><span>T</span><span>T</span><span>O</span>
                </div>
                <p className="mt-2 text-[7px] font-semibold uppercase tracking-[.27em]">Artisan coffee &amp; bakery</p>
              </div>
              <h1 className="mt-7 font-serif text-3xl font-semibold tracking-tight">Join the loyalty club</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6" style={{ color: businessTheme.textMuted }}>
                A little ritual, a little reward. Collect stamps with every eligible purchase at Loretto.
              </p>
            </div>
          ) : isKeka ? (
            <div className="px-6 pb-5 pt-8 text-center sm:px-8" style={{ color: businessTheme.textPrimary }}>
          <div className="text-center">
            <div
              className="relative mx-auto w-fit pb-1 pt-5 text-[3.85rem] font-medium leading-none tracking-[-0.08em] min-[390px]:text-[4.25rem]"
              dir="rtl"
              style={{ color: (cafe.theme === "MODERN_MINIMAL") ? "#741A1D" : "#F4E5C6" }}
              aria-label="كَيكَة"
            >
              <span>كيكة</span>
              <span
                aria-hidden="true"
                className="absolute right-[8%] top-[0.25em] block h-[3px] w-[20px] rotate-[-24deg] rounded-full min-[390px]:w-[22px]"
                style={{ backgroundColor: "currentColor" }}
              />
              <span
                aria-hidden="true"
                className="absolute left-[24%] top-[0.25em] block h-[3px] w-[20px] rotate-[-24deg] rounded-full min-[390px]:w-[22px]"
                style={{ backgroundColor: "currentColor" }}
              />
              <span
                dir="ltr"
                className="absolute left-[53%] top-[0.25em] block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-serif text-[0.19em] font-semibold tracking-[0.02em]"
                style={{
                  color: (cafe.theme === "MODERN_MINIMAL") ? "rgba(74,13,16,0.72)" : "rgba(244,229,198,0.78)",
                  width: "max-content",
                }}
              >
                Keka
              </span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-7 min-[390px]:w-9"
                style={{ backgroundColor: (cafe.theme === "MODERN_MINIMAL") ? "rgba(116,26,29,0.22)" : "rgba(244,229,198,0.24)" }}
              />
              <p
                className="text-center font-serif text-[12px] font-medium tracking-[0.07em] min-[390px]:text-[13px]"
                style={{ color: (cafe.theme === "MODERN_MINIMAL") ? "rgba(74,13,16,0.56)" : "rgba(255,246,230,0.58)" }}
              >
                Little Rituals, Big Comfort
              </p>
              <span
                aria-hidden="true"
                className="h-px w-7 min-[390px]:w-9"
                style={{ backgroundColor: (cafe.theme === "MODERN_MINIMAL") ? "rgba(116,26,29,0.22)" : "rgba(244,229,198,0.24)" }}
              />
            </div>
          </div>
              <h1 className="mt-7 font-serif text-3xl font-semibold tracking-tight">Join the loyalty club</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6" style={{ color: businessTheme.textMuted }}>
                Create your digital Keka card and collect stamps with every eligible purchase.
              </p>
            </div>
          ) : isKato ? (
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
              backgroundColor={cafe.backgroundColor}
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
