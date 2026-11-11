import { walletCredential as credential, walletUpdatesEnabled, walletAuthToken } from "./config";
export { appleWalletEnabled } from "./config";
import { getLoyaltyProgressTarget } from "../business/loyalty-target";
import { PKPass } from "passkit-generator";
import sharp from "sharp";

export type WalletMember = {
  id: string;
  publicToken: string;
  memberNumber: string;
  name: string;
  stamps: number;
  rewardEarnedAt: Date | null;
  updatedAt: Date;
  cafe: { name: string; slug: string; theme: string; businessType: "CAFE" | "BARBERSHOP"; rewardTarget: number; rewardName: string; primaryColor: string; backgroundColor: string; updatedAt: Date };
};

function color(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function rgb(hex: string) {
  return `rgb(${[1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(", ")})`;
}

export async function createAppleWalletPass(member: WalletMember) {
  const site = new URL(process.env.APPLE_WALLET_SITE_URL!);
  if (site.protocol !== "https:" && site.hostname !== "localhost") {
    throw new Error("Wallet site URL must use HTTPS.");
  }
  const cardUrl = new URL(`/card/${encodeURIComponent(member.publicToken)}`, site).href;
  const loretto = /loretto/i.test(member.cafe.slug + member.cafe.name);
  const background = loretto ? "#F3EBDD" : color(member.cafe.backgroundColor, "#111111");
  const channels = [1, 3, 5].map((offset) => parseInt(background.slice(offset, offset + 2), 16));
  const light = channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 > 150;
  const foreground = loretto ? "#2E2A27" : light ? "#111111" : "#FFFFFF";
  const target = getLoyaltyProgressTarget(member.cafe);
  const stamps = Math.max(0, Math.min(member.stamps, target));
  const ready = Boolean(member.rewardEarnedAt) || member.stamps >= target;
  const accent = loretto ? "#7E897F" : foreground;
  const escape = (value: string) => value.replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "\'": "&apos;" })[c]!);
  const svgPng = (svg: string) => sharp(Buffer.from(svg)).png().toBuffer();
  const count = Math.min(target, 12);
  const circles = Array.from({ length: count }, (_, i) => {
    const x = 38 + i * (299 / Math.max(count - 1, 1));
    const filled = target > 12 ? i < Math.floor(stamps / target * count) : i < stamps;
    return `<circle cx="${x}" cy="62" r="${Math.min(19, 135 / count)}" fill="${filled ? accent : background}" stroke="${accent}" stroke-width="1.5"/>${filled ? `<path d="M${x-6} 62 l4 4 l8 -9" fill="none" stroke="${background}" stroke-width="2"/>` : ""}`;
  }).join("");
  const strip = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="1125" height="369" viewBox="0 0 375 123"><rect width="375" height="123" fill="${background}"/><text x="187.5" y="23" text-anchor="middle" fill="${foreground}" font-family="sans-serif" font-size="10" letter-spacing="2">${ready ? "YOUR REWARD IS READY" : "LITTLE VISITS. LOVELY REWARDS."}</text>${circles}<text x="187.5" y="110" text-anchor="middle" fill="${foreground}" font-family="sans-serif" font-size="11">${escape(ready ? member.cafe.rewardName : `${stamps} of ${target} ${member.cafe.businessType === "BARBERSHOP" ? "visits" : "stamps"}`)}</text></svg>`);
  const logo = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="150" viewBox="0 0 160 50"><text x="0" y="32" fill="${foreground}" font-family="${loretto ? "serif" : "sans-serif"}" font-weight="bold" font-size="${loretto ? 27 : 18}" textLength="155" lengthAdjust="spacingAndGlyphs">${escape(loretto ? "LORETTO" : member.cafe.name.slice(0,32))}</text>${loretto ? `<text x="1" y="45" fill="${foreground}" font-family="sans-serif" font-size="6.5" letter-spacing="1">ARTISAN COFFEE &amp; BAKERY</text>` : ""}</svg>`);
  // Local artwork only: no requests to customer-controlled logo URLs.
  const icon = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="87" height="87"><rect width="87" height="87" rx="18" fill="${background}"/><text x="43.5" y="62" text-anchor="middle" font-family="sans-serif" font-size="60" font-weight="bold" fill="${foreground}">B</text></svg>`)).png().toBuffer();
  const pass = new PKPass(
    { "icon.png": await sharp(icon).resize(29, 29).png().toBuffer(),
      "icon@2x.png": await sharp(icon).resize(58, 58).png().toBuffer(),
      "icon@3x.png": icon,
      "logo.png": await sharp(logo).resize(160, 50).png().toBuffer(),
      "logo@2x.png": await sharp(logo).resize(320, 100).png().toBuffer(),
      "logo@3x.png": logo,
      "strip.png": await sharp(strip).resize(375,123).png().toBuffer(),
      "strip@2x.png": await sharp(strip).resize(750,246).png().toBuffer(),
      "strip@3x.png": strip },
    { signerCert: await credential("CERT"), signerKey: await credential("KEY"),
      wwdr: await credential("WWDR"), signerKeyPassphrase: process.env.APPLE_WALLET_KEY_PASSPHRASE },
    { serialNumber: member.id,
      passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_WALLET_TEAM_ID!,
      organizationName: member.cafe.name,
      description: `${member.cafe.name} loyalty card`,
      ...(walletUpdatesEnabled() ? { webServiceURL: process.env.APPLE_WALLET_WEB_SERVICE_URL!.replace(/\/$/, ""), authenticationToken: walletAuthToken(member.id) } : {}),
      backgroundColor: rgb(background), foregroundColor: rgb(foreground), labelColor: rgb(foreground) },
  );
  pass.type = "storeCard";
  pass.headerFields.push({ key: "balance", label: ready ? "REWARD READY" : "STAMPS", value: `${stamps}/${target}`, changeMessage: "Your loyalty progress is now %@." });
  pass.secondaryFields.push({ key: "member", label: "MEMBER", value: member.name });
  pass.auxiliaryFields.push({ key: "reward", label: "YOUR REWARD", value: member.cafe.rewardName });
  pass.backFields.push(
    { key: "progress", label: "Live stamps & rewards", value: cardUrl },
    { key: "instructions", label: "How to use", value: "Show this QR code at checkout. Open your online card for your current stamps and rewards." },
    { key: "provider", label: "Powered by", value: "BeLoyal" },
  );
  pass.setBarcodes({ format: "PKBarcodeFormatQR", message: `BL:${member.publicToken}`, messageEncoding: "iso-8859-1", altText: member.memberNumber });
  return pass.getAsBuffer();
}
