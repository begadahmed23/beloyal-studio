import { auth } from "@/lib/auth";

export async function requireAuth(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    return null;
  }

  return session;
}