import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  fetchOptions: {
    onError: async (context) => {
      if (context.response.status === 429) {
        const retryAfter =
          context.response.headers.get("X-Retry-After");

        console.warn(
          `Too many login attempts. Retry after ${retryAfter ?? "a few"} seconds.`
        );
      }
    },
  },
});