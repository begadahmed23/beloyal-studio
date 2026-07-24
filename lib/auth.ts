import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "Loyalty Platform",

  baseURL: {
  allowedHosts: [
    "localhost:*",
    "getbeloyal.app",
    "www.getbeloyal.app",
    "*.vercel.app",
  ],
  protocol: "auto",
  fallback: "https://getbeloyal.app",
},

trustedOrigins: [
  "http://localhost:3000",
  "https://getbeloyal.app",
  "https://www.getbeloyal.app",
  "https://*.vercel.app",
],

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
});