import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { walletCampaignsEnabledForCafe } from "@/lib/wallet/campaign-access";
import WalletCampaigns from "@/components/wallet/WalletCampaigns";

export default async function CafeCampaignsPage() {
  const auth = await requireAuth(await headers());
  if (!auth) redirect("/login");
  if (auth.isSuperAdmin) redirect("/studio/campaigns");
  if (auth.isCashier || !auth.cafe || !auth.cafeId || !auth.cafe.isActive || !walletCampaignsEnabledForCafe(auth.cafeId)) redirect("/dashboard");
  return <main className="min-h-screen bg-[#f6f6f7] px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
    <div className="mx-auto max-w-6xl">
      <header className="mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4 sm:mx-7">
        <div><p className="text-base font-semibold text-[#18181b]">{auth.cafe.name}</p><p className="mt-1 text-xs text-zinc-500">Wallet Campaigns · BeLoyal</p></div>
        <a href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-zinc-700">← Café admin</a>
      </header>
      <WalletCampaigns businesses={[{ id: auth.cafeId, name: auth.cafe.name }]} initialCafeId={auth.cafeId} />
    </div>
  </main>;
}
