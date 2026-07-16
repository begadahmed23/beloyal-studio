import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// This must be set before importing the auth configuration.
process.env.ALLOW_CASHIER_CREATION = "true";

async function main() {
  const readline = createInterface({
    input,
    output,
  });

  try {
    console.log("\nCreate the one Loretto cashier account\n");

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

    console.log("\nCashier account created successfully.");
    console.log(`Name: ${result.user.name}`);
    console.log(`Email: ${result.user.email}`);
    console.log(
      "\nPublic signup remains disabled when the normal app runs."
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