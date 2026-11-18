import { passKey, walletRedis } from "./updates";
import { WALLET_CAMPAIGN_PILOT_CAFE_ID } from "./campaign-access";
import { DEFAULT_WALLET_NOTIFICATIONS, type WalletNotificationSettings } from "./notification-text";
const key = (cafeId: string) => `${passKey("notifications")}:cafe:${cafeId}`;
export async function getWalletNotificationSettings(cafeId: string | undefined) {
  if (!cafeId || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return undefined;
  const saved = await walletRedis().get<WalletNotificationSettings>(key(cafeId));
  if (!saved && cafeId !== WALLET_CAMPAIGN_PILOT_CAFE_ID) return undefined;
  return { ...DEFAULT_WALLET_NOTIFICATIONS, ...saved };
}
export async function saveWalletNotificationSettings(cafeId: string, settings: WalletNotificationSettings) {
  await walletRedis().set(key(cafeId), settings);
}
