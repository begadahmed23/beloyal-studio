import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      publicToken: null,
    },
  });

  for (const customer of customers) {
    await prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        publicToken: nanoid(32),
      },
    });

    console.log(`Updated ${customer.name}`);
  }

  console.log("✅ All members now have secure tokens.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });