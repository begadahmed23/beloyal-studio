"use client";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import WalletCampaigns from "@/components/wallet/WalletCampaigns";
import { walletCampaignsEnabledForCafe } from "@/lib/wallet/campaign-access";
export default function CampaignsPage() {
 const { cafe, theme, userRole } = useCafeTheme();
 if(userRole === "CASHIER" || !walletCampaignsEnabledForCafe(cafe.id)) return null;
 return <div className="min-w-0" style={{color:theme.textPrimary}}><WalletCampaigns businesses={[{id:cafe.id,name:cafe.name}]} initialCafeId={cafe.id} /></div>;
}
