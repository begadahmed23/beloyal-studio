import { readFile } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";

const businessSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const passTypePattern = /^pass(?:\.[a-z0-9-]+){2,}$/i;

export function businessWalletPassTypes(): [string, string][] {
  const raw = process.env.APPLE_WALLET_BUSINESS_PASS_TYPES;
  if (!raw) return [];
  const registry: unknown = JSON.parse(raw);
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    throw new Error("Apple Wallet business pass types must be a JSON object.");
  }
  const seen = new Set([process.env.APPLE_WALLET_PASS_TYPE_ID]);
  return Object.entries(registry).map(([slug, passType]) => {
    if (!businessSlugPattern.test(slug) || typeof passType !== "string" || !passTypePattern.test(passType) || seen.has(passType)) {
      throw new Error("An Apple Wallet business pass type is invalid or duplicated.");
    }
    seen.add(passType);
    return [slug, passType];
  });
}

export function businessWalletPassType(slug: string) {
  return businessWalletPassTypes().find(([business]) => business === slug)?.[1];
}

export function walletPassTypeAvailable(passType: string | undefined) {
  return Boolean(passType && (passType === process.env.APPLE_WALLET_PASS_TYPE_ID ||
    businessWalletPassTypes().some(([, type]) => type === passType)));
}

export function walletPassTypeForBusiness(passType: string, slug: string) {
  // Passes saved before a business moved to a dedicated ID can still update.
  return passType === process.env.APPLE_WALLET_PASS_TYPE_ID || passType === businessWalletPassType(slug);
}

export function walletPassTypesForBusiness(slug?: string) {
  const shared = process.env.APPLE_WALLET_PASS_TYPE_ID!;
  const dedicated = slug && businessWalletPassType(slug);
  return dedicated ? [shared, dedicated] : [shared];
}

function credentialPrefix(passType: string | undefined) {
  if (passType === process.env.APPLE_WALLET_PASS_TYPE_ID) return "APPLE_WALLET";
  const slug = businessWalletPassTypes().find(([, type]) => type === passType)?.[0];
  if (!slug) throw new Error("Apple Wallet pass type is not configured.");
  return `APPLE_WALLET_BUSINESS_${slug.replaceAll("-", "_").toUpperCase()}`;
}

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

export async function walletCredential(name: "CERT" | "KEY" | "WWDR", passType = process.env.APPLE_WALLET_PASS_TYPE_ID) {
  const prefix = name === "WWDR" ? "APPLE_WALLET" : credentialPrefix(passType);
  const pem = process.env[`${prefix}_${name}_PEM`];
  if (pem) return Buffer.from(pem.replace(/\\n/g, "\n"));
  const path = process.env[`${prefix}_${name}_PATH`];
  if (!path) throw new Error("Wallet signing configuration is incomplete.");
  return readFile(path);
}

export function walletKeyPassphrase(passType: string) {
  return process.env[`${credentialPrefix(passType)}_KEY_PASSPHRASE`];
}

export function walletAuthToken(serial: string, passType = process.env.APPLE_WALLET_PASS_TYPE_ID) {
  const secret = process.env.APPLE_WALLET_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Wallet authentication secret is missing.");
  const identifier = passType === process.env.APPLE_WALLET_PASS_TYPE_ID ? serial : `${passType}:${serial}`;
  return createHmac("sha256", secret).update(`apple-wallet:${identifier}`).digest("hex");
}

export function validWalletAuth(serial: string, authorization: string | null, passType = process.env.APPLE_WALLET_PASS_TYPE_ID) {
  if (!authorization || !/^ApplePass [a-f0-9]{64}$/.test(authorization)) return false;
  const token = authorization.slice(10);
  const expected = walletAuthToken(serial, passType);
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
