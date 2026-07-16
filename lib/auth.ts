import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "Loretto Loyalty",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,

    disableSignUp:
      process.env.ALLOW_CASHIER_CREATION !== "true",

    minPasswordLength: 12,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60,
  },

  rateLimit: {
    enabled: true,

    // General authentication limit:
    // maximum 100 auth requests per minute per IP.
    window: 60,
    max: 100,

    // Store counters in Neon instead of server memory.
    storage: "database",

    customRules: {
      // Maximum five login attempts every ten minutes.
      "/sign-in/email": {
        window: 60 * 10,
        max: 5,
      },
    },
  },

  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL ??
      "http://localhost:3000",
  ],
});