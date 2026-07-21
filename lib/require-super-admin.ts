import { requireAuth } from "@/lib/require-auth";

export async function requireSuperAdmin(
  requestHeaders: Headers
) {
  const authData = await requireAuth(requestHeaders);

  if (
    !authData ||
    authData.user.role !== "SUPER_ADMIN"
  ) {
    return null;
  }

  return authData;
}