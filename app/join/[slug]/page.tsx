import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JoinForm from "./join-form";

type JoinPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { slug } = await params;

  const cafe = await prisma.cafe.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
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

  return (
    <main
      className="min-h-screen px-4 py-10 sm:px-6"
      style={{
        background: `
          radial-gradient(
            circle at top,
            ${cafe.primaryColor}30 0%,
            transparent 42%
          ),
          ${cafe.backgroundColor}
        `,
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div
          className="w-full overflow-hidden rounded-[32px] border shadow-2xl backdrop-blur-xl"
          style={{
            borderColor: `${cafe.secondaryColor}35`,
            backgroundColor: "rgba(15, 15, 15, 0.88)",
            boxShadow: `0 30px 80px ${cafe.primaryColor}20`,
          }}
        >
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
                  background: `linear-gradient(135deg, ${cafe.primaryColor}, ${cafe.secondaryColor})`,
                }}
              >
                {cafe.name.charAt(0).toUpperCase()}
              </div>
            )}

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.28em]"
              style={{
                color: cafe.secondaryColor,
              }}
            >
              Loyalty Club
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Join {cafe.name}
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/60">
              Create your digital loyalty card and start collecting stamps with
              every eligible purchase.
            </p>
          </div>

          <div
            className="mx-6 h-px sm:mx-8"
            style={{
              backgroundColor: `${cafe.secondaryColor}25`,
            }}
          />

          <div className="px-6 pb-8 pt-6 sm:px-8">
            <JoinForm
              cafeSlug={cafe.slug}
              cafeName={cafe.name}
              primaryColor={cafe.primaryColor}
              secondaryColor={cafe.secondaryColor}
              rewardTarget={cafe.rewardTarget}
              rewardName={cafe.rewardName}
            />
          </div>
        </div>
      </div>
    </main>
  );
}