import { prisma } from "../lib/prisma";
import { fireyNashBrand } from "../lib/business/points";
import { getDashboardThemeColors } from "../lib/cafe-theme";

async function prepareFireyNash() {
  const theme = "RED_ORANGE_DARK" as const;
  const [primaryColor, secondaryColor, backgroundColor] = getDashboardThemeColors(theme);
  const existing = await prisma.cafe.findUnique({ where: { slug: fireyNashBrand.slug } });
  if (existing) throw new Error("Firey Nash already exists. Review it in Studio before making changes.");

  const cafe = await prisma.cafe.create({
    data: {
      name: "Firey Nash",
      slug: fireyNashBrand.slug,
      businessType: "RESTAURANT",
      restaurantCategory: "FRIED_CHICKEN",
      loyaltyMode: "POINTS",
      pointsPerHundred: 10,
      storeLimit: 2,
      timezone: "Africa/Cairo",
      subscriptionStatus: "TRIAL",
      isActive: false,
      logoUrl: fireyNashBrand.logo,
      instagramUrl: "https://www.instagram.com/firey_nash/",
      theme, primaryColor, secondaryColor, backgroundColor,
      dashboardTheme: theme,
      dashboardPrimaryColor: primaryColor,
      dashboardSecondaryColor: secondaryColor,
      dashboardBackgroundColor: backgroundColor,
      rewardName: "Restaurant Rewards",
      feedbackEnabled: true,
      feedbackRewardEnabled: false,
      locations: { create: [{ name: "Sidi Gaber" }, { name: "El Na2al w El Hanadasa — النقل والهندسة" }] },
    },
    select: { id: true, slug: true, locations: { select: { id: true, name: true } } },
  });
  console.log(cafe);
}

prepareFireyNash().catch(error => {
  console.error(error instanceof Error ? error.message : "Draft setup failed.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
