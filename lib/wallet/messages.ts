import { passKey, walletRedis } from "./updates";

export type WalletMessage = { text: string; updatedAt: number };
const messageKey = (serial: string) => `${passKey(serial)}:message`;
export async function getWalletMessage(serial: string): Promise<WalletMessage | null> {
  return walletRedis().get<WalletMessage>(messageKey(serial));
}
export async function setWalletMessage(serial: string, text: string) {
  const message = { text, updatedAt: Date.now() };
  // Keep the value stable until explicitly replaced: expiry could create an unwanted alert.
  await walletRedis().set(messageKey(serial), message);
  return message;
}
