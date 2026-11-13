export type WalletNotificationSettings = { stampSuffix: string; rewardSuffix: string; resetSuffix?: string };
export const DEFAULT_WALLET_NOTIFICATIONS: WalletNotificationSettings = { stampSuffix: "", rewardSuffix: "", resetSuffix: "A fresh start towards your next reward ✨" };
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
