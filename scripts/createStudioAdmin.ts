import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { prisma } from "../lib/prisma";

process.env.ALLOW_CASHIER_CREATION = "true";

async function main() {
  const readline = createInterface({
    input,
    output,
  });

  try {
    console.log("\nCreate private Studio admin\n");

    const name = (
      await readline.question("Admin name: ")
    ).trim();

    const email = (
      await readline.question("Admin email: ")
    )
      .trim()
      .toLowerCase();

    const password = await readline.question(
      "Admin password (minimum 12 characters): "
    );

    if (!name) {
      throw new Error("Admin name is required.");
    }

    if (!email.includes("@")) {
      throw new Error("Enter a valid email.");
    }

    if (password.length < 12) {
      throw new Error(
        "Password must contain at least 12 characters."
      );
    }

    const existing = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existing) {
      throw new Error(
        "An account already exists with this email."
      );
    }

    const { auth } = await import("../lib/auth");

    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result.user) {
      throw new Error(
        "The Studio account could not be created."
      );
    }

    await prisma.user.update({
      where: {
        id: result.user.id,
      },
      data: {
        role: "SUPER_ADMIN",
        cafeId: null,
      },
    });

    console.log("\nStudio admin created successfully.");
    console.log(`Email: ${email}`);
    console.log("Role: SUPER_ADMIN");
  } finally {
    readline.close();
  }
}

main()
  .catch((error) => {
    console.error(
      "\nFailed:",
      error instanceof Error ? error.message : error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });