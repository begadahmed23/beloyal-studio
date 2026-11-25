import { passKey, walletRedis } from "./updates";

export type WalletMessage = { text: string; updatedAt: number; campaignId?: string };
const messageKey = (serial: string) => `${passKey(serial)}:message`;
export async function getWalletMessage(serial: string): Promise<WalletMessage | null> {
  return walletRedis().get<WalletMessage>(messageKey(serial));
}
export async function setWalletMessage(serial: string, text: string, campaignId?: string) {
  // Keep the value stable until explicitly replaced: expiry could create an unwanted alert.
  // Wallet discovery uses a strict timestamp comparison, even for concurrent writes.
  await walletRedis().eval(`
    local previous = redis.call('GET', KEYS[1])
    local message = cjson.decode(ARGV[1])
    if previous then
      message.updatedAt = math.max(message.updatedAt, cjson.decode(previous).updatedAt + 1)
    end
    return redis.call('SET', KEYS[1], cjson.encode(message))
  `, [messageKey(serial)], [JSON.stringify({ text, updatedAt: Date.now(), campaignId })]);
}
