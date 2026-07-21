import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const loretto = await prisma.cafe.upsert({
    where: {
      slug: "loretto",
    },
    update: {},
    create: {
      name: "Loretto",
      slug: "loretto",
      theme: "COFFEE_CLASSIC",
      primaryColor: "#8e6045",
      secondaryColor: "#d6b08c",
      backgroundColor: "#0c0c0c",
      rewardTarget: 7,
      rewardName: "Free Drink",
      rewardDescription:
        "Receive a free eligible drink after completing the loyalty card.",
      eligiblePurchaseDescription:
        "One stamp for each eligible drink purchase.",
      isActive: true,
    },
  });

  const customers = await prisma.customer.updateMany({
    where: {
      cafeId: null,
    },
    data: {
      cafeId: loretto.id,
    },
  });

  const users = await prisma.user.updateMany({
    where: {
      cafeId: null,
    },
    data: {
      cafeId: loretto.id,
    },
  });

  const transactions = await prisma.stampTransaction.updateMany({
    where: {
      cafeId: null,
    },
    data: {
      cafeId: loretto.id,
    },
  });

  console.log("Loretto café ID:", loretto.id);
  console.log("Customers connected:", customers.count);
  console.log("Users connected:", users.count);
  console.log("Transactions connected:", transactions.count);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });