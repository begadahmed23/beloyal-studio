import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";

const productionUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL;

export const auth = betterAuth({
  appName: "Loyalty Platform",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      cafeId: {
        type: "string",
        required: false,
        input: false,
      },

      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "CAFE_ADMIN",
      },
    },
  },

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
    window: 60,
    max: 100,
    storage: "database",

    customRules: {
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
    "http://localhost:3000",
    "https://beloyal-studio.vercel.app",
    ...(productionUrl ? [productionUrl] : []),
  ],
});