import { readFile } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";

export function appleWalletEnabled() {
  return Boolean(process.env.APPLE_WALLET_ENABLED === "true" &&
    process.env.APPLE_WALLET_TEAM_ID && process.env.APPLE_WALLET_PASS_TYPE_ID &&
    (process.env.APPLE_WALLET_CERT_PEM || process.env.APPLE_WALLET_CERT_PATH) &&
    (process.env.APPLE_WALLET_KEY_PEM || process.env.APPLE_WALLET_KEY_PATH) &&
    (process.env.APPLE_WALLET_WWDR_PEM || process.env.APPLE_WALLET_WWDR_PATH) && process.env.APPLE_WALLET_SITE_URL);
}

export function walletUpdatesEnabled() {
  const url = process.env.APPLE_WALLET_WEB_SERVICE_URL;
  if (!appleWalletEnabled() || !url || (process.env.APPLE_WALLET_AUTH_SECRET?.length ?? 0) < 32) return false;
  try { return new URL(url).protocol === "https:"; } catch { return false; }
}

export async function walletCredential(name: "CERT" | "KEY" | "WWDR") {
  const pem = process.env[`APPLE_WALLET_${name}_PEM`];
  if (pem) return Buffer.from(pem.replace(/\\n/g, "\n"));
  const path = process.env[`APPLE_WALLET_${name}_PATH`];
  if (!path) throw new Error("Wallet signing configuration is incomplete.");
  return readFile(path);
}

export function walletAuthToken(serial: string) {
  const secret = process.env.APPLE_WALLET_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Wallet authentication secret is missing.");
  return createHmac("sha256", secret).update(`apple-wallet:${serial}`).digest("hex");
}

export function validWalletAuth(serial: string, authorization: string | null) {
  if (!authorization || !/^ApplePass [a-f0-9]{64}$/.test(authorization)) return false;
  const token = authorization.slice(10);
  const expected = walletAuthToken(serial);
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
