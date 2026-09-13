import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

process.env.ALLOW_CASHIER_CREATION = "true";

async function main() {
  const readline = createInterface({
    input,
    output,
  });

  try {
    console.log("\nCreate a BeLoyal cashier account\n");

    const cafeSlug = (
      await readline.question(
        "Business slug (example: loretto): "
      )
    )
      .trim()
      .toLowerCase();

    const name = (
      await readline.question(
        "Cashier name: "
      )
    ).trim();

    const email = (
      await readline.question(
        "Cashier email: "
      )
    )
      .trim()
      .toLowerCase();

    const password = await readline.question(
      "Cashier password (minimum 12 characters): "
    );

    if (!cafeSlug) {
      throw new Error(
        "Business slug is required."
      );
    }

    if (!name) {
      throw new Error(
        "Cashier name is required."
      );
    }

    if (!email.includes("@")) {
      throw new Error(
        "Enter a valid email address."
      );
    }

    if (password.length < 12) {
      throw new Error(
        "Password must contain at least 12 characters."
      );
    }

    const { prisma } = await import(
      "../lib/prisma"
    );

    const cafe = await prisma.cafe.findUnique({
      where: {
        slug: cafeSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!cafe) {
      throw new Error(
        `No business found with slug "${cafeSlug}".`
      );
    }

    const { auth } = await import(
      "../lib/auth"
    );

    const result =
      await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        },
      });

    if (!result.user) {
      throw new Error(
        "The cashier account was not created."
      );
    }

    await prisma.user.update({
      where: {
        id: result.user.id,
      },
      data: {
        role: "CASHIER",
        cafeId: null,
        cashierCafeId: cafe.id,
      },
    });

    console.log(
      "\nCashier account created successfully."
    );
    console.log(
      `Business: ${cafe.name} (/${cafe.slug})`
    );
    console.log(
      `Name: ${result.user.name}`
    );
    console.log(
      `Email: ${result.user.email}`
    );
    console.log(
      "Role: CASHIER"
    );
    console.log(
      "\nUse the normal /login page to sign in."
    );
  } finally {
    readline.close();
  }
}

main().catch((error) => {
  console.error(
    "\nFailed to create cashier:",
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});
