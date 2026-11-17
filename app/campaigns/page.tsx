import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
export default async function CampaignsPage() {
 const auth = await requireAuth(await headers());
 if (!auth) redirect("/login");
 if (auth.isSuperAdmin) redirect("/studio/campaigns");
 redirect("/dashboard/campaigns");
}
