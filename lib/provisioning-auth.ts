import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/prisma";

/**
 * Server-only Better Auth instance used by Studio
 * to create café login accounts.
 *
 * Never expose this through a public route.
 */
export const provisioningAuth = betterAuth({
  appName: "Loyalty Platform",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },

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
});