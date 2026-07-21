import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const subscriptionEndsAt = new Date(now);
  subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

  const loretto = await prisma.cafe.update({
    where: {
      slug: "loretto",
    },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionStartedAt: now,
      subscriptionEndsAt,
      lastPaymentAt: now,
      monthlyPrice: 1000,
      isActive: true,
    },
  });

  console.log("Loretto subscription activated.");
  console.log("Status:", loretto.subscriptionStatus);
  console.log("Ends:", loretto.subscriptionEndsAt);
}

main()
  .catch((error) => {
    console.error("Activation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });