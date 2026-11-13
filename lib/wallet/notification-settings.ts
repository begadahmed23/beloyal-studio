import { passKey, walletRedis } from "./updates";
import { walletCampaignsEnabledForCafe } from "./campaign-access";
import { DEFAULT_WALLET_NOTIFICATIONS, type WalletNotificationSettings } from "./notification-text";
const key = (cafeId: string) => `${passKey("notifications")}:cafe:${cafeId}`;
export async function getWalletNotificationSettings(cafeId: string | undefined) {
  if (!walletCampaignsEnabledForCafe(cafeId)) return undefined;
  const saved = await walletRedis().get<WalletNotificationSettings>(key(cafeId!));
  return { ...DEFAULT_WALLET_NOTIFICATIONS, ...saved };
}
export async function saveWalletNotificationSettings(cafeId: string, settings: WalletNotificationSettings) {
  await walletRedis().set(key(cafeId), settings);
}
