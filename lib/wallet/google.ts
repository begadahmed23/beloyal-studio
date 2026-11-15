import { createHash, sign } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import type { WalletMember } from "./apple";

export class GoogleWalletError extends Error {
  constructor(public readonly stage: string, public readonly status?: number) {
    super(`Google Wallet failed at ${stage}`);
  }
}

export function googleWalletEnabled() {
  return process.env.GOOGLE_WALLET_ENABLED === "true" &&
    Boolean(process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_CLIENT_EMAIL &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY && process.env.GOOGLE_WALLET_SITE_URL && process.env.GOOGLE_WALLET_LOGO_URL);
}
export function normalizeGoogleWalletKey(value: string) {
  let key = value.trim();
  // Accept the JSON field value, a quoted JSON string, or a service-account JSON file.
  if (key.startsWith('"') || key.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(key.replace(/,\s*$/, ""));
      if (typeof parsed === "string") key = parsed;
      else if (parsed && typeof parsed === "object" && "private_key" in parsed && typeof parsed.private_key === "string") key = parsed.private_key;
    } catch { /* Leave malformed input for the signing validator. */ }
  }
  return key.replace(/\\r/g, "\r").replace(/\\n/g, "\n").trim();
}
function jwt(payload: object) {
  const encoded = [ { alg: "RS256", typ: "JWT" }, payload ].map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".");
  try { return `${encoded}.${sign("RSA-SHA256", Buffer.from(encoded), normalizeGoogleWalletKey(process.env.GOOGLE_WALLET_PRIVATE_KEY!)).toString("base64url")}`; } catch { throw new GoogleWalletError("signing"); }
}
const objectId = (id: string) => `${process.env.GOOGLE_WALLET_ISSUER_ID}.member_${createHash("sha256").update(id).digest("hex")}`;
const classId = (slug: string) => `${process.env.GOOGLE_WALLET_ISSUER_ID}.cafe_${createHash("sha256").update(slug).digest("hex")}`;
let cachedToken: { value: string; expires: number } | undefined;
async function accessToken() {
  if (cachedToken && cachedToken.expires > Date.now() + 60000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: AbortSignal.timeout(10000),
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt({
      iss: process.env.GOOGLE_WALLET_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }) }) });
  if (!response.ok) throw new GoogleWalletError("authentication", response.status);
  const data = await response.json();
  cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}
async function api(path: string, method: string, body?: object) {
  return fetch(`https://walletobjects.googleapis.com/walletobjects/v1/${path}`, {
    method, signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}) });
}
export function googleWalletObject(member: WalletMember) {
  const target = getLoyaltyProgressTarget(member.cafe);
  const ready = Boolean(member.rewardEarnedAt) || member.stamps >= target;
  return { id: objectId(member.id), classId: classId(member.cafe.slug), state: "ACTIVE",
    accountId: member.memberNumber, accountName: member.name,
    barcode: { type: "QR_CODE", value: `BL:${member.publicToken}`, alternateText: member.memberNumber },
    loyaltyPoints: { label: ready ? "REWARD READY" : member.cafe.businessType === "BARBERSHOP" ? "VISITS" : "STAMPS",
      balance: { string: `${Math.max(0, Math.min(member.stamps, target))}/${target}` } },
    textModulesData: [{ id: "reward", header: "YOUR REWARD", body: member.cafe.rewardName }],
    linksModuleData: { uris: [{ id: "card", uri: new URL(`/card/${member.publicToken}`, process.env.GOOGLE_WALLET_SITE_URL!).href, description: "Open your BeLoyal card" }] } };
}
export async function createGoogleWalletLink(member: WalletMember) {
  const site = new URL(process.env.GOOGLE_WALLET_SITE_URL!);
  const logo = new URL(process.env.GOOGLE_WALLET_LOGO_URL!);
  if (site.protocol !== "https:" || logo.protocol !== "https:") throw new GoogleWalletError("urls");
  const passClass = { id: classId(member.cafe.slug), issuerName: member.cafe.name, programName: `${member.cafe.name} Rewards`,
    programLogo: { sourceUri: { uri: logo.href }, contentDescription: { defaultValue: { language: "en-US", value: member.cafe.name } } },
    reviewStatus: "UNDER_REVIEW", hexBackgroundColor: /^#[0-9a-f]{6}$/i.test(member.cafe.backgroundColor) ? member.cafe.backgroundColor : "#111111" };
  const createdClass = await api("loyaltyClass", "POST", passClass);
  if (!createdClass.ok && createdClass.status !== 409) throw new GoogleWalletError("program", createdClass.status);
  const object = googleWalletObject(member);
  const createdObject = await api("loyaltyObject", "POST", object);
  if (createdObject.status === 409) {
    const updated = await api(`loyaltyObject/${object.id}`, "PATCH", object);
    if (!updated.ok) throw new GoogleWalletError("card-update", updated.status);
  } else if (!createdObject.ok) throw new GoogleWalletError("card-create", createdObject.status);
  return `https://pay.google.com/gp/v/save/${jwt({ iss: process.env.GOOGLE_WALLET_CLIENT_EMAIL, aud: "google", typ: "savetowallet", iat: Math.floor(Date.now() / 1000), origins: [site.origin], payload: { loyaltyObjects: [{ id: object.id }] } })}`;
}
export async function syncGoogleWalletMember(id: string) {
  if (!googleWalletEnabled()) return;
  const member = await prisma.customer.findUnique({ where: { id }, include: { cafe: true } });
  if (!member) return;
  // Do not create passes for customers who have never requested one.
  const object = googleWalletObject(member);
  const response = await api(`loyaltyObject/${object.id}`, "PATCH", object);
  if (!response.ok && response.status !== 404) throw new Error("Google Wallet balance sync failed.");
}
