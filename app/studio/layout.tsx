import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/require-auth";

export default async function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authData = await requireAuth(await headers());

  if (!authData) {
    redirect("/");
  }

  if (!authData.isSuperAdmin) {
    redirect("/dashboard");
  }

  return children;
}