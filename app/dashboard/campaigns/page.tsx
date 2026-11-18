"use client";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import WalletCampaigns from "@/components/wallet/WalletCampaigns";
export default function CampaignsPage() {
 const { cafe, theme, userRole } = useCafeTheme();
 if(userRole === "CASHIER") return null;
 return <div className="min-w-0" style={{"--wallet-surface":theme.surface,"--wallet-raised":theme.surfaceRaised,"--wallet-border":theme.border,"--wallet-text":theme.textPrimary,"--wallet-secondary":theme.textSecondary,"--wallet-muted":theme.textMuted,"--wallet-accent":theme.accent,"--wallet-accent-text":theme.accentText,color:theme.textPrimary} as React.CSSProperties}><WalletCampaigns branded businesses={[{id:cafe.id,name:cafe.name}]} initialCafeId={cafe.id} /></div>;
}
