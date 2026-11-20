import { passKey, walletRedis } from "./updates";
import { WALLET_CAMPAIGN_PILOT_CAFE_ID } from "./campaign-access";
import { DEFAULT_WALLET_NOTIFICATIONS, type WalletNotificationSettings } from "./notification-text";
const key = (cafeId: string) => `${passKey("notifications")}:cafe:${cafeId}`;
// Correct the original MB nearby entry (its coordinates already belong to Heliopolis).
function correctOriginalMbLocation(cafeId: string, settings: WalletNotificationSettings): WalletNotificationSettings {
  if (cafeId !== "cmwmjxqx60001js07bkfbrj15" || settings.nearbyLocations?.length !== 1) return settings;
  const location = settings.nearbyLocations[0];
  if (location.name !== "فرع الزيتون") return settings;
  return { ...settings, nearbyLocations: [{
    ...location,
    name: "فرع مصر الجديدة",
    message: location.message.replaceAll("فرع الزيتون", "فرع مصر الجديدة"),
  }] };
}
export async function getWalletNotificationSettings(cafeId: string | undefined) {
  if (!cafeId || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return undefined;
  const saved = await walletRedis().get<WalletNotificationSettings>(key(cafeId));
  if (!saved && cafeId !== WALLET_CAMPAIGN_PILOT_CAFE_ID) return undefined;
  return correctOriginalMbLocation(cafeId, { ...DEFAULT_WALLET_NOTIFICATIONS, ...saved });
}
export async function saveWalletNotificationSettings(cafeId: string, settings: WalletNotificationSettings) {
  await walletRedis().set(key(cafeId), settings);
}
