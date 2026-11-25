import type { WalletMessage } from "./messages";

export function birthdayWishMessage(business: string, arabic: boolean) {
  return (arabic
    ? `كل سنة وإنت طيب! مبسوطين إنك معانا في ${business}.`
    : `Happy birthday! Thanks for being part of ${business}.`).slice(0, 180);
}

export function walletCampaignFieldValue(message?: WalletMessage | null) {
  if (!message?.text) return "Your loyalty card is connected.";
  if (!message.campaignId) return message.text;

  // Wallet compares the value of the same field key, then substitutes it into %@.
  // Encode the send version with zero-width characters to retain the visible copy.
  const version = message.updatedAt.toString(2).replace(/[01]/g, bit => bit === "0" ? "\u200B" : "\u2060");
  return message.text + version;
}

export type WalletLocation = { name: string; mapsUrl?: string; latitude: number; longitude: number; message: string };
export type WalletNotificationSettings = { stampSuffix: string; rewardSuffix: string; resetSuffix?: string; nearbyEnabled?: boolean; nearbyMessage?: string; nearbyLatitude?: number | null; nearbyLongitude?: number | null; nearbyMaxDistance?: number; nearbyLocations?: WalletLocation[] };
export const DEFAULT_WALLET_NOTIFICATIONS: WalletNotificationSettings = { stampSuffix: "", rewardSuffix: "", resetSuffix: "A fresh start towards your next reward ✨", nearbyEnabled: false, nearbyMessage: "Your loyalty card, ready for your next visit nearby.", nearbyLatitude: null, nearbyLongitude: null, nearbyMaxDistance: 150 };
// Escape café-authored text for Apple's printf-style changeMessage template.
const literal = (text: string) => text.replace(/%/g, "%%");
export function walletProgressChangeMessage(ready: boolean, rewardName: string, settings: WalletNotificationSettings, reset = false) {
  const base = ready
    ? `Your loyalty progress is now %@. Your reward is ready: ${literal(rewardName)}.`
    : "Your loyalty progress is now %@.";
  const suffix = (ready ? settings.rewardSuffix : reset ? (settings.resetSuffix ?? DEFAULT_WALLET_NOTIFICATIONS.resetSuffix!) : settings.stampSuffix).trim();
  return suffix ? `${base} ${literal(suffix)}` : base;
}
export function walletNotificationPreview(balance: string, ready: boolean, rewardName: string, settings: WalletNotificationSettings) {
  const base = ready ? `Your loyalty progress is now ${balance}. Your reward is ready: ${rewardName}.` : `Your loyalty progress is now ${balance}.`;
  const suffix = (ready ? settings.rewardSuffix : balance.startsWith("0/") ? (settings.resetSuffix ?? DEFAULT_WALLET_NOTIFICATIONS.resetSuffix!) : settings.stampSuffix).trim();
  return suffix ? `${base} ${suffix}` : base;
}

export function configuredWalletLocations(settings?: WalletNotificationSettings): WalletLocation[] {
  if (!settings) return [];
  return settings.nearbyLocations ?? (
    settings.nearbyLatitude != null && settings.nearbyLongitude != null
      ? [{
          name: "Main branch",
          latitude: settings.nearbyLatitude,
          longitude: settings.nearbyLongitude,
          message: settings.nearbyMessage || DEFAULT_WALLET_NOTIFICATIONS.nearbyMessage!,
        }]
      : []
  );
}

export function walletLocations(settings?: WalletNotificationSettings): WalletLocation[] {
  if (!settings?.nearbyEnabled) return [];
  return configuredWalletLocations(settings)
    .filter(l => Number.isFinite(l.latitude) && Number.isFinite(l.longitude) && Math.abs(l.latitude) <= 90 && Math.abs(l.longitude) <= 180)
    .slice(0, 10);
}
