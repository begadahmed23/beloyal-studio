import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const auth = await requireAuth(await headers());

  if (auth?.isSuperAdmin) redirect("/studio");
  if (auth?.cafe?.isActive) redirect("/dashboard");

  return <LoginForm />;
}
