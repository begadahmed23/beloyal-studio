import { getRewardName } from "../business/terminology";
import { createHash, sign } from "node:crypto";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import { getMbVapeBrandColors, isMbVape, MB_VAPE_ARTWORK_PATH, walletBusinessName } from "../business/mb-vape";
import { walletLocations } from "./notification-text";
import type { WalletMember } from "./apple";
import { LORETTO_DARK } from "./loretto-artwork";

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
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    const code = ["invalid_grant", "invalid_client", "invalid_scope", "unauthorized_client"].includes(failure.error) ? failure.error : "rejected";
    const description = typeof failure.error_description === "string" ? failure.error_description.toLowerCase() : "";
    const reason = description.includes("signature") ? "signature" : description.includes("expired") || description.includes("timeframe") ? "time" : description.includes("account") ? "account" : "other";
    throw new GoogleWalletError(`authentication:${code}:${reason}`, response.status);
  }
  const data = await response.json();
  cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}
async function api(path: string, method: string, body?: object) {
  return fetch(`https://walletobjects.googleapis.com/walletobjects/v1/${path}`, {
    method, signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}) });
}
function walletImage(url: URL, label: string) {
  return { sourceUri: { uri: url.href }, contentDescription: { defaultValue: { language: "en-US", value: label } } };
}

export function googleWalletObject(member: WalletMember) {
  const target = getLoyaltyProgressTarget(member.cafe);
  const ready = Boolean(member.rewardEarnedAt) || member.stamps >= target;
  const stamps = Math.max(0, Math.min(member.stamps, target));
  const site = process.env.GOOGLE_WALLET_SITE_URL!;
  const mbVape = isMbVape(member.cafe);
  const loretto = member.cafe.businessType === "CAFE" && /loretto/i.test(member.cafe.slug + member.cafe.name);
  const artTarget = Math.min(target, 99);
  const artStamps = ready ? artTarget : Math.min(stamps, artTarget);
  const progress = ready ? "Reward ready" : `${stamps}/${target} stamps`;
  const heroImage = loretto ? walletImage(new URL("/api/wallet/artwork/loretto?asset=strip&stamps=" + artStamps + "&target=" + artTarget, site), progress) : mbVape
    ? walletImage(new URL(`${MB_VAPE_ARTWORK_PATH}?asset=strip&stamps=${artStamps}&target=${artTarget}`, site),
        ready ? "All stamps collected. Reward ready." : `${stamps} of ${target} stamps collected.`)
    : undefined;
  return { id: objectId(member.id), classId: classId(member.cafe.slug), state: "ACTIVE",
    accountId: member.memberNumber, accountName: member.name,
    barcode: { type: "QR_CODE", value: `BL:${member.publicToken}`, alternateText: member.memberNumber },
    loyaltyPoints: { label: ready ? "REWARD READY" : member.cafe.businessType === "BARBERSHOP" ? "VISITS" : "STAMPS",
      balance: { string: `${stamps}/${target}` } },
    ...(heroImage ? { heroImage } : {}),
    textModulesData: [
      { id: "reward", header: "YOUR REWARD", body: getRewardName(member.cafe) },
      ...(mbVape ? [{ id: "progress", header: "STAMPS", body: progress }] : []),
    ],
    linksModuleData: { uris: [{ id: "card", uri: new URL(`/card/${member.publicToken}`, site).href, description: "Open your BeLoyal card" }] } };
}
type GoogleBrand = WalletMember["cafe"] & { logoUrl?: string | null };
type GoogleLocation = Parameters<typeof walletLocations>[0];
export function googleClassBrand(savedCafe: GoogleBrand, settings?: GoogleLocation) {
  const cafe = getMbVapeBrandColors(savedCafe);
  const mbVape = isMbVape(cafe);
  const loretto = cafe.businessType === "CAFE" && /loretto/i.test(cafe.slug + cafe.name);
  const displayName = walletBusinessName(cafe);
  const fallback = new URL(process.env.GOOGLE_WALLET_LOGO_URL!);
  let logo = fallback;
  try { if (cafe.logoUrl) { const candidate = new URL(cafe.logoUrl); if (candidate.protocol === "https:") logo = candidate; } } catch { /* use fallback */ }
  const site = process.env.GOOGLE_WALLET_SITE_URL!;
  if (mbVape) logo = new URL(MB_VAPE_ARTWORK_PATH + "?asset=icon&v=2", site);
  if (loretto) logo = new URL("/api/wallet/artwork/loretto?asset=icon&v=1", site);
  return {
    issuerName: displayName,
    programName: mbVape || loretto ? displayName : `${displayName} Rewards`,
    programLogo: walletImage(logo, displayName),
    ...(loretto ? { wideProgramLogo: walletImage(new URL("/api/wallet/artwork/loretto?asset=logo&v=1", site), displayName) } : {}),
    ...(mbVape ? {
      wideProgramLogo: walletImage(new URL(MB_VAPE_ARTWORK_PATH + "?asset=google-logo&v=2", site), displayName),
      accountNameLabel: "MEMBER",
      classTemplateInfo: {
        cardBarcodeSectionDetails: {
          firstTopDetail: { fieldSelector: { fields: [{ fieldPath: "object.textModulesData['progress']" }] } },
        },
        cardTemplateOverride: {
          cardRowTemplateInfos: [{
            twoItems: {
              startItem: { firstValue: { fields: [{ fieldPath: "object.accountName" }] } },
              endItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['reward']" }] } },
            },
          }],
        },
      },
    } : {}),
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: loretto ? LORETTO_DARK : /^#[0-9a-f]{6}$/i.test(cafe.backgroundColor) ? cafe.backgroundColor : "#111111",
    ...(settings ? { merchantLocations: walletLocations(settings).map(({ latitude, longitude }) => ({ latitude, longitude })) } : {}),
  };
}
export async function updateGoogleWalletClass(cafe: GoogleBrand, settings?: GoogleLocation) {
  if (!googleWalletEnabled()) return;
  const response = await api(`loyaltyClass/${classId(cafe.slug)}`, "PATCH", { ...googleClassBrand(cafe, settings), heroImage: null });
  if (!response.ok && response.status !== 404) throw new GoogleWalletError("class-update", response.status);
}
export function scheduleGoogleWalletBrandUpdate(cafe: GoogleBrand) {
  if (!googleWalletEnabled()) return;
  after(async () => {
    try {
      await updateGoogleWalletClass(cafe);
    } catch (error) {
      console.warn("Google Wallet branding update failed", error);
    }
  });
}

export async function googleWalletHasUsers(id: string) {
  if (!googleWalletEnabled()) return false;
  const response = await api(`loyaltyObject/${objectId(id)}`, "GET");
  if (response.status === 404) return false;
  if (!response.ok) throw new GoogleWalletError("audience", response.status);
  return (await response.json()).hasUsers === true;
}
export async function sendGoogleWalletMessage(id: string, campaignId: string, business: string, message: string) {
  if (!await googleWalletHasUsers(id)) return false;
  const response = await api(`loyaltyObject/${objectId(id)}/addMessage`, "POST", { message: { id: campaignId, header: business, body: message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), messageType: "TEXT_AND_NOTIFY" } });
  if (!response.ok) throw new GoogleWalletError("message", response.status);
  return true;
}
export async function createGoogleWalletLink(member: WalletMember & { cafe: GoogleBrand }, settings?: GoogleLocation) {
  const site = new URL(process.env.GOOGLE_WALLET_SITE_URL!);
  const logo = new URL(process.env.GOOGLE_WALLET_LOGO_URL!);
  if (site.protocol !== "https:" || logo.protocol !== "https:") throw new GoogleWalletError("urls");
  const passClass = { id: classId(member.cafe.slug), ...googleClassBrand(member.cafe, settings) };
  const createdClass = await api("loyaltyClass", "POST", passClass);
  if (createdClass.status === 409) await updateGoogleWalletClass(member.cafe, settings);
  else if (!createdClass.ok) throw new GoogleWalletError("program", createdClass.status);
  const object = googleWalletObject(member);
  const createdObject = await api("loyaltyObject", "POST", object);
  if (createdObject.status === 409) {
    const updated = await api(`loyaltyObject/${object.id}`, "PATCH", { ...object, heroImage: object.heroImage ?? null });
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
  const response = await api(`loyaltyObject/${object.id}`, "PATCH", { ...object, heroImage: object.heroImage ?? null });
  if (!response.ok && response.status !== 404) throw new Error("Google Wallet balance sync failed.");
}

export async function googleWalletSavedObjects(slug: string) {
  const ids = new Set<string>();
  if (!googleWalletEnabled() || process.env.GOOGLE_WALLET_CAMPAIGNS_ENABLED !== "true") return ids;
  let pageToken = "";
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({classId: classId(slug), maxResults: "200"});
    if (pageToken) query.set("token", pageToken);
    const response = await api(`loyaltyObject?${query}`, "GET");
    if (response.status === 404 && !pageToken) return ids;
    if (!response.ok) throw new GoogleWalletError("audience-list", response.status);
    const data = await response.json();
    for (const object of data.resources ?? []) if (object.hasUsers === true && typeof object.id === "string") ids.add(object.id);
    pageToken = data.pagination?.nextPageToken ?? "";
    if (!pageToken) return ids;
  }
  throw new GoogleWalletError("audience-pagination");
}
export const googleWalletObjectId = objectId;
