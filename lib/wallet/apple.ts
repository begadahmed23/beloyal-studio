import type { BusinessType } from "@prisma/client";
import { walletLocations } from "./notification-text";
import { walletProgressChangeMessage, type WalletNotificationSettings } from "./notification-text";
import { walletCredential as credential, walletUpdatesEnabled, walletAuthToken } from "./config";
export { appleWalletEnabled } from "./config";
import { businessCardArtwork } from "../business/card-artwork";
import { getLoyaltyProgressTarget } from "../business/loyalty-target";
import { getMbVapeBrandColors, isMbVape } from "../business/mb-vape";
import { renderMbVapeAppleStrip, renderMbVapeLogo } from "./mb-vape-artwork";
import { PKPass } from "passkit-generator";
import sharp from "sharp";
import path from "node:path";

export type WalletMember = {
  id: string;
  publicToken: string;
  memberNumber: string;
  name: string;
  stamps: number;
  rewardEarnedAt: Date | null;
  updatedAt: Date;
  cafe: { name: string; slug: string; theme: string; businessType: BusinessType; rewardTarget: number; rewardName: string; primaryColor: string; secondaryColor?: string; backgroundColor: string; updatedAt: Date };
};

function color(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function rgb(hex: string) {
  return `rgb(${[1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(", ")})`;
}

export async function createAppleWalletPass(member: WalletMember, message?: string, notificationSettings?: WalletNotificationSettings) {
  const site = new URL(process.env.APPLE_WALLET_SITE_URL!);
  if (site.protocol !== "https:" && site.hostname !== "localhost") {
    throw new Error("Wallet site URL must use HTTPS.");
  }
  const cardUrl = new URL(`/card/${encodeURIComponent(member.publicToken)}`, site).href;
  const cafe = getMbVapeBrandColors(member.cafe);
  const { businessType } = cafe;
  const mbVape = isMbVape(cafe);
  const barber = businessType === "BARBERSHOP";
  const walid = barber && member.cafe.slug === "walid-saad";
  const loretto = businessType === "CAFE" && /loretto/i.test(member.cafe.slug + member.cafe.name);
  const background = loretto ? "#F3EBDD" : color(cafe.backgroundColor, "#111111");
  const channels = [1, 3, 5].map((offset) => parseInt(background.slice(offset, offset + 2), 16));
  const light = channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 > 150;
  const foreground = walid ? "#F2EEE7" : loretto ? "#2E2A27" : light ? "#111111" : "#FFFFFF";
  const target = getLoyaltyProgressTarget(member.cafe);
  const stamps = Math.max(0, Math.min(member.stamps, target));
  const ready = Boolean(member.rewardEarnedAt) || member.stamps >= target;
  const accent = loretto ? "#7E897F" : color(cafe.primaryColor, foreground);
  const artwork = loretto || walid ? "" : businessCardArtwork(
    businessType, color(cafe.secondaryColor ?? "", accent), 0.26,
  );
  const escape = (value: string) => value.replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "\'": "&apos;" })[c]!);
  const fontfile = path.join(process.cwd(), "lib/wallet/fonts/DejaVuSans.ttf");
  const textImage = async (value: string, width: number, height: number) => sharp({
    text: { text: `<span foreground="${foreground}">${escape(value)}</span>`,
      font: "DejaVu Sans 48", fontfile, rgba: true },
  }).resize(width, height, { fit: "contain", background: "#00000000" }).png().toBuffer();
  const count = Math.min(target, 12);
  const circles = Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? 187.5 : 60 + i * (255 / (count - 1));
    const filled = target > 12 ? i < Math.floor(stamps / target * count) : i < stamps;
    if (barber && count <= 8) {
      return `<circle cx="${x}" cy="62" r="21" fill="${filled ? accent : background}" stroke="${accent}" stroke-width="1"/><g transform="translate(${x-12},50)" fill="none" stroke="${filled ? foreground : accent}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="${filled ? 1 : 0.55}"><circle cx="5.5" cy="6.5" r="3"/><path d="M7.8 8.25 11.5 12 20.5 6.8"/><circle cx="5.5" cy="17.5" r="3"/><path d="M7.8 15.75 11.5 12 20.5 17.2"/><circle cx="11.5" cy="12" r="1" fill="${filled ? foreground : accent}" stroke="none"/></g>`;
    }
    const radius = Math.min(19, 125 / count);
    const style = `fill="${filled ? accent : background}" stroke="${accent}" stroke-width="1.5"`;
    const marker = businessType === "VAPE" || businessType === "OTHER"
      ? `<rect x="${x - radius}" y="${62 - radius}" width="${radius * 2}" height="${radius * 2}" rx="${businessType === "VAPE" ? 4 : 11}" ${style}/>`
      : `<circle cx="${x}" cy="62" r="${radius}" ${style}/>`;
    const check = filled ? `<path d="M${x-6} 62 l4 4 l8 -9" fill="none" stroke="${background}" stroke-width="2"/>` : "";
    return marker + check;
  }).join("");
  // Wallet crops the sides of store-card strips; keep stamps within the safe centre.
  const strip = mbVape ? await renderMbVapeAppleStrip(ready ? target : stamps, target) : await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1125" height="369" viewBox="0 0 375 123"><rect width="375" height="123" fill="${background}"/>${artwork}${circles}</svg>`))
    .composite([
      { input: await textImage(ready ? "YOUR REWARD IS READY" : walid ? "YOUR NEXT FREE HAIRCUT" : "A LITTLE CLOSER TO YOUR REWARD", 840, 35), left: 142, top: 30 },
      { input: await textImage(ready ? member.cafe.rewardName : `${stamps} of ${target} ${barber ? "visits" : "stamps"}`, 800, 44), left: 162, top: 292 },
    ]).png().toBuffer();
  const logo = mbVape ? await renderMbVapeLogo(480, 150, background) : await sharp({ create: { width: 480, height: 150, channels: 4, background: "#00000000" } })
    .composite([
      { input: await textImage(loretto ? "LORETTO" : walid ? member.cafe.name.toUpperCase().slice(0,32) : member.cafe.name.slice(0, 32), 460, 85), left: 0, top: 8 },
      ...(walid ? [{ input: await textImage("BARBERSHOP", 320, 22), left: 0, top: 110 }] : []),
      ...(loretto ? [{ input: await textImage("ARTISAN COFFEE & BAKERY", 450, 22), left: 5, top: 110 }] : []),
    ]).png().toBuffer();
  const icon = mbVape ? await renderMbVapeLogo(87, 87, "#ffffff", 8) : await sharp({ create: { width: 87, height: 87, channels: 4, background } })
    .composite([{ input: await textImage(walid ? "WS" : "B", 54, 65), left: 16, top: 11 }]).png().toBuffer();
  const stripHeight = mbVape ? 144 : 123;
  const locations = walletLocations(notificationSettings);
  const nearby = locations.length ? notificationSettings : null;
  const pass = new PKPass(
    { "icon.png": await sharp(icon).resize(29, 29).png().toBuffer(),
      "icon@2x.png": await sharp(icon).resize(58, 58).png().toBuffer(),
      "icon@3x.png": icon,
      "logo.png": await sharp(logo).resize(160, 50).png().toBuffer(),
      "logo@2x.png": await sharp(logo).resize(320, 100).png().toBuffer(),
      "logo@3x.png": logo,
      "strip.png": await sharp(strip).resize(375, stripHeight).png().toBuffer(),
      "strip@2x.png": await sharp(strip).resize(750, stripHeight * 2).png().toBuffer(),
      "strip@3x.png": strip },
    { signerCert: await credential("CERT"), signerKey: await credential("KEY"),
      wwdr: await credential("WWDR"), signerKeyPassphrase: process.env.APPLE_WALLET_KEY_PASSPHRASE },
    { serialNumber: member.id,
      passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_WALLET_TEAM_ID!,
      ...(nearby ? { maxDistance: nearby.nearbyMaxDistance ?? 150 } : walid ? { maxDistance: 150 } : {}),
      organizationName: member.cafe.name,
      description: `${member.cafe.name} loyalty card`,
      ...(walletUpdatesEnabled() ? { webServiceURL: process.env.APPLE_WALLET_WEB_SERVICE_URL!.replace(/\/$/, ""), authenticationToken: walletAuthToken(member.id) } : {}),
      backgroundColor: rgb(background), foregroundColor: rgb(foreground), labelColor: rgb(foreground) },
  );
  pass.type = "storeCard";
  if (nearby) {
    pass.setLocations(...locations.map(({latitude, longitude, message}) => ({latitude, longitude, relevantText: message})));
  }
  if (walid) {
    if (!nearby) pass.setLocations({ latitude: 31.2299403, longitude: 29.9547298,
      relevantText: "Near Waleed Saad? Have your loyalty card ready for your next visit." });
    pass.backFields.push({ key: "walid-reward-status", label: "REWARD STATUS",
      value: ready ? `Your reward is ready at ${member.cafe.name}: ${member.cafe.rewardName}.` : "Collect visits toward your next free haircut.",
      changeMessage: "%@" });
    pass.backFields.push({ key: "shop-location", label: "FIND WALEED SAAD",
      value: "467 Abou Quer, Fleming, Alexandria\nhttps://maps.app.goo.gl/DLqwQhwqEPJCnfpd8" });
  }
  const balanceChangeMessage = notificationSettings
    ? walletProgressChangeMessage(ready, member.cafe.rewardName, notificationSettings, !ready && stamps === 0)
    : "Your loyalty progress is now %@.";
  pass.headerFields.push({ key: "balance", label: ready ? "REWARD READY" : barber ? "VISITS" : "STAMPS", value: `${stamps}/${target}`, ...(walid ? {} : { changeMessage: balanceChangeMessage }) });
  pass.secondaryFields.push({ key: "member", label: "MEMBER", value: member.name });
  pass.auxiliaryFields.push({ key: "reward", label: "YOUR REWARD", value: member.cafe.rewardName });
  pass.backFields.push({ key: "member-message", label: "CARD UPDATE",
    value: message || "Your loyalty card is connected.", changeMessage: "%@" });
  pass.backFields.push(
    { key: "progress", label: "Live stamps & rewards", value: cardUrl },
    { key: "instructions", label: "How to use", value: "Show this QR code at checkout. Open your online card for your current stamps and rewards." },
    { key: "provider", label: "Powered by", value: "BeLoyal" },
  );
  pass.setBarcodes({ format: "PKBarcodeFormatQR", message: `BL:${member.publicToken}`, messageEncoding: "iso-8859-1", altText: member.memberNumber });
  return pass.getAsBuffer();
}
